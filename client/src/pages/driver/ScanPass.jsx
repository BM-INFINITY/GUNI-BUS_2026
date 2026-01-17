import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import './ScanPass.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ScanPass() {
    const navigate = useNavigate();

    // Default to Pickup (Going to College)
    const [tripType, setTripType] = useState('pickup');

    const [lastScan, setLastScan] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [endingTrip, setEndingTrip] = useState(false);

    // Track active TripType in Ref for scanner callback
    const tripTypeRef = useRef(tripType);

    const isCooldownRef = useRef(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        tripTypeRef.current = tripType;
    }, [tripType]);

    useEffect(() => {
        startScanner();
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(console.error);
                } catch (e) { }
            }
        };
    }, []);

    const startScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.clear();
            } catch (e) { }
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                videoConstraints: {
                    facingMode: "environment"
                }
            },
            false
        );

        scannerRef.current = scanner;

        try {
            // Note: Html5QrcodeScanner.render() is not async but it might throw synchronously
            scanner.render(onScanSuccess, (error) => {
                // Ignore minor scanning errors (frame didn't have QR)
                // But logging unique errors might help debugging
                if (typeof error === 'string' && !error.includes("No MultiFormat Readers")) {
                    console.warn(error);
                }
            });
        } catch (e) {
            console.error("Camera start error:", e);
            setError("Camera failed to start. Please check permissions.");
        }
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (isCooldownRef.current) return;

        isCooldownRef.current = true;
        setProcessing(true);

        try {
            const token = localStorage.getItem('token');
            const currentTripType = tripTypeRef.current; // Get dynamic ref value

            // Send 'tripType' (pickup/drop) to backend
            const res = await axios.post(
                `${API_URL}/admin/scanpassRoute/scan-pass`,
                { qrData: decodedText, tripType: currentTripType },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newResult = {
                success: true,
                timestamp: new Date(),
                ...res.data
            };

            setLastScan(newResult);
            setScanHistory(prev => [newResult, ...prev]);
            setError('');

        } catch (err) {
            console.error("Scan failed:", err);
            const msg = err.response?.data?.message || "Scan failed";

            if (err.response?.data?.alreadyScanned) {
                const warningResult = {
                    success: false,
                    warning: true,
                    timestamp: new Date(),
                    ...err.response.data
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
                setError('');
            }, 2500);
        }
    };

    const onScanFailure = (err) => { };

    const handleEndTrip = async () => {
        if (!confirm(`End Trip? This resets your bus occupancy to 0.`)) return;

        setEndingTrip(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/admin/scanpassRoute/end-trip`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Trip Ended. Occupancy Reset.");
            setScanHistory([]);
            setLastScan(null);
        } catch (err) {
            alert("Failed to end trip: " + (err.response?.data?.message || "Server Error"));
        } finally {
            setEndingTrip(false);
        }
    };

    return (
        <div className="scan-page-modern">
            <header className="scan-header-modern">
                <button className="back-icon-btn" onClick={() => navigate('/driver')}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
                    {endingTrip ? '...' : 'End Trip'}
                </button>
            </header>

            <div className="scan-content-wrapper turbo-mode">

                {/* TRIP TYPE TOGGLE */}
                <div className="trip-type-toggle-container">
                    <div className="toggle-wrapper">
                        <button
                            className={`toggle-btn ${tripType === 'pickup' ? 'active' : ''}`}
                            onClick={() => setTripType('pickup')}
                        >
                            🌅 Going to College
                        </button>
                        <button
                            className={`toggle-btn ${tripType === 'drop' ? 'active' : ''}`}
                            onClick={() => setTripType('drop')}
                        >
                            🏠 Going Home
                        </button>
                    </div>
                </div>

                <div className="scanner-layout">
                    <div className="scanner-card compact">
                        <div className="scanner-window-wrapper">
                            <div id="reader" className="qr-reader-modern"></div>

                            <div className={`scan-overlay ${processing ? 'active-pulse' : ''}`}>
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
                        </div>
                    </div>

                    <div className="live-result-zone">
                        {error && (
                            <div className="result-flash error animate-pop-in">
                                <div className="flash-icon">
                                    {error.includes("Valid for") ? '🚫' : '❌'}
                                </div>
                                <div className="flash-content">
                                    <h3>Scan Failed</h3>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        {lastScan && (
                            <div className={`result-flash ${lastScan.success ? 'success' : lastScan.warning ? 'warning' : 'error'} animate-pop-in`} key={lastScan.timestamp.getTime()}>
                                <div className="flash-icon">
                                    {lastScan.success ? '✅' : lastScan.warning ? '⚠️' : '⛔'}
                                </div>
                                <div className="flash-content">
                                    <h3>{lastScan.message}</h3>
                                    {lastScan.student && (
                                        <>
                                            <p className="student-name-large">{lastScan.student}</p>
                                            <div className="mini-meta">
                                                <span>{lastScan.enrollment}</span>
                                                {lastScan.passShift && (
                                                    <>
                                                        <span>•</span>
                                                        <span style={{ textTransform: 'capitalize' }}>{lastScan.passShift} Batch</span>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {!lastScan && !error && (
                            <div className="ready-state-msg">
                                <p>Ready for <strong>{tripType === 'pickup' ? 'Pickup' : 'Drop'}</strong> scan...</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
