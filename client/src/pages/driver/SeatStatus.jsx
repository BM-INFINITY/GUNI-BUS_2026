import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { seatReservation, driver as driverApi } from '../../services/api';
import { ChevronLeft, ArrowRight } from 'lucide-react';

// ───────────── Helpers ─────────────
function toDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ───────────── Layout Generator ─────────────
function generateSeatLayout(totalSeats) {
    const rows = [];
    let seatNum = 1;
    while (seatNum <= totalSeats) {
        const row = [];
        
        // Check if there are exactly 6 seats remaining (the continuous back row)
        if (totalSeats - seatNum + 1 === 6) {
            for (let i = 0; i < 6; i++) {
                row.push({ num: seatNum, window: i === 0 || i === 5 });
                seatNum++;
            }
            rows.push(row);
            break;
        }

        // Left side: 2 seats
        for (let i = 0; i < 2 && seatNum <= totalSeats; i++) {
            row.push({ num: seatNum, window: i === 0 });
            seatNum++;
        }
        
        if (seatNum <= totalSeats) {
            row.push({ num: null, aisle: true }); // aisle gap
        }
        
        // Right side: 3 seats
        for (let i = 0; i < 3 && seatNum <= totalSeats; i++) {
            row.push({ num: seatNum, window: i === 2 });
            seatNum++;
        }
        rows.push(row);
    }
    return rows;
}

// ───────────── Seat Cell ─────────────
function SeatCell({ seat, taken }) {
    if (!seat || seat.aisle) {
        return <div className="w-8 h-8" />;
    }
    const base = 'relative w-9 h-9 flex items-center justify-center text-[10px] font-bold border transition-all duration-150 select-none cursor-default';
    // Rounded top, flat bottom to look like a seat
    const styling = taken
        ? 'bg-indigo-500 border-indigo-600 text-white rounded-t-2xl rounded-b-md shadow-md shadow-indigo-200'
        : 'bg-white border-slate-300 text-slate-500 rounded-t-2xl rounded-b-md';

    return (
        <div className={`${base} ${styling}`} title={taken ? 'Reserved' : 'Available'}>
            {seat.num}
            {seat.window && !taken && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 border border-white" title="Window" />
            )}
        </div>
    );
}

// ───────────── Main Component ─────────────
export default function SeatStatus() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [busData, setBusData] = useState(null);
    const [routeData, setRouteData] = useState(null);
    
    const [direction, setDirection] = useState('home_to_uni');
    const [seatMapData, setSeatMapData] = useState(null);

    const fetchStatus = useCallback(async () => {
        try {
            setError('');
            setLoading(true);

            // 1. Get assigned bus & route
            const dashRes = await driverApi.getDashboard();
            const driver = dashRes.data.driver;

            if (!driver?.assignedBus || !driver?.assignedRoute) {
                setBusData(null);
                setRouteData(null);
                setLoading(false);
                return;
            }

            setBusData(driver.assignedBus);
            setRouteData(driver.assignedRoute);

            // 2. Fetch seat map
            const today = toDateKey(new Date());
            const mapRes = await seatReservation.getSeatMap(driver.assignedBus._id, today, driver.assignedRoute._id, direction);
            setSeatMapData(mapRes.data);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Failed to load seat status');
        } finally {
            setLoading(false);
        }
    }, [direction]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading live seat status...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-red-100">
                    <div className="text-red-500 mb-4 text-4xl">⚠️</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Seats</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/driver')}
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!busData || !routeData) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
                    <div className="text-slate-400 mb-4 text-5xl">🚌</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Assignment</h2>
                    <p className="text-slate-600 mb-6">You need an active bus and route assignment to view the seat map.</p>
                    <button
                        onClick={() => navigate('/driver')}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const totalSeats = seatMapData?.totalSeats || busData.capacity || 50;
    const takenSeats = seatMapData?.takenSeats || [];
    const seatRows = generateSeatLayout(totalSeats);

    return (
        <div className="min-h-screen bg-transparent flex flex-col font-sans">
            {/* Header */}
            <div className="mb-6 sticky top-0 z-10 bg-slate-50 border-b border-slate-200 py-3">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-slate-800">Live Seat Status</h1>
                    <p className="text-sm font-medium text-slate-500 line-clamp-1">
                        {busData.busNumber} • {routeData.routeNumber} ({routeData.routeName})
                    </p>
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col gap-6 pb-6">
                
                {/* Direction Toggle */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
                    <button
                        onClick={() => setDirection('home_to_uni')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            direction === 'home_to_uni'
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Home <ArrowRight size={16} /> Uni
                    </button>
                    <button
                        onClick={() => setDirection('uni_to_home')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            direction === 'uni_to_home'
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Uni <ArrowRight size={16} /> Home
                    </button>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white border border-slate-300"></div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-500 border border-indigo-600 shadow-sm shadow-indigo-200"></div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reserved</span>
                    </div>
                </div>

                {/* Seat Map */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col items-center">
                    <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 mb-8 w-full text-center pb-4 border-b border-dashed border-slate-200">
                        FRONT OF BUS
                    </div>

                    <div className="flex flex-col gap-3">
                        {seatRows.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex items-center gap-1.5">
                                <span className="w-6 text-right mr-3 text-xs font-bold text-slate-300 font-mono">
                                    {rowIdx + 1}
                                </span>
                                {row.map((seat, colIdx) => (
                                    <SeatCell
                                        key={colIdx}
                                        seat={seat}
                                        taken={seat?.num ? takenSeats.includes(seat.num) : false}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 mt-8 w-full text-center pt-4 border-t border-dashed border-slate-200">
                        REAR
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-indigo-900 mb-1">Total Occupancy</p>
                        <p className="text-2xl font-black text-indigo-700">
                            {takenSeats.length} <span className="text-base font-bold text-indigo-400">/ {totalSeats}</span>
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                    </div>
                </div>

            </div>
        </div>
    );
}
