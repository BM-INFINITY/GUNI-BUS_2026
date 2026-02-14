import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function StudentDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [passes, setPasses] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (id) {
            fetchStudentData();
        }
    }, [id]);

    const fetchStudentData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [studentRes, passesRes, ticketsRes, attendanceRes] = await Promise.all([
                axios.get(`${API_URL}/admin/students/${id}`, { headers }),
                axios.get(`${API_URL}/passes/admin/approved?userId=${id}`, { headers }),
                axios.get(`${API_URL}/day-tickets/admin/all?userId=${id}`, { headers }),
                axios.get(`${API_URL}/attendance/my-history`, { headers }) // This would need student-specific endpoint
            ]);

            setStudent(studentRes.data);
            setPasses(passesRes.data || []);
            setTickets(ticketsRes.data || []);
            setAttendance(attendanceRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading student details...</div>;
    if (error) return <div style={{ padding: '20px', color: '#c00' }}>{error}</div>;
    if (!student) return <div>Student not found</div>;

    return (
        <div className="dashboard">
            <header className="modern-header">
                <div className="header-content">
                    <button onClick={() => navigate('/admin/students')} className="back-button">← Back</button>
                    <h1>Student Details</h1>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Student Header Card */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
                        {student.profilePhoto && (
                            <img src={student.profilePhoto} alt={student.name} style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 10px 0' }}>{student.name}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                <div><strong>Enrollment:</strong> {student.enrollmentNumber}</div>
                                <div><strong>Email:</strong> {student.email}</div>
                                <div><strong>Mobile:</strong> {student.mobile}</div>
                                <div><strong>Department:</strong> {student.department}</div>
                                <div><strong>Year:</strong> {student.year}</div>
                                <div><strong>DOB:</strong> {new Date(student.dateOfBirth).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
                    <button onClick={() => setActiveTab('profile')} style={{ padding: '10px 20px', border: 'none', background: activeTab === 'profile' ? '#4f46e5' : 'transparent', color: activeTab === 'profile' ? '#fff' : '#000', cursor: 'pointer' }}>Profile</button>
                    <button onClick={() => setActiveTab('passes')} style={{ padding: '10px 20px', border: 'none', background: activeTab === 'passes' ? '#4f46e5' : 'transparent', color: activeTab === 'passes' ? '#fff' : '#000', cursor: 'pointer' }}>Bus Passes ({passes.length})</button>
                    <button onClick={() => setActiveTab('tickets')} style={{ padding: '10px 20px', border: 'none', background: activeTab === 'tickets' ? '#4f46e5' : 'transparent', color: activeTab === 'tickets' ? '#fff' : '#000', cursor: 'pointer' }}>Day Tickets ({tickets.length})</button>
                    <button onClick={() => setActiveTab('attendance')} style={{ padding: '10px 20px', border: 'none', background: activeTab === 'attendance' ? '#4f46e5' : 'transparent', color: activeTab === 'attendance' ? '#fff' : '#000', cursor: 'pointer' }}>Attendance</button>
                </div>

                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <div className="card">
                        <h3>Complete Profile</h3>
                        <table style={{ width: '100%' }}>
                            <tbody>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Name:</td><td style={{ padding: '8px' }}>{student.name}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Enrollment Number:</td><td style={{ padding: '8px' }}>{student.enrollmentNumber}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Email:</td><td style={{ padding: '8px' }}>{student.email}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Mobile:</td><td style={{ padding: '8px' }}>{student.mobile}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Department:</td><td style={{ padding: '8px' }}>{student.department}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Year:</td><td style={{ padding: '8px' }}>{student.year}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Date of Birth:</td><td style={{ padding: '8px' }}>{new Date(student.dateOfBirth).toLocaleDateString()}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Profile Complete:</td><td style={{ padding: '8px' }}>{student.isProfileComplete ? '✅ Yes' : '❌ No'}</td></tr>
                                <tr><td style={{ padding: '8px', fontWeight: 'bold' }}>Account Status:</td><td style={{ padding: '8px' }}>{student.isActive ? '✅ Active' : '❌ Inactive'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'passes' && (
                    <div className="card">
                        <h3>Bus Passes</h3>
                        {passes.length === 0 ? (
                            <p>No bus passes found</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Route</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Shift</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Stop</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Valid From</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Valid Until</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {passes.map(pass => (
                                        <tr key={pass._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{pass.route?.routeName}</td>
                                            <td style={{ padding: '10px' }}>{pass.shift}</td>
                                            <td style={{ padding: '10px' }}>{pass.selectedStop}</td>
                                            <td style={{ padding: '10px' }}>{new Date(pass.validFrom).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px' }}>{new Date(pass.validUntil).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px' }}>{pass.status}</td>
                                            <td style={{ padding: '10px' }}>₹{pass.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <div className="card">
                        <h3>Day Tickets</h3>
                        {tickets.length === 0 ? (
                            <p>No day tickets found</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Reference</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Route</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Shift</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Travel Date</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map(ticket => (
                                        <tr key={ticket._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{ticket.referenceNumber}</td>
                                            <td style={{ padding: '10px' }}>{ticket.route?.routeName}</td>
                                            <td style={{ padding: '10px' }}>{ticket.shift}</td>
                                            <td style={{ padding: '10px' }}>{new Date(ticket.travelDate).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px' }}>{ticket.ticketType}</td>
                                            <td style={{ padding: '10px' }}>{ticket.status}</td>
                                            <td style={{ padding: '10px' }}>₹{ticket.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="card">
                        <h3>Attendance History</h3>
                        {attendance.length === 0 ? (
                            <p>No attendance records found</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Route</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Shift</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Scan Time</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Driver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map((record, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{new Date(record.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px' }}>{record.route}</td>
                                            <td style={{ padding: '10px' }}>{record.shift}</td>
                                            <td style={{ padding: '10px' }}>{new Date(record.scanTime).toLocaleTimeString()}</td>
                                            <td style={{ padding: '10px' }}>{record.driver}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3>Quick Actions</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button className="primary-btn" onClick={() => navigate(`/admin/create-day-ticket?studentId=${id}`)}>Create Day Ticket</button>
                        <button className="secondary-btn">Send Notification</button>
                        <button className="secondary-btn">View Payment History</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
