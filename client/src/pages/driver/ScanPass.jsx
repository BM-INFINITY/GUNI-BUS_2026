import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import "./ScanPass.css";

const isDev = import.meta.env.MODE === "development";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ScanPass() {
    const navigate = useNavigate();

    // Trip detection is now AUTOMATIC (Time-Based)
    // const [tripType, setTripType] = useState('pickup'); // REMOVED

    const [mockTime, setMockTime] = useState(""); //temp
    const [lastScan, setLastScan] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [endingTrip, setEndingTrip] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(null); // 'granted', 'denied', 'prompt'

    // Track active TripType in Ref for scanner callback
    // const tripTypeRef = useRef(tripType); // REMOVED
    const isCooldownRef = useRef(false);
    const html5QrCodeRef = useRef(null);
    const mockTimeRef = useRef(mockTime);

    // Sync ref with state so callback sees fresh value
    useEffect(() => {
        mockTimeRef.current = mockTime;
    }, [mockTime]);

    useEffect(() => {
        const initScanner = async () => {
            // ... (Init logic remains same) ...
            // Cleanup previous instance if exists
            if (html5QrCodeRef.current) {
                try {
                    if (html5QrCodeRef.current.isScanning) {
                        await html5QrCodeRef.current.stop();
                    }
                    html5QrCodeRef.current.clear();
                } catch (e) {
                    console.error("Cleanup error", e);
                }
            }

            const html5QrCode = new Html5Qrcode("reader");
            html5QrCodeRef.current = html5QrCode;

            try {
                // Check cameras
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setCameraPermission("granted");

                    // Start Camera
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                        },
                        onScanSuccess,
                        onScanFailure,
                    );
                } else {
                    setError("No cameras found.");
                }
            } catch (err) {
                console.error("Camera Init Error:", err);
                setCameraPermission("denied");
                setError("Camera permission denied or not available.");
            }
        };

        initScanner();

        return () => {
            if (html5QrCodeRef.current) {
                try {
                    html5QrCodeRef.current
                        .stop()
                        .then(() => {
                            html5QrCodeRef.current.clear();
                        })
                        .catch(() => { });
                } catch (e) { }
            }
        };
    }, []);

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (isCooldownRef.current) return;

        // ... (Sound/Vibration logic check if needed, omitted in snippet but exists in file) ...
        // Simplest to just keep existing blocking logic

        isCooldownRef.current = true;
        setProcessing(true);

        try {
            const token = localStorage.getItem("token");
            // const currentTripType = tripTypeRef.current; // REMOVED

            // USE UNIFIED SCAN ENDPOINT (No tripType sent)
            //   const res = await axios.post(
            //     `${API_URL}/driver/scan`,
            //     { qrData: decodedText },
            //     { headers: { Authorization: `Bearer ${token}` } },
            //   );

            const payload = {
                qrData: decodedText,
            };

            // DEV ONLY: attach mockTime from REF (to avoid stale closure)
            const currentMockTime = mockTimeRef.current;
            if (currentMockTime) {
                console.log("Adding Mock Time:", currentMockTime);
                payload.mockTime = new Date(currentMockTime).toISOString();
            }

            console.log("Scanning with payload:", payload);

            const res = await axios.post(`${API_URL}/driver/scan`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const apiData = res.data;
            const newResult = {
                success: true,
                timestamp: new Date(),
                message: apiData.message,
                // Handle new nested student object vs old flat structure
                student: apiData.student?.name || apiData.student,
                enrollment: apiData.student?.enrollment || apiData.enrollment,
                studentPhoto: apiData.student?.photo, // New Field
                studentDOB: apiData.student?.dob,     // New Field
                studentMobile: apiData.student?.mobile, // New Field
                passShift: apiData.shift || apiData.passShift,
                // DayTicket specific fields
                type: apiData.type,
                scanCount: apiData.scanCount,
                maxScans: apiData.maxScans,
            };

            setLastScan(newResult);
            setScanHistory((prev) => [newResult, ...prev]);
            setError("");
        } catch (err) {
            console.error("Scan failed:", err);
            const msg = err.response?.data?.message || "Scan failed";

            if (err.response?.data?.alreadyScanned) {
                // ... warning logic ...
                const warningResult = {
                    success: false,
                    warning: true,
                    timestamp: new Date(),
                    ...err.response.data,
                };
                setLastScan(warningResult);
            } else {
                setError(msg);
                setLastScan(null);
            }
        } finally {
            setProcessing(false);

            setTimeout(() => {
                isCooldownRef.current = false;
                setError("");
            }, 2500);
        }
    };

    // ... onScanFailure ...
    const onScanFailure = (err) => {
        // console.warn(err);
    };

    const handleEndTrip = async () => {
        // ... unchanged ...
        if (!window.confirm(`End Trip ? This resets your bus occupancy to 0.`))
            return;

        setEndingTrip(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_URL}/admin/scanpassRoute/end-trip`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
            alert("Trip Ended. Occupancy Reset.");
            setScanHistory([]);
            setLastScan(null);
        } catch (err) {
            alert(
                "Failed to end trip: " +
                (err.response?.data?.message || "Server Error"),
            );
        } finally {
            setEndingTrip(false);
        }
    };

    return (
        <div className="scan-page-modern">
            <header className="scan-header-modern">
                <button className="back-icon-btn" onClick={() => navigate("/driver")}>
                    <svg
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                </button>
                <div className="header-center-info">
                    <h2>Rapid Scan</h2>
                    <span className="session-count">Session: {scanHistory.length}</span>
                </div>

                <button
                    className="reset-trip-btn"
                    onClick={handleEndTrip}
                    disabled={endingTrip}
                >
                    {endingTrip ? "..." : "End Trip"}
                </button>
            </header>

            <div className="scan-content-wrapper turbo-mode">
                {/* AUTOMATED TRIP TYPE - NO UI TOGGLE NEEDED */}
                <div
                    className="trip-type-info"
                    style={{ textAlign: "center", margin: "10px 0", opacity: 0.7 }}
                >
                    <small>Time-Based Trip Detection Active</small>
                </div>

                <div className="scanner-layout">
                    <div className="scanner-card compact">
                        <div className="scanner-window-wrapper">
                            <div id="reader" className="qr-reader-modern"></div>

                            <div
                                className={`scan-overlay ${processing ? "active-pulse" : ""}`}
                            >
                                <div className="corner clean-top-left"></div>
                                <div className="corner clean-top-right"></div>
                                <div className="corner clean-bottom-right"></div>
                                <div className="corner clean-bottom-left"></div>
                            </div>

                            {processing && (
                                <div className="processing-indicator">
                                    <div className="spinner-micro"></div>
                                    <span>Verifying...</span>
                                </div>
                            )}

                            {error && error.includes("permission") && (
                                <div className="permission-retry-overlay">
                                    <p>{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="retry-btn"
                                    >
                                        Retry Camera
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="live-result-zone">
                        {/* ... Error & Result Display ... */}
                        {error && !error.includes("permission") && (
                            <div className="result-flash error animate-pop-in">
                                <div className="flash-icon">
                                    {error.includes("Valid for") ? "🚫" : "❌"}
                                </div>
                                <div className="flash-content">
                                    <h3>Scan Failed</h3>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        {lastScan && (
                            <div
                                className={`result-flash ${lastScan.success ? "success" : lastScan.warning ? "warning" : "error"} animate-pop-in`}
                                key={lastScan.timestamp.getTime()}
                            >
                                <div className="flash-icon">
                                    {lastScan.success ? "✅" : lastScan.warning ? "⚠️" : "⛔"}
                                </div>
                                <div className="flash-content">
                                    <h3>{lastScan.message}</h3>
                                    {lastScan.student && (
                                        <div className="student-result-card">
                                            {lastScan.studentPhoto && (
                                                <img
                                                    src={lastScan.studentPhoto}
                                                    alt="Student"
                                                    className="student-scan-photo"
                                                />
                                            )}
                                            <div className="student-scan-details">
                                                <p className="student-name-large">{lastScan.student}</p>
                                                <p className="student-enrollment">{lastScan.enrollment}</p>

                                                <div className="student-extra-info">
                                                    {lastScan.studentDOB && (
                                                        <span className="info-badge">
                                                            🎂 {new Date(lastScan.studentDOB).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {lastScan.studentMobile && (
                                                        <span className="info-badge">
                                                            📞 {lastScan.studentMobile}
                                                        </span>
                                                    )}
                                                    {lastScan.passShift && (
                                                        <span className="info-badge shift-badge">
                                                            {lastScan.passShift} Batch
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!lastScan && !error && (
                            <div className="ready-state-msg">
                                <p>Ready to Scan...</p>
                            </div>
                        )}
                        {/* ENABLED FOR PRODUCTION DEMO */}
                        {true && (
                            <div
                                style={{
                                    marginBottom: "12px",
                                    padding: "10px",
                                    border: "1px dashed #999",
                                    borderRadius: "6px",
                                    background: "#fafafa",
                                }}
                            >
                                <label style={{ fontWeight: "bold" }}>
                                    DEV ONLY – Mock Scan Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={mockTime}
                                    onChange={(e) => setMockTime(e.target.value)}
                                    style={{ width: "100%", marginTop: "6px" }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
