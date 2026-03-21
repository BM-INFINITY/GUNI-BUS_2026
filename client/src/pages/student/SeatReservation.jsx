import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { seatReservation } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import {
    Bus, Calendar, Armchair, CheckCircle, ChevronLeft, ChevronRight,
    Zap, AlertCircle, Repeat2, CalendarDays, ArrowRight
} from 'lucide-react';

// ───────────── Helpers ──────────────────────────────────
function toDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getUpcomingWorkingDays(n = 14) {
    const days = [];
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    let i = 1;
    while (days.length < n) {
        const next = new Date(d);
        next.setDate(d.getDate() + i);
        if (next.getDay() !== 0) days.push(next); // skip Sundays
        i++;
    }
    return days;
}

// ───────────── Seat Layout Generator ────────────────────
// Row pattern: [1w, 2, (aisle), 3, 4, 5w], [6w, 7, (aisle), 8, 9, 10w] ...
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

// ───────────── Seat Cell Component ──────────────────────
function SeatCell({ seat, taken, selected, mine, onSelect }) {
    if (!seat || seat.aisle) {
        return <div className="w-8 h-8" />;
    }
    const isAvailable = !taken && !mine;
    const base = 'relative w-9 h-9 rounded-t-2xl rounded-b-md flex items-center justify-center text-[10px] font-bold border transition-all duration-150 cursor-pointer select-none';
    let style = '';
    if (mine) style = 'bg-indigo-500 border-indigo-600 text-white shadow-md shadow-indigo-200';
    else if (selected) style = 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-200 scale-105';
    else if (taken) style = 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed';
    else style = 'bg-white border-slate-300 text-slate-600 hover:bg-emerald-50 hover:border-emerald-400 hover:scale-105';

    return (
        <button
            className={`${base} ${style}`}
            onClick={() => isAvailable && onSelect(seat.num)}
            disabled={taken || mine}
            title={mine ? 'Your current seat' : taken ? 'Taken' : `Seat ${seat.num}${seat.window ? ' (Window)' : ''}`}
        >
            {seat.num}
            {seat.window && !taken && !mine && !selected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 border border-white" title="Window" />
            )}
        </button>
    );
}

// ───────────── Main Component ────────────────────────────
export default function SeatReservation() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=Trip Details, 2=Seat Map, 3=Confirm

    // Step 1 state
    const [duration, setDuration] = useState('single_day');
    const [tripType, setTripType] = useState('one_way');
    const [selectedDates, setSelectedDates] = useState([]);
    const [direction, setDirection] = useState('home_to_uni');
    const [selectedBus, setSelectedBus] = useState(null);

    // Step 2 state
    const [seatMapData, setSeatMapData] = useState(null);
    const [pickedSeat, setPickedSeat] = useState(null);
    const [loadingMap, setLoadingMap] = useState(false);

    // General
    const [buses, setBuses] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState('');

    const workingDays = getUpcomingWorkingDays(14);

    useEffect(() => {
        fetchBuses();
    }, []);

    const fetchBuses = async () => {
        try {
            const res = await seatReservation.getAvailableBuses();
            setBuses(res.data.buses || []);
            setRouteInfo(res.data.route);
            setRewardPoints(res.data.rewardPoints ?? 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load available buses.');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Step 1 → 2 transition ──
    const proceedToSeatMap = async () => {
        if (!selectedBus) return setError('Please select a bus.');
        if (selectedDates.length === 0) return setError('Please select at least one date.');

        setError('');
        setLoadingMap(true);

        try {
            // Use the first selected date and the first direction for the seat map preview
            const dateForMap = selectedDates[0];
            const dirForMap = tripType === 'round_trip' ? 'home_to_uni' : direction;
            const res = await seatReservation.getSeatMap(selectedBus._id, dateForMap, routeInfo._id, dirForMap);
            setSeatMapData(res.data);
            setPickedSeat(res.data.myReservedSeat || null);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load seat map.');
        } finally {
            setLoadingMap(false);
        }
    };

    // ── Step 2 → 3 ──
    const proceedToConfirm = () => {
        if (!pickedSeat) return setError('Please pick a seat.');
        setError('');
        setStep(3);
    };

    // ── Final booking ──
    const confirmBooking = async () => {
        setBooking(true);
        setError('');
        try {
            const dirs = tripType === 'round_trip'
                ? ['home_to_uni', 'uni_to_home']
                : [direction];

            const finalTripType = (duration === 'multi_day' && tripType === 'one_way') ? 'multi_day' : tripType;

            await seatReservation.book({
                busId: selectedBus._id,
                routeId: routeInfo._id,
                dates: selectedDates,
                seatNumber: pickedSeat,
                tripType: finalTripType,
                directions: dirs
            });

            showToast('✅ Seat reserved successfully!', 'success');
            setTimeout(() => navigate('/student/my-reservations'), 1800);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
            setBooking(false);
        }
    };

    // ── Calculate cost ──
    const totalSlots = tripType === 'round_trip' ? selectedDates.length * 2 : selectedDates.length;
    const totalCost = selectedBus ? selectedBus.pointCostPerSeat * totalSlots : 0;
    const canAfford = rewardPoints >= totalCost;

    // ── Seat layout ──
    const seatRows = seatMapData ? generateSeatLayout(seatMapData.totalSeats) : [];

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                        >
                            {toast.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Armchair className="w-6 h-6 text-indigo-600" /> Reserve a Seat
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Spend your reward points to claim a specific seat on the bus.</p>
                </div>

                {/* Points Banner */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl px-5 py-4 mb-6 shadow-lg">
                    <Zap className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Your Reward Points</div>
                        <div className="text-3xl font-black">{rewardPoints}</div>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {['Trip Details', 'Pick Seat', 'Confirm'].map((label, i) => {
                        const num = i + 1;
                        const active = step === num;
                        const done = step > num;
                        return (
                            <div key={label} className="flex items-center gap-2 flex-1">
                                <div className={`flex items-center gap-2 ${active || done ? 'text-indigo-700' : 'text-slate-400'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? 'bg-indigo-600 border-indigo-600 text-white' : active ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-slate-300 text-slate-400'}`}>
                                        {done ? <CheckCircle className="w-4 h-4" /> : num}
                                    </div>
                                    <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-indigo-700' : done ? 'text-indigo-500' : 'text-slate-400'}`}>{label}</span>
                                </div>
                                {i < 2 && <div className={`flex-1 h-0.5 rounded ${step > num ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
                            </div>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* No buses available */}
                {buses.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <Bus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-600 font-bold text-lg">No Buses Available</p>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                            We found your bus pass for <strong>{routeInfo?.routeName} ({routeInfo?.routeNumber})</strong>, but no buses are currently assigned to this route with seat reservation enabled.
                        </p>
                        <div className="mt-6 p-4 bg-indigo-50 rounded-2xl inline-block text-left border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Admin Tip:</h4>
                            <p className="text-[11px] text-indigo-600 leading-relaxed">
                                Go to <strong>Manage Buses</strong> → <strong>Edit Bus</strong> and ensure:<br/>
                                1. <strong>Seat Reservation</strong> is checked.<br/>
                                2. <strong>Assigned Route</strong> matches <em>{routeInfo?.routeNumber}</em><br/>
                                3. OR add <em>{routeInfo?.routeNumber}</em> to <strong>Allowed Routes</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: Trip Details ── */}
                {buses.length > 0 && step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                        {/* Select Bus */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Bus</label>
                            <div className="space-y-2">
                                {buses.map(bus => (
                                    <button
                                        key={bus._id}
                                        onClick={() => setSelectedBus(bus)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedBus?._id === bus._id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedBus?._id === bus._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Bus className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{bus.busNumber}</div>
                                                    <div className="text-xs text-slate-500">{bus.manufacturer} {bus.model} · {bus.capacity} seats · <span className="capitalize">{bus.busType}</span></div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-indigo-600">{bus.pointCostPerSeat} pts</div>
                                                <div className="text-[10px] text-slate-400">per seat</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Trip Duration & Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'single_day', label: 'Single Day', icon: Calendar },
                                        { value: 'multi_day', label: 'Multiple Days', icon: CalendarDays }
                                    ].map(({ value, label, icon: Icon }) => (
                                        <button
                                            key={value}
                                            onClick={() => { setDuration(value); setSelectedDates([]); }}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${duration === value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                        >
                                            <Icon className={`w-4 h-4 mb-1 ${duration === value ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <div className={`text-xs font-bold ${duration === value ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trip Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Trip Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'one_way', label: 'One Way', icon: ArrowRight },
                                        { value: 'round_trip', label: 'Round Trip', icon: Repeat2 }
                                    ].map(({ value, label, icon: Icon }) => (
                                        <button
                                            key={value}
                                            onClick={() => { setTripType(value); }}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${tripType === value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                        >
                                            <Icon className={`w-4 h-4 mb-1 ${tripType === value ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <div className={`text-xs font-bold ${tripType === value ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Direction (only for one_way) */}
                        {tripType !== 'round_trip' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Direction</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'home_to_uni', label: 'Home → University' },
                                        { value: 'uni_to_home', label: 'University → Home' }
                                    ].map(({ value, label }) => (
                                        <button
                                            key={value}
                                            onClick={() => setDirection(value)}
                                            className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${direction === value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                {duration === 'single_day' ? 'Select Date (1 allowed)' : 'Select Dates (multiple allowed)'}
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                                {workingDays.map(day => {
                                    const key = toDateKey(day);
                                    const isSelected = selectedDates.includes(key);
                                    // if single day, disable others if 1 is selected
                                    const isDisabled = duration === 'single_day' && selectedDates.length === 1 && !isSelected;

                                    return (
                                        <button
                                            key={key}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                if (duration === 'single_day') {
                                                    setSelectedDates([key]);
                                                } else {
                                                    setSelectedDates(prev =>
                                                        prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
                                                    );
                                                }
                                            }}
                                            className={`p-2 rounded-xl text-center border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : isDisabled ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                                            </div>
                                            <div className="text-xs font-bold leading-tight">
                                                {day.toLocaleDateString('en-IN', { day: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {day.toLocaleDateString('en-IN', { month: 'short' })}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cost preview */}
                        {selectedBus && selectedDates.length > 0 && (
                            <div className={`p-4 rounded-xl border ${canAfford ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">
                                        {totalSlots} slot(s) × {selectedBus.pointCostPerSeat} pts
                                    </span>
                                    <span className={`text-lg font-black ${canAfford ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {totalCost} pts
                                    </span>
                                </div>
                                {!canAfford && (
                                    <p className="text-xs text-red-600 mt-1">Not enough points. Earn more via Ride Intent.</p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={proceedToSeatMap}
                            disabled={!selectedBus || selectedDates.length === 0 || !canAfford || loadingMap}
                            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loadingMap ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <>Pick a Seat <ChevronRight className="w-4 h-4" /></>}
                        </button>
                    </motion.div>
                )}

                {/* ── STEP 2: Seat Map ── */}
                {step === 2 && seatMapData && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <div className="font-bold text-slate-800">{selectedBus.busNumber}</div>
                                <div className="text-xs text-slate-500">{seatMapData.totalSeats} seats total · {seatMapData.takenSeats.length} taken</div>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-slate-200 border border-slate-300 inline-block" /> Taken</span>
                                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-500 inline-block" /> Selected</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Window</span>
                            </div>
                        </div>

                        {/* Bus front indicator */}
                        <div className="text-center text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">🚌 Front of Bus</div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto">
                            <div className="inline-flex flex-col gap-2 min-w-max mx-auto">
                                {seatRows.map((row, rowIdx) => (
                                    <div key={rowIdx} className="flex gap-2 items-center">
                                        <span className="w-5 text-[10px] text-slate-400 text-right font-mono">{rowIdx + 1}</span>
                                        {row.map((seat, cellIdx) => (
                                            <SeatCell
                                                key={cellIdx}
                                                seat={seat}
                                                taken={seat.num && seatMapData.takenSeats.includes(seat.num)}
                                                selected={seat.num === pickedSeat}
                                                mine={seat.num === seatMapData.myReservedSeat}
                                                onSelect={setPickedSeat}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {pickedSeat && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold text-center"
                            >
                                ✅ Seat <strong>{pickedSeat}</strong> selected
                            </motion.div>
                        )}

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => { setStep(1); setError(''); }} className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={proceedToConfirm}
                                disabled={!pickedSeat}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 3: Confirm ── */}
                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
                                <div className="text-sm font-semibold opacity-80 uppercase tracking-wider">Reservation Summary</div>
                            </div>
                            <div className="p-5 space-y-3 text-sm">
                                <Row label="Bus" value={`${selectedBus.busNumber} (${selectedBus.manufacturer} ${selectedBus.model})`} />
                                <Row label="Seat" value={`#${pickedSeat}`} highlight />
                                <Row label="Trip Flow" value={tripType === 'round_trip' ? 'Both ways (Round Trip)' : duration === 'multi_day' ? 'Multiple Days (One Way)' : 'Single Trip'} />
                                <Row label="Direction" value={tripType === 'round_trip' ? 'Home ↔ University' : direction === 'home_to_uni' ? 'Home → University' : 'University → Home'} />
                                <Row label="Date(s)" value={selectedDates.join(', ')} />
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                    <span className="font-bold text-slate-700">Total Points</span>
                                    <span className="text-xl font-black text-indigo-700">- {totalCost} pts</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>Remaining after booking</span>
                                    <span className="font-bold text-slate-700">{rewardPoints - totalCost} pts</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                            ⚠️ Cancellation refund only applies if cancelled more than 24 hours before travel.
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => { setStep(2); setError(''); }} className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={confirmBooking}
                                disabled={booking}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {booking ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><CheckCircle className="w-4 h-4" /> Confirm Booking</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </StudentLayout>
    );
}

function Row({ label, value, highlight }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-500">{label}</span>
            <span className={`font-semibold ${highlight ? 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg' : 'text-slate-800'}`}>{value}</span>
        </div>
    );
}
