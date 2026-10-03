"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
} from "html5-qrcode";

const CAMERA_TARGET_ID = "attendance-qr-scanner-camera";

type ScannerCameraProps = {
  enabled: boolean;
  restartKey: number;
  onDecoded: (value: string) => void;
  onCameraError: (message: string) => void;
  onStarted: () => void;
};

export function ScannerCamera({
  enabled,
  restartKey,
  onDecoded,
  onCameraError,
  onStarted,
}: ScannerCameraProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraChangeKey, setCameraChangeKey] = useState(0);
  const [cameraMessage, setCameraMessage] = useState("Requesting camera access…");
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const selectedCameraIdRef = useRef("");

  useEffect(() => {
    let disposed = false;
    const scanner = new Html5Qrcode(
      CAMERA_TARGET_ID,
      {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      },
    );
    let startPromise: Promise<unknown> | null = null;
    let cleanupPromise: Promise<void> | null = null;

    async function cleanupScanner() {
      if (cleanupPromise) {
        return cleanupPromise;
      }

      const pendingStart = startPromise;
      cleanupPromise = (async () => {
        if (pendingStart) {
          await pendingStart.catch(() => undefined);
        }

        const state = scanner.getState();

        if (
          state === Html5QrcodeScannerState.SCANNING
          || state === Html5QrcodeScannerState.PAUSED
        ) {
          try {
            await scanner.stop();
          } catch {
            // The camera may have stopped during route transition.
          }
        }

        try {
          scanner.clear();
        } catch {
          // The scanner may not have created its target markup yet.
        }
      })();

      return cleanupPromise;
    }

    async function startScanner() {
      if (!enabled) {
        return;
      }

      try {
        const availableCameras = await Html5Qrcode.getCameras();

        if (disposed) {
          return;
        }

        if (availableCameras.length === 0) {
          setCameraMessage("No camera was found on this device.");
          onCameraError("No camera was found on this device.");
          return;
        }

        setCameras(availableCameras);
        const preferredCamera = getPreferredCamera(availableCameras);
        const cameraId = availableCameras.some(
          (camera) => camera.id === selectedCameraIdRef.current,
        )
          ? selectedCameraIdRef.current
          : preferredCamera.id;

        selectedCameraIdRef.current = cameraId;
        setSelectedCameraId(cameraId);

        try {
          startPromise = scanner.start(
            cameraId,
            {
              aspectRatio: 1,
              fps: 10,
              qrbox: {
                height: 250,
                width: 250,
              },
            },
            (decodedText) => {
              onDecoded(decodedText);
            },
            () => undefined,
          );
          await startPromise;
        } finally {
          startPromise = null;
        }

        if (!disposed) {
          setCameraMessage("");
          onStarted();
        }
      } catch (error) {
        if (!disposed) {
          const message = getCameraErrorMessage(error);
          setCameraMessage(message);
          onCameraError(message);
        }
      }
    }

    void startScanner();

    return () => {
      disposed = true;
      void cleanupScanner();
    };
  }, [
    cameraChangeKey,
    enabled,
    onCameraError,
    onDecoded,
    onStarted,
    restartKey,
  ]);

  function handleCameraChange(event: ChangeEvent<HTMLSelectElement>) {
    selectedCameraIdRef.current = event.target.value;
    setSelectedCameraId(event.target.value);
    setCameraChangeKey((key) => key + 1);
  }

  return (
    <div className="attendance-scanner-camera-shell">
      <div
        id={CAMERA_TARGET_ID}
        className="attendance-scanner-camera-target"
        aria-label="QR attendance camera preview"
      />
      {cameraMessage || !enabled ? (
        <p className="attendance-scanner-camera-message" role="status" aria-live="polite">
          {enabled ? cameraMessage : "Camera is paused. Choose Try Camera Again to restart it."}
        </p>
      ) : null}

      {cameras.length > 1 ? (
        <label className="attendance-scanner-camera-select">
          <span>Camera</span>
          <select value={selectedCameraId} onChange={handleCameraChange}>
            {cameras.map((camera, index) => (
              <option value={camera.id} key={camera.id}>
                {camera.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

function getPreferredCamera(cameras: CameraDevice[]) {
  return (
    cameras.find((camera) => /back|rear|environment/i.test(camera.label))
    ?? cameras[0]
  );
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera permission was denied. Enable camera access in your browser settings and try again.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No camera was found on this device.";
    }
  }

  return "The camera could not be started. You can paste a QR value below for development testing.";
}
