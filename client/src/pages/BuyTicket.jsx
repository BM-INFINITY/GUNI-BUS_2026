import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes as routesAPI, tickets, shifts as shiftsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BuyTicket() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedShift, setSelectedShift] = useState('');
    const [currentShift, setCurrentShift] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [routesRes, shiftsRes] = await Promise.all([
                    routesAPI.getAll(),
                    shiftsAPI.getCurrent()
                ]);
                setRoutes(routesRes.data);
                setCurrentShift(shiftsRes.data.shift);
                setSelectedShift(shiftsRes.data.shift); // Pre-select current shift
            } catch (err) {
                setError('Failed to load data');
                console.error('Error:', err);
            }
        };
        fetchData();
    }, []);

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        const route = routes.find(r => r._id === routeId);
        setSelectedRoute(route);
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedRoute || !selectedShift) {
            setError('Please select route and shift');
            return;
        }

        setLoading(true);

        try {
            const response = await tickets.purchase({
                routeId: selectedRoute._id,
                shift: selectedShift,
                paymentId: 'DEMO_' + Date.now() // Demo payment ID
            });

            setSuccess('Ticket purchased successfully! Your QR code is ready.');

            setTimeout(() => {
                navigate('/student');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to purchase ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/student')} className="back-button">← Back</button>
                <h1>Buy One-Day Ticket</h1>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form className="buy-ticket-form" onSubmit={handlePurchase}>
                <div className="current-shift-info">
                    <h3>Current Shift: {currentShift === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}</h3>
                    <p>{currentShift === 'morning' ? '8:30 AM - 2:10 PM' : '11:40 AM - 5:20 PM'}</p>
                </div>

                <div className="form-group">
                    <label>Select Route *</label>
                    <select
                        required
                        value={selectedRoute?._id || ''}
                        onChange={handleRouteChange}
                    >
                        <option value="">-- Select a route --</option>
                        {routes.map(route => (
                            <option key={route._id} value={route._id}>
                                {route.routeName} ({route.routeNumber})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedRoute && (
                    <div className="route-details">
                        <h3>Route Details:</h3>
                        <p><strong>From:</strong> {selectedRoute.startPoint}</p>
                        <p><strong>To:</strong> {selectedRoute.endPoint}</p>
                    </div>
                )}

                <div className="form-group">
                    <label>Select Shift *</label>
                    <select
                        required
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value)}
                    >
                        <option value="morning">Morning Shift (8:30 AM - 2:10 PM)</option>
                        <option value="afternoon">Afternoon Shift (11:40 AM - 5:20 PM)</option>
                    </select>
                </div>

                {selectedRoute && selectedShift && (
                    <div className="stops-container">
                        <h3>Bus Stops ({selectedShift} shift):</h3>
                        <div className="stops-list">
                            {selectedRoute.shifts
                                ?.find(s => s.shiftType === selectedShift)
                                ?.stops.slice(0, 5).map((stop, index) => (
                                    <div key={index} className="stop-item">
                                        <span className="stop-number">{index + 1}</span>
                                        <div className="stop-details">
                                            <strong>{stop.name}</strong>
                                            <span className="stop-time">{stop.arrivalTime}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <p className="stops-note">+ {selectedRoute.shifts?.find(s => s.shiftType === selectedShift)?.stops.length - 5} more stops</p>
                    </div>
                )}

                <div className="form-group">
                    <label>Ticket Price</label>
                    <input type="text" value="₹50 (One-day, Single-use)" disabled />
                </div>

                <div className="form-info">
                    <p><strong>Note:</strong> This ticket is valid for TODAY only and can be used ONCE.</p>
                    <p><strong>Validity:</strong> {new Date().toLocaleDateString()}</p>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Purchase Ticket (₹50)'}
                </button>
            </form>
        </div>
    );
}
