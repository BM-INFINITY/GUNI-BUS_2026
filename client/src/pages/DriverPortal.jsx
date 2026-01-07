import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { buses, shifts as shiftsAPI } from '../services/api';

export default function DriverPortal() {
    const { user, logout } = useAuth();
    const [currentShift, setCurrentShift] = useState('');
    const [activeBuses, setActiveBuses] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [scanInput, setScanInput] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shiftRes, busesRes] = await Promise.all([
                    shiftsAPI.getCurrent(),
                    buses.getAll()
                ]);
                setCurrentShift(shiftRes.data.shift);
                setActiveBuses(busesRes.data);
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchData();
    }, []);

    const handleOccupancyChange = async (busId, increment) => {
        try {
            await buses.updateOccupancy(busId, { increment });
            // Refresh buses
            const response = await buses.getAll();
            setActiveBuses(response.data);
        } catch (error) {
            console.error('Error updating occupancy:', error);
        }
    };

    return (
        <div className="dashboard">
            <header>
                <h1>Driver Portal</h1>
                <div>
                    <span>Driver: {user?.name}</span>
                    <button onClick={logout}>Logout</button>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Current Shift */}
                <div className="card card-highlight">
                    <h2>Current Shift</h2>
                    <div className="shift-display">
                        <h3>{currentShift === 'morning' ? '🌅 Morning Shift' : '🌆 Afternoon Shift'}</h3>
                        <p>{currentShift === 'morning' ? '8:30 AM - 2:10 PM' : '11:40 AM - 5:20 PM'}</p>
                    </div>
                </div>

                {/* Scanner */}
                <div className="card">
                    <h2>Scan Pass/Ticket</h2>
                    <p>Use QR scanner or enter enrollment number</p>
                    <div className="scanner-area">
                        <input
                            type="text"
                            placeholder="Enrollment number or scan QR"
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                        />
                        <button disabled>Scan (Coming Soon)</button>
                    </div>
                </div>

                {/* Bus Occupancy */}
                <div className="card card-full">
                    <h2>Bus Occupancy Management</h2>
                    {activeBuses.length === 0 ? (
                        <p>No active buses</p>
                    ) : (
                        <div className="bus-list">
                            {activeBuses.map(bus => (
                                <div key={bus._id} className="bus-item">
                                    <div className="bus-info">
                                        <h4>Bus {bus.busNumber}</h4>
                                        <p>Route: {bus.route?.routeName || 'N/A'}</p>
                                        <p>Shift: {bus.shift}</p>
                                    </div>
                                    <div className="occupancy-controls">
                                        <button onClick={() => handleOccupancyChange(bus._id, false)}>-</button>
                                        <span className="occupancy-count">
                                            {bus.currentOccupancy || 0} / {bus.capacity}
                                        </span>
                                        <button onClick={() => handleOccupancyChange(bus._id, true)}>+</button>
                                    </div>
                                    <div className={`occupancy-indicator ${(bus.currentOccupancy / bus.capacity) > 0.8 ? 'full' :
                                            (bus.currentOccupancy / bus.capacity) > 0.5 ? 'medium' : 'empty'
                                        }`}>
                                        {Math.round((bus.currentOccupancy / bus.capacity) * 100)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
