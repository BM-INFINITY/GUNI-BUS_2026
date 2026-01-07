import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { passes, students } from '../services/api';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [pendingPasses, setPendingPasses] = useState([]);
    const [approvedPasses, setApprovedPasses] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('pending'); // pending, approved, students
    const [showCreateStudent, setShowCreateStudent] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '', email: '', enrollmentNumber: '', password: '123',
        phone: '', department: '', year: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pendingRes, studentsRes] = await Promise.all([
                passes.getPending(),
                students.getAll()
            ]);
            setPendingPasses(pendingRes.data);
            setAllStudents(studentsRes.data);

            // Fetch approved passes for dashboard view
            const allPasses = await passes.getPending(); // We need to create an endpoint for all passes
            setApprovedPasses(allPasses.data.filter(p => p.status === 'approved'));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (passId) => {
        if (!window.confirm('Approve this bus pass application?')) return;

        try {
            await passes.approve(passId);
            alert('Pass approved successfully!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (passId) => {
        const reason = prompt('Enter rejection reason (optional):');

        try {
            await passes.reject(passId);
            alert('Pass rejected');
            fetchData();
        } catch (error) {
            alert('Failed to reject');
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        try {
            await students.create(newStudent);
            alert('Student created!');
            setShowCreateStudent(false);
            setNewStudent({ name: '', email: '', enrollmentNumber: '', password: '123', phone: '', department: '', year: 1 });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed');
        }
    };

    return (
        <div className="dashboard admin-dashboard">
            <header>
                <h1>Admin Dashboard</h1>
                <div>
                    <span>{user?.name}</span>
                    <button onClick={logout}>Logout</button>
                </div>
            </header>

            {/* View Tabs */}
            <div className="tabs">
                <button
                    className={view === 'pending' ? 'active' : ''}
                    onClick={() => setView('pending')}
                >
                    Pending Requests ({pendingPasses.length})
                </button>
                <button
                    className={view === 'approved' ? 'active' : ''}
                    onClick={() => setView('approved')}
                >
                    All Passes ({approvedPasses.length})
                </button>
                <button
                    className={view === 'students' ? 'active' : ''}
                    onClick={() => setView('students')}
                >
                    Students ({allStudents.length})
                </button>
            </div>

            <div className="dashboard-content">
                {/* Pending Requests View */}
                {view === 'pending' && (
                    <div className="admin-table-container">
                        <h2>Pending Pass Applications</h2>
                        {loading ? (
                            <p>Loading...</p>
                        ) : pendingPasses.length === 0 ? (
                            <div className="empty-state">
                                <p>No pending applications</p>
                            </div>
                        ) : (
                            <div className="applications-grid">
                                {pendingPasses.map(pass => (
                                    <div key={pass._id} className="application-card">
                                        {/* Student Info with Photo */}
                                        <div className="app-header">
                                            <div className="student-photo">
                                                {pass.studentPhoto ? (
                                                    <img src={pass.studentPhoto} alt={pass.studentName} />
                                                ) : (
                                                    <div className="photo-placeholder">👤</div>
                                                )}
                                            </div>
                                            <div className="student-info">
                                                <h3>{pass.studentName}</h3>
                                                <div className="reference-number">Ref: {pass.referenceNumber}</div>
                                                <p>Enrollment: {pass.enrollmentNumber}</p>
                                            </div>
                                        </div>

                                        {/* Contact Details */}
                                        <div className="app-details">
                                            <div className="detail-item">
                                                <span className="icon">📧</span>
                                                <span>{pass.studentEmail}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="icon">📱</span>
                                                <span>{pass.studentPhone}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="icon">🏫</span>
                                                <span>{pass.studentDepartment} - Year {pass.studentYear}</span>
                                            </div>
                                        </div>

                                        {/* Pass Details */}
                                        <div className="app-pass-details">
                                            <h4>Pass Details:</h4>
                                            <div className="detail-item">
                                                <strong>Route:</strong> {pass.route?.routeName} ({pass.route?.routeNumber})
                                            </div>
                                            <div className="detail-item">
                                                <strong>Stop:</strong> {pass.selectedStop}
                                            </div>
                                            <div className="detail-item">
                                                <strong>Shift:</strong> {pass.shift === 'morning' ? 'Morning (8:30-2:10)' : 'Afternoon (11:40-5:20)'}
                                            </div>
                                            <div className="detail-item">
                                                <strong>Applied:</strong> {new Date(pass.applicationDate).toLocaleDateString()}
                                            </div>
                                            <div className="detail-item charge">
                                                <strong>Charge:</strong> ₹{pass.semesterCharge}
                                            </div>
                                            <div className="detail-item">
                                                <strong>Payment:</strong> {pass.paymentStatus === 'cash' ? 'Cash (at office)' : 'Online'}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="app-actions">
                                            <button className="btn-approve" onClick={() => handleApprove(pass._id)}>
                                                ✓ Approve
                                            </button>
                                            <button className="btn-reject" onClick={() => handleReject(pass._id)}>
                                                ✗ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Approved Passes by Route */}
                {view === 'approved' && (
                    <div className="route-wise-view">
                        <h2>All Active Passes</h2>
                        <p>Total: {approvedPasses.length}</p>
                        {/* Group by route - simplified for now */}
                        <div className="pass-list">
                            {approvedPasses.map(pass => (
                                <div key={pass._id} className="pass-item">
                                    <span>{pass.studentName}</span>
                                    <span>{pass.enrollmentNumber}</span>
                                    <span>{pass.route?.routeName}</span>
                                    <span>{pass.selectedStop}</span>
                                    <span className="reference-badge">{pass.referenceNumber}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Students Management */}
                {view === 'students' && (
                    <div className="students-view">
                        <div className="view-header">
                            <h2>Students ({allStudents.length})</h2>
                            <button onClick={() => setShowCreateStudent(true)}>+ Create Student</button>
                        </div>
                        <div className="students-list">
                            {allStudents.map(student => (
                                <div key={student._id} className="student-item">
                                    <span>{student.name}</span>
                                    <span>{student.enrollmentNumber}</span>
                                    <span>{student.department}</span>
                                    <span>Year {student.year}</span>
                                    <span>{student.isProfileComplete ? '✅ Complete' : '⏳ Incomplete'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Student Modal */}
            {showCreateStudent && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Student</h2>
                        <form onSubmit={handleCreateStudent}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input required value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" required value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Enrollment *</label>
                                <input required value={newStudent.enrollmentNumber} onChange={(e) => setNewStudent({ ...newStudent, enrollmentNumber: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone *</label>
                                <input required value={newStudent.phone} onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Department *</label>
                                <input required value={newStudent.department} onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Year *</label>
                                <select value={newStudent.year} onChange={(e) => setNewStudent({ ...newStudent, year: parseInt(e.target.value) })}>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                            <p className="form-note">Default password: 123</p>
                            <div className="modal-actions">
                                <button type="submit">Create</button>
                                <button type="button" onClick={() => setShowCreateStudent(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
