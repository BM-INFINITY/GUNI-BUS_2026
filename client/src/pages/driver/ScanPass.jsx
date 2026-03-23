import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

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
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto w-full max-w-lg mx-auto pb-8">
            <div className="bg-white px-5 py-4 border-b border-slate-100 mb-4 sticky top-0 z-10 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                    Scan Pass
                </h2>
            </div>

            <div className="px-4 flex flex-col items-center">
                {/* Scanner Interface */}
                <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6 relative">
                    <div id="reader" className="w-full min-h-[300px] bg-slate-900 flex items-center justify-center relative">
                        {processing && (
                            <div className="absolute inset-0 z-20 bg-indigo-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                <div className="w-12 h-12 border-4 border-indigo-400 border-t-white rounded-full animate-spin mb-3"></div>
                                <span className="font-semibold tracking-wider">Verifying...</span>
                            </div>
                        )}
                        {/* Overlay frame for QR target */}
                        <div className={`absolute inset-4 border-2 rounded-2xl z-10 pointer-events-none transition-colors duration-300 ${processing ? 'border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'border-white/30'}`}>
                            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                        </div>
                    </div>

                    {error && error.includes("permission") && (
                        <div className="p-6 text-center bg-red-50 text-red-600 border-t border-red-100">
                            <p className="font-medium mb-3">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform active:scale-95 shadow-sm"
                            >
                                Retry Camera
                            </button>
                        </div>
                    )}
                </div>

                {/* Status/Result Area */}
                <div className="w-full">
                    {error && !error.includes("permission") && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4 animate-[bounce_0.5s_ease-in-out]">
                            <div className="flex gap-4 items-start">
                                <div className="text-3xl flex-shrink-0">
                                    {error.includes("Valid for") ? "🚫" : "❌"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-800 text-lg">Scan Failed</h3>
                                    <p className="text-red-600 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {lastScan && (
                        <div
                            className={`rounded-2xl p-5 mb-4 shadow-sm border transition-all transform animate-[bounce_0.5s_ease-in-out] ${lastScan.success
                                ? "bg-emerald-50 border-emerald-200"
                                : lastScan.warning
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                            key={lastScan.timestamp.getTime()}
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 items-start">
                                    <div className="text-3xl flex-shrink-0">
                                        {lastScan.success ? "✅" : lastScan.warning ? "⚠️" : "⛔"}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-bold text-lg leading-tight ${lastScan.success ? 'text-emerald-800' : lastScan.warning ? 'text-amber-800' : 'text-red-800'
                                            }`}>
                                            {lastScan.message}
                                        </h3>
                                    </div>
                                </div>

                                {lastScan.student && (
                                    <div className="bg-white/60 rounded-xl p-4 flex gap-4 mt-2">
                                        {lastScan.studentPhoto ? (
                                            <img
                                                src={lastScan.studentPhoto}
                                                alt="Student"
                                                className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 border border-slate-300">
                                                {lastScan.student.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="font-bold text-slate-800 text-lg leading-tight truncate">{lastScan.student}</p>
                                            <p className="text-slate-500 font-mono text-sm mb-2">{lastScan.enrollment}</p>

                                            <div className="flex flex-wrap gap-2">
                                                {lastScan.passShift && (
                                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                                        {lastScan.passShift}
                                                    </span>
                                                )}
                                                {lastScan.studentDOB && (
                                                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        <span>🎂</span> {new Date(lastScan.studentDOB).toLocaleDateString()}
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
                        <div className="text-center p-8 bg-slate-100 rounded-2xl border border-slate-200 border-dashed">
                            <span className="text-4xl block mb-2 opacity-50">📱</span>
                            <p className="text-slate-500 font-medium">Position QR code in the frame</p>
                        </div>
                    )}

                    {/* ENABLED FOR PRODUCTION DEMO */}
                    {true && (
                        <div className="mt-8 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-100/50">
                            <label className="block font-bold text-slate-600 text-xs uppercase tracking-wider mb-2">
                                DEV ONLY – Mock Scan Time
                            </label>
                            <input
                                type="datetime-local"
                                value={mockTime}
                                onChange={(e) => setMockTime(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
