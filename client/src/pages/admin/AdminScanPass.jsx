import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { scan } from "../../services/api";
import "./AdminScanPass.css";

export default function AdminScanPass() {
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scanType, setScanType] = useState("checkin");

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanning(false);

        try {
          const response = await scan.post({
            qrData: decodedText,
            scanType: scanType,
          });

          setMessage(`✅ ${response.data.message}`);
        } catch (err) {
          setError(
            err.response?.data?.message ||
            err.message ||
            JSON.stringify(err)
          );
        }
      },
      () => {
        // ignore frame errors
      }
    );

    return () => {
      scanner.clear().catch(() => { });
    };
  }, [scanning, scanType]);

  return (
    <section className="admin-scan-pass-page">
      <header className="scan-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Scan Bus Pass</h1>
      </header>

      {/* Scan Type */}
      <div className="scan-type">
        <button
          className={scanType === "checkin" ? "active" : ""}
          onClick={() => setScanType("checkin")}
        >
          Check-In
        </button>
        <button
          className={scanType === "checkout" ? "active" : ""}
          onClick={() => setScanType("checkout")}
        >
          Check-Out
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {scanning && (
        <div className="qr-scanner">
          <div id="qr-reader" className="camera-box"></div>
          <p className="hint">Align QR inside the frame</p>
        </div>
      )}

      {!scanning && (
        <button
          className="primary-btn"
          onClick={() => {
            setScanning(true);
            setMessage("");
            setError("");
          }}
        >
          Scan Another Pass
        </button>
      )}
    </section>
  );
}
