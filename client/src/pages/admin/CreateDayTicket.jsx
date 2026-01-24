import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { routes as routesAPI } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CreateDayTicket() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Search, 2: Details, 3: Success

    // Student data
    const [enrollment, setEnrollment] = useState('');
    const [student, setStudent] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    // Quick create user
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', mobile: '' });

    // Ticket data
    const [routes, setRoutes] = useState([]);
    const [ticketData, setTicketData] = useState({
        routeId: '',
        selectedStop: '',
        shift: 'morning',
        travelDate: new Date().toISOString().split('T')[0],
        ticketType: 'single',
        paymentMethod: 'cash',
        priceOverride: '',
        overrideReason: ''
    });

    // Selected route details
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [defaultPrice, setDefaultPrice] = useState(0);

    // Success data
    const [createdTicket, setCreatedTicket] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRoutes();
    }, []);

    useEffect(() => {
        if (ticketData.routeId) {
            const route = routes.find(r => r._id === ticketData.routeId);
            setSelectedRoute(route);
            if (route) {
                const price = route.ticketPrices?.[ticketData.ticketType] || 0;
                setDefaultPrice(price);
            }
        }
    }, [ticketData.routeId, ticketData.ticketType, routes]);

    const fetchRoutes = async () => {
        try {
            const res = await routesAPI.getAll();
            setRoutes(res.data);
        } catch (error) {
            console.error('Fetch routes error:', error);
        }
    };

    const searchStudent = async () => {
        if (!enrollment.trim()) {
            alert('Please enter enrollment number');
            return;
        }

        setSearchLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/tickets/search-student`, {
                params: { enrollment: enrollment.trim() },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.data.found) {
                setStudent(res.data.student);
                setShowCreateUser(false);
                setStep(2);
            } else {
                setShowCreateUser(true);
                setStudent(null);
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Error searching for student');
        } finally {
            setSearchLoading(false);
        }
    };

    const createQuickUser = async () => {
        if (!newUser.name.trim() || !newUser.mobile.trim()) {
            alert('Please enter name and mobile number');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/admin/tickets/create-user`, {
                name: newUser.name.trim(),
                enrollmentNumber: enrollment.trim(),
                mobile: newUser.mobile.trim()
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            alert(`User created! Default password: ${res.data.defaultPassword}`);
            // Search again to get the created user
            await searchStudent();
        } catch (error) {
            console.error('Create user error:', error);
            alert(error.response?.data?.message || 'Error creating user');
        } finally {
            setLoading(false);
        }
    };

    const createTicket = async () => {
        if (!ticketData.routeId || !ticketData.selectedStop) {
            alert('Please fill all required fields');
            return;
        }

        if (ticketData.priceOverride && !ticketData.overrideReason) {
            alert('Please provide reason for price override');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                studentId: student._id,
                routeId: ticketData.routeId,
                selectedStop: ticketData.selectedStop,
                shift: ticketData.shift,
                travelDate: ticketData.travelDate,
                ticketType: ticketData.ticketType,
                paymentMethod: ticketData.paymentMethod
            };

            if (ticketData.priceOverride) {
                payload.priceOverride = parseFloat(ticketData.priceOverride);
                payload.overrideReason = ticketData.overrideReason;
            }

            const res = await axios.post(`${API_URL}/admin/tickets/create`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setCreatedTicket(res.data.ticket);
            setStep(3);
        } catch (error) {
            console.error('Create ticket error:', error);
            alert(error.response?.data?.message || 'Error creating ticket');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setEnrollment('');
        setStudent(null);
        setShowCreateUser(false);
        setNewUser({ name: '', mobile: '' });
        setTicketData({
            routeId: '',
            selectedStop: '',
            shift: 'morning',
            travelDate: new Date().toISOString().split('T')[0],
            ticketType: 'single',
            paymentMethod: 'cash',
            priceOverride: '',
            overrideReason: ''
        });
        setCreatedTicket(null);
    };

    return (
        <div className="dashboard">
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <button onClick={() => navigate('/admin')} className="back-button">
                            ← Back
                        </button>
                        <h1>🎫 Create Day Ticket</h1>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Step 1: Search Student */}
                {step === 1 && (
                    <div className="card">
                        <h3>Step 1: Find Student</h3>
                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
                                Enrollment Number
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={enrollment}
                                    onChange={(e) => setEnrollment(e.target.value)}
                                    placeholder="Enter enrollment number..."
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
                                />
                                <button
                                    onClick={searchStudent}
                                    disabled={searchLoading}
                                    className="primary-btn"
                                    style={{ padding: '10px 30px' }}
                                >
                                    {searchLoading ? 'Searching...' : 'Search Student'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Create User */}
                        {showCreateUser && (
                            <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #ddd' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#666' }}>
                                    Student Not Found - Quick Create User
                                </h4>
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="Enter student name..."
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                            Mobile Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={newUser.mobile}
                                            onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                                            placeholder="Enter mobile number..."
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>
                                        ℹ️ Default password will be: <strong>123</strong> (Student must change on first login)
                                    </div>
                                    <button
                                        onClick={createQuickUser}
                                        disabled={loading}
                                        className="primary-btn"
                                    >
                                        {loading ? 'Creating...' : 'Create User & Continue'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Ticket Details */}
                {step === 2 && student && (
                    <>
                        {/* Student Info Card */}
                        <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                            <h3 style={{ margin: '0 0 15px 0' }}>Selected Student</h3>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                {student.profilePhoto ? (
                                    <img src={student.profilePhoto} alt={student.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
                                ) : (
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👤</div>
                                )}
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{student.name}</h4>
                                    <p style={{ margin: '0', opacity: 0.9 }}>Enrollment: {student.enrollmentNumber}</p>
                                    <p style={{ margin: '0', opacity: 0.9 }}>Mobile: {student.mobile}</p>
                                </div>
                            </div>
                            {student.activeBusPass && (
                                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', fontSize: '14px' }}>
                                    ⚠️ Active Bus Pass: {student.activeBusPass.routeName} - {student.activeBusPass.shift}
                                    <br />
                                    <small>Cannot create ticket for same route+shift</small>
                                </div>
                            )}
                        </div>

                        {/* Ticket Form */}
                        <div className="card">
                            <h3>Step 2: Ticket Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                {/* Route */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Route *</label>
                                    <select
                                        value={ticketData.routeId}
                                        onChange={(e) => setTicketData({ ...ticketData, routeId: e.target.value, selectedStop: '' })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="">Select Route</option>
                                        {routes.map(route => (
                                            <option key={route._id} value={route._id}>
                                                {route.routeName} ({route.routeNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Stop */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Stop *</label>
                                    <select
                                        value={ticketData.selectedStop}
                                        onChange={(e) => setTicketData({ ...ticketData, selectedStop: e.target.value })}
                                        disabled={!selectedRoute}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="">Select Stop</option>
                                        {selectedRoute?.shifts?.find(s => s.shiftType === ticketData.shift)?.stops?.map((stop, idx) => (
                                            <option key={idx} value={stop.name}>{stop.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Shift */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Shift *</label>
                                    <select
                                        value={ticketData.shift}
                                        onChange={(e) => setTicketData({ ...ticketData, shift: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="morning">🌅 Morning</option>
                                        <option value="afternoon">🌆 Afternoon</option>
                                    </select>
                                </div>

                                {/* Travel Date */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Travel Date *</label>
                                    <input
                                        type="date"
                                        value={ticketData.travelDate}
                                        onChange={(e) => setTicketData({ ...ticketData, travelDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>

                                {/* Ticket Type */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Ticket Type *</label>
                                    <select
                                        value={ticketData.ticketType}
                                        onChange={(e) => setTicketData({ ...ticketData, ticketType: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="single">Single Trip</option>
                                        <option value="round">Round Trip</option>
                                    </select>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Payment Method *</label>
                                    <select
                                        value={ticketData.paymentMethod}
                                        onChange={(e) => setTicketData({ ...ticketData, paymentMethod: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="cash">💵 Cash Payment</option>
                                        <option value="online">💳 Online Payment (Student pays later)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price Section */}
                            <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 15px 0' }}>💰 Pricing</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Default Price</label>
                                        <input
                                            type="text"
                                            value={`₹${defaultPrice}`}
                                            disabled
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', background: '#e9ecef' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Override Price (Optional)</label>
                                        <input
                                            type="number"
                                            value={ticketData.priceOverride}
                                            onChange={(e) => setTicketData({ ...ticketData, priceOverride: e.target.value })}
                                            placeholder="Leave empty for default"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    {ticketData.priceOverride && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Reason for Override *</label>
                                            <input
                                                type="text"
                                                value={ticketData.overrideReason}
                                                onChange={(e) => setTicketData({ ...ticketData, overrideReason: e.target.value })}
                                                placeholder="e.g., Student discount, Complementary ticket, etc."
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setStep(1)} className="secondary-btn">
                                    ← Back
                                </button>
                                <button onClick={createTicket} disabled={loading} className="primary-btn">
                                    {loading ? 'Creating...' : ticketData.paymentMethod === 'cash' ? '💵 Create Ticket (Cash)' : '💳 Create Ticket (Online)'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Step 3: Success */}
                {step === 3 && createdTicket && (
                    <div className="card">
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                                {createdTicket.paymentStatus === 'completed' ? '✅' : '⏳'}
                            </div>
                            <h2 style={{ margin: '0 0 10px 0' }}>
                                {createdTicket.paymentStatus === 'completed' ? 'Ticket Created Successfully!' : 'Ticket Created - Pending Payment'}
                            </h2>
                            <p style={{ color: '#666', marginBottom: '30px' }}>
                                {createdTicket.paymentStatus === 'completed'
                                    ? 'Cash payment received. Ticket is active and ready to use.'
                                    : 'Student will see this ticket in their dashboard and can pay online.'}
                            </p>

                            {/* Ticket Details */}
                            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
                                <h4 style={{ margin: '0 0 15px 0' }}>Ticket Details</h4>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div><strong>Student:</strong> {createdTicket.studentName}</div>
                                    <div><strong>Enrollment:</strong> {createdTicket.enrollmentNumber}</div>
                                    <div><strong>Route:</strong> {createdTicket.route?.routeName}</div>
                                    <div><strong>Shift:</strong> {createdTicket.shift}</div>
                                    <div><strong>Travel Date:</strong> {new Date(createdTicket.travelDate).toLocaleDateString()}</div>
                                    <div><strong>Amount:</strong> ₹{createdTicket.amount}</div>
                                    <div><strong>Reference:</strong> <code>{createdTicket.referenceNumber}</code></div>
                                    {createdTicket.receiptNumber && (
                                        <div><strong>Receipt:</strong> <code>{createdTicket.receiptNumber}</code></div>
                                    )}
                                </div>
                            </div>

                            {/* QR Code (Cash only) */}
                            {createdTicket.qrCode && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h4>QR Code</h4>
                                    <img src={createdTicket.qrCode} alt="QR Code" style={{ width: '250px', height: '250px', border: '2px solid #ddd', borderRadius: '8px' }} />
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                        Student can use this QR code for boarding
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
                                <button onClick={() => navigate('/admin/one-day-tickets')} className="secondary-btn">
                                    View All Tickets
                                </button>
                                <button onClick={resetForm} className="primary-btn">
                                    Create Another Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
