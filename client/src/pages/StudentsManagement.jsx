import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../services/api';

export default function StudentsManagement() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        enrollmentNumber: '',
        password: '',
        name: '',
        dateOfBirth: '',
        mobile: '',
        email: '',
        department: '',
        year: 1
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await admin.getStudents();
            setStudents(response.data.students);
        } catch (err) {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await admin.createStudent(formData);
            setSuccess('Student created successfully!');
            setShowAddModal(false);
            setFormData({
                enrollmentNumber: '',
                password: '',
                name: '',
                dateOfBirth: '',
                mobile: '',
                email: '',
                department: '',
                year: 1
            });
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create student');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/admin')} className="back-button">← Back</button>
                <h1>Student Management</h1>
                <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                    + Add Student
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {loading ? (
                <div className="loading">Loading students...</div>
            ) : (
                <div className="card modern-card">
                    <h3>All Students ({students.length})</h3>
                    <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Enrollment</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Name</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Department</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Year</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Mobile</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Profile</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student._id}>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{student.enrollmentNumber}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{student.name}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{student.department}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{student.year}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{student.mobile}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                                        <span style={{
                                            color: student.isProfileComplete ? '#10b981' : '#ef4444',
                                            fontWeight: '600'
                                        }}>
                                            {student.isProfileComplete ? '✓ Complete' : '✗ Incomplete'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h2>Add New Student</h2>
                        <form onSubmit={handleAddStudent}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Enrollment Number *</label>
                                    <input
                                        type="text"
                                        value={formData.enrollmentNumber}
                                        onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth *</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number *</label>
                                    <input
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        required
                                        pattern="[0-9]{10}"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email ID *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department *</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Year *</label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        required
                                    >
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="primary-btn">Create Student</button>
                                <button type="button" className="secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
