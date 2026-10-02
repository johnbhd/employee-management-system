"use client";

import { FormEvent, useCallback, useRef, useState } from "react";

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
  | "success"
  | "invalid"
  | "error";

type ScannerApiResponse = QrResolveSuccessResponse | ApiErrorResponse;

export function ScannerPage() {
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [cameraRestartKey, setCameraRestartKey] = useState(0);
  const [manualQrValue, setManualQrValue] = useState("");
  const [message, setMessage] = useState("Starting camera…");
  const [result, setResult] = useState<QrResolveData | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>("initializing");
  const resolvingRef = useRef(false);

  const resolveQrValue = useCallback(async (qrValue: string) => {
    if (resolvingRef.current || !qrValue.trim()) {
      return;
    }

    resolvingRef.current = true;
    setMessage("Validating employee QR…");
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
      setMessage("Employee identity verified.");
      setScannerState("success");
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

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void resolveQrValue(manualQrValue);
  }

  function handleScanNext() {
    setManualQrValue("");
    setMessage("Starting camera…");
    setResult(null);
    setScannerState("initializing");
    setCameraResetKey((key) => key + 1);
  }

  function retryCamera() {
    setMessage("Starting camera…");
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
        {result ? (
          <ScannedEmployeeCard result={result} onScanNext={handleScanNext} />
        ) : (
          <>
            <div className="attendance-scanner-camera-frame">
              <ScannerCamera
                enabled={cameraEnabled}
                onCameraError={handleCameraError}
                onDecoded={handleCameraDecoded}
                onStarted={handleCameraStarted}
                restartKey={cameraResetKey + cameraRestartKey}
              />
            </div>

            <div className={`attendance-scanner-state attendance-scanner-state-${scannerState}`} role="status" aria-live="polite">
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
          </>
        )}
      </section>

      {!result ? (
        <section className="attendance-scanner-manual" aria-labelledby="scanner-manual-heading">
          <div>
            <span className="attendance-scanner-kicker">Development fallback</span>
            <h2 id="scanner-manual-heading">Paste a QR value</h2>
            <p>
              Use this only when camera access is unavailable. The value is still validated by the server.
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
                Validate QR
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
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
    return "Employee information is temporarily unavailable. Try again.";
  }

  return "Invalid or unrecognized employee QR.";
}
