import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin, routes as routeApi } from '../../services/api';
import './StudentsManagement.css';

export default function StudentsManagement() {
    const navigate = useNavigate();

    // Data States
    const [students, setStudents] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [filters, setFilters] = useState({
        search: '',
        department: '',
        year: '',
        routeId: '',
        shift: ''
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form States
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

    const [uploadFile, setUploadFile] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);

    // UI States
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 500); // Debounce search by 500ms

        return () => clearTimeout(timer);
    }, [filters.search, page, filters.department, filters.year, filters.routeId, filters.shift]);

    const fetchInitialData = async () => {
        try {
            const routesRes = await routeApi.getAll();
            setRoutes(routesRes.data);
            fetchStudents();
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 100,
                ...filters
            };
            const response = await admin.getStudents(params);
            setStudents(response.data.students);
            setTotalPages(response.data.totalPages);
            setTotalStudents(response.data.totalStudents);
        } catch (err) {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };


    // handleSearch removed as it's now automatic via useEffect
    // const handleSearch = (e) => { ... }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleViewDetails = async (studentId) => {
        setLoadingDetails(true);
        setShowDetailModal(true);
        try {
            const res = await admin.getStudentDetails(studentId);
            setSelectedStudent(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch details');
            setShowDetailModal(false);
        } finally {
            setLoadingDetails(false);
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

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const data = new FormData();
        data.append('file', uploadFile);

        try {
            const res = await admin.uploadStudents(data);
            setUploadResult(res.data);
            fetchStudents();
            setUploadFile(null);
        } catch (err) {
            console.error(err);
            setError('Upload failed');
        }
    };

    return (
        <div className="student-management">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/admin')} className="back-button">← Back</button>
                    <h1>Manage Students</h1>
                </div>
                <div className="header-actions">
                    <button className="secondary-btn" onClick={() => setShowBulkModal(true)}>
                        📤 Bulk Upload
                    </button>
                    <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                        + Add Student
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Search by name or enrollment..."
                    className="search-input"
                    value={filters.search}
                    onChange={(e) => {
                        setFilters(prev => ({ ...prev, search: e.target.value }));
                        setPage(1);
                    }}
                />

                <select
                    className="filter-select"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                    <option value="">All Departments</option>
                    <option value="Computer">Computer</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                </select>

                <select
                    className="filter-select"
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>

                <select
                    className="filter-select"
                    value={filters.routeId}
                    onChange={(e) => handleFilterChange('routeId', e.target.value)}
                >
                    <option value="">All Routes</option>
                    {routes.map(route => (
                        <option key={route._id} value={route._id}>
                            {route.routeNumber} - {route.routeName}
                        </option>
                    ))}
                </select>

                <select
                    className="filter-select"
                    value={filters.shift}
                    onChange={(e) => handleFilterChange('shift', e.target.value)}
                >
                    <option value="">All Shifts</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                </select>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {loading ? (
                <div className="loading">Loading students...</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Enrollment</th>
                                <th>Name</th>
                                <th>Dept / Year</th>
                                <th>Route</th>
                                <th>Shift</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student._id}>
                                    <td>{student.enrollmentNumber}</td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{student.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{student.email}</div>
                                    </td>
                                    <td>{student.department} - {student.year}Yr</td>
                                    <td>
                                        {student.activePass ? (
                                            <span className="badge-route">{student.route?.routeNumber || 'unk'}</span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {student.activePass ? (
                                            <span style={{ textTransform: 'capitalize' }}>{student.activePass.shift}</span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${student.isProfileComplete ? 'complete' : 'incomplete'}`}>
                                            {student.isProfileComplete ? 'Active' : 'Incomplete'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn"
                                            onClick={() => handleViewDetails(student._id)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', alignItems: 'center' }}>
                        <span>Showing {students.length} of {totalStudents} students</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="secondary-btn"
                            >
                                Previous
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="secondary-btn"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Bulk Upload Students</h2>
                            <button className="modal-close" onClick={() => setShowBulkModal(false)}>×</button>
                        </div>

                        {!uploadResult ? (
                            <form onSubmit={handleBulkUpload}>
                                <p style={{ marginBottom: '20px', color: '#666' }}>
                                    Upload a CSV file with headers: <br />
                                    <code>enrollmentNumber, name, email, mobile, department, year, dateOfBirth</code>
                                </p>

                                <label className="upload-area">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>📄</div>
                                    {uploadFile ? uploadFile.name : 'Click to select CSV file'}
                                </label>

                                <div className="modal-actions" style={{ marginTop: '20px' }}>
                                    <button type="button" className="secondary-btn" onClick={() => setShowBulkModal(false)}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="primary-btn"
                                        disabled={!uploadFile}
                                    >
                                        Upload & Process
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <div style={{
                                    padding: '15px',
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '8px',
                                    marginBottom: '20px'
                                }}>
                                    <h3>Upload Complete</h3>
                                    <p>Success: {uploadResult.summary.success}</p>
                                    <p>Failed: {uploadResult.summary.failed}</p>
                                </div>

                                {uploadResult.summary.errors.length > 0 && (
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
                                        <h4>Errors:</h4>
                                        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#dc2626' }}>
                                            {uploadResult.summary.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    className="primary-btn"
                                    style={{ width: '100%', marginTop: '20px' }}
                                    onClick={() => {
                                        setUploadResult(null);
                                        setShowBulkModal(false);
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
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

            {/* Detail View Modal */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-box detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Student Details</h2>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
                        </div>

                        {loadingDetails || !selectedStudent ? (
                            <div className="loading">Loading details...</div>
                        ) : (
                            <div className="detail-grid">
                                {/* Left: Profile Card */}
                                <div className="profile-card">
                                    {selectedStudent.student.profilePhoto ? (
                                        <img src={selectedStudent.student.profilePhoto} className="profile-image" />
                                    ) : (
                                        <div className="profile-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                                            👤
                                        </div>
                                    )}
                                    <h3>{selectedStudent.student.name}</h3>
                                    <p style={{ color: '#666' }}>{selectedStudent.student.enrollmentNumber}</p>

                                    <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                        <div className="info-group">
                                            <div className="info-label">Current Route</div>
                                            <div className="info-value">
                                                {selectedStudent.passes.find(p => p.status === 'approved')?.route?.routeNumber || 'No Active Pass'}
                                            </div>
                                        </div>
                                        <div className="info-group">
                                            <div className="info-label">Department</div>
                                            <div className="info-value">{selectedStudent.student.department}</div>
                                        </div>
                                        <div className="info-group">
                                            <div className="info-label">Mobile</div>
                                            <div className="info-value">{selectedStudent.student.mobile}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Pass History & Boarding Logs */}
                                <div>
                                    <div className="tabs">
                                        <button className="tab-btn active">Boarding Logs (Attendance)</button>
                                    </div>

                                    <div className="log-list">
                                        {selectedStudent.attendanceLogs && selectedStudent.attendanceLogs.length > 0 ? (
                                            selectedStudent.attendanceLogs.map(log => (
                                                <div key={log._id} className="log-item">
                                                    <div>
                                                        <div className="log-date">{new Date(log.date).toLocaleDateString()}</div>
                                                        <div style={{ fontSize: '13px', color: '#666' }}>
                                                            Route: {log.routeId?.routeNumber} ({log.shift})
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ color: '#166534', fontWeight: '500' }}>
                                                            IN: {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        {log.checkOutTime && (
                                                            <div style={{ color: '#991b1b', fontSize: '13px' }}>
                                                                OUT: {new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                                No attendance records found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
