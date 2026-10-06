"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Icon } from "@/components/ui/Icon";
import type { ApiErrorResponse } from "@/types/api/responses";
import type {
  QrResolveData,
  QrResolveSuccessResponse,
} from "@/types/attendance-qr";

import { ScannedEmployeeCard } from "./ScannedEmployeeCard";
import { ScannerCamera } from "./ScannerCamera";

type ScannerState =
  | "initializing"
  | "scanning"
  | "validating"
  | "time_in_success"
  | "time_out_success"
  | "already_completed"
  | "duplicate_scan"
  | "invalid"
  | "error";

type ScannerApiResponse = QrResolveSuccessResponse | ApiErrorResponse;

export function ScannerPage() {
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [cameraRestartKey, setCameraRestartKey] = useState(0);
  const [manualQrValue, setManualQrValue] = useState("");
  const [message, setMessage] = useState("Starting camera...");
  const [result, setResult] = useState<QrResolveData | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>("initializing");
  const resolvingRef = useRef(false);

  const resetScanner = useCallback(() => {
    setManualQrValue("");
    setMessage("Starting camera...");
    setResult(null);
    setScannerState("initializing");
    setCameraResetKey((key) => key + 1);
  }, []);

  const resolveQrValue = useCallback(async (qrValue: string) => {
    if (resolvingRef.current || !qrValue.trim()) {
      return;
    }

    resolvingRef.current = true;
    setMessage("Validating employee QR...");
    setResult(null);
    setScannerState("validating");

    try {
      const response = await fetch(
        "/api/v1/attendance/qr/resolve",
        {
          body: JSON.stringify({
            qrValue: qrValue.trim(),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );
      const body = await response.json() as ScannerApiResponse;

      if (!response.ok || !body.success) {
        setScannerState(getErrorState(response.status));
        setMessage(getScannerErrorMessage(response.status));
        return;
      }

      setResult(body.data);
      setMessage(getAttendanceSuccessMessage(body.data.action));
      setScannerState(getAttendanceSuccessState(body.data.action));
    } catch {
      setScannerState("error");
      setMessage("The scanner could not reach the validation service. Try again.");
    } finally {
      resolvingRef.current = false;
    }
  }, []);

  const handleCameraError = useCallback((error: string) => {
    setMessage(error);
    setScannerState("error");
  }, []);

  const handleCameraStarted = useCallback(() => {
    setMessage("Camera ready. Position an employee QR inside the frame.");
    setScannerState("scanning");
  }, []);

  const handleCameraDecoded = useCallback((value: string) => {
    void resolveQrValue(value);
  }, [resolveQrValue]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resetScanner();
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resetScanner, result]);

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void resolveQrValue(manualQrValue);
  }

  function retryCamera() {
    setMessage("Starting camera...");
    setScannerState("initializing");
    setCameraRestartKey((key) => key + 1);
  }

  const cameraEnabled = scannerState === "initializing" || scannerState === "scanning";

  return (
    <div className="attendance-scanner-page">
      <div className="attendance-scanner-intro">
        <span className="attendance-scanner-kicker">Attendance operations</span>
        <h1>QR Attendance Scanner</h1>
        <p>Scan an employee&apos;s attendance QR code to verify their identity.</p>
      </div>

      <section className="attendance-scanner-panel" aria-label="QR attendance scanner">
        <div className="attendance-scanner-workspace">
          <div className="attendance-scanner-camera-column">
            <div className="attendance-scanner-camera-frame">
              <ScannerCamera
                enabled={cameraEnabled}
                onCameraError={handleCameraError}
                onDecoded={handleCameraDecoded}
                onStarted={handleCameraStarted}
                restartKey={cameraResetKey + cameraRestartKey}
              />
            </div>

            <div
              className={`attendance-scanner-state attendance-scanner-state-${scannerState}`}
              role="status"
              aria-live="polite"
            >
              <span className="attendance-scanner-state-icon" aria-hidden="true">
                <Icon name={scannerState === "error" || scannerState === "invalid" ? "warning" : "qr"} />
              </span>
              <span>{message}</span>
            </div>

            {scannerState === "invalid" || scannerState === "error" ? (
              <button
                type="button"
                className="attendance-scanner-secondary-button"
                onClick={retryCamera}
              >
                <Icon name="refresh" />
                Try Camera Again
              </button>
            ) : null}
          </div>

          <div className="attendance-scanner-result-column">
            {result ? (
              <ScannedEmployeeCard result={result} onScanNext={resetScanner} />
            ) : (
              <ScannerWaitingPanel message={message} state={scannerState} />
            )}
          </div>
        </div>
      </section>

      {!result ? (
        <section className="attendance-scanner-manual" aria-labelledby="scanner-manual-heading">
          <div>
            <span className="attendance-scanner-kicker">Development fallback</span>
            <h2 id="scanner-manual-heading">Paste a QR value</h2>
            <p>
              Use this when camera access is unavailable. A valid value uses the same server flow and may record a development attendance action.
            </p>
          </div>
          <form className="attendance-scanner-manual-form" onSubmit={handleManualSubmit}>
            <label htmlFor="attendance-scanner-manual-value">QR value</label>
            <div>
              <input
                id="attendance-scanner-manual-value"
                value={manualQrValue}
                onChange={(event) => setManualQrValue(event.target.value)}
                placeholder="Paste an AU-JSC attendance QR value"
                autoComplete="off"
              />
              <button
                type="submit"
                className="attendance-scanner-primary-button"
                disabled={scannerState === "validating" || !manualQrValue.trim()}
              >
                Submit QR scan
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function ScannerWaitingPanel({
  message,
  state,
}: {
  message: string;
  state: ScannerState;
}) {
  const isAttentionState = state === "error" || state === "invalid";
  const heading = state === "validating"
    ? "Validating QR"
    : isAttentionState
      ? "Scanner needs attention"
      : "Waiting for scan";

  return (
    <section
      className={`attendance-scanner-result attendance-scanner-waiting-panel${isAttentionState ? " attendance-scanner-waiting-panel-attention" : ""}`}
      aria-labelledby="scanner-waiting-heading"
    >
      <div className="attendance-scanner-waiting-icon" aria-hidden="true">
        <Icon name={isAttentionState ? "warning" : "qr"} />
      </div>
      <div>
        <span className="attendance-scanner-kicker">Employee result</span>
        <h2 id="scanner-waiting-heading">{heading}</h2>
      </div>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {state === "initializing" || state === "scanning" ? (
        <p className="attendance-scanner-waiting-help">
          Scan an employee QR code to view verified information and attendance status.
        </p>
      ) : null}
    </section>
  );
}

function getErrorState(status: number): ScannerState {
  if (status === 401 || status === 403 || status >= 500) {
    return "error";
  }

  return "invalid";
}

function getScannerErrorMessage(status: number) {
  if (status === 401) {
    return "Your scanner session has expired. Sign in again.";
  }

  if (status === 403) {
    return "This account is not authorized to operate the scanner.";
  }

  if (status === 404) {
    return "The employee record for this QR is unavailable.";
  }

  if (status >= 500) {
    return "The attendance service is temporarily unavailable. Try again.";
  }

  return "Invalid or unrecognized AU-JSC attendance QR.";
}

function getAttendanceSuccessState(
  action: QrResolveData["action"],
): ScannerState {
  if (action === "time_in") {
    return "time_in_success";
  }

  if (action === "time_out") {
    return "time_out_success";
  }

  if (action === "duplicate_scan") {
    return "duplicate_scan";
  }

  return "already_completed";
}

function getAttendanceSuccessMessage(
  action: QrResolveData["action"],
) {
  if (action === "time_in") {
    return "Time In recorded successfully.";
  }

  if (action === "time_out") {
    return "Time Out recorded successfully.";
  }

  if (action === "duplicate_scan") {
    return "This scan was received too soon after the previous scan.";
  }

  return "Attendance is already completed for today.";
}
