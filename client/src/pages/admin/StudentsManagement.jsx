import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin, routes as routeApi } from '../../services/api';
import {
    Users,
    UserPlus,
    Upload,
    Search,
    Filter,
    ChevronRight,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    BookOpen,
    MapPin,
    ArrowLeft,
    Download
} from 'lucide-react';
import './StudentsManagement.css';

export default function StudentsManagement() {
    const navigate = useNavigate();
    // ... all existing state logic remains same ...

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
        <div className="student-management-container">
            <header className="page-header-premium">
                <div className="header-hero-box">
                    <button className="back-hero-btn" onClick={() => navigate('/admin')}>
                        <ArrowLeft size={22} />
                    </button>
                    <div className="hero-content">
                        <div>
                            <h1>Manage Students</h1>
                        </div>
                    </div>
                </div>

                <div className="header-actions-row">
                    <button className="secondary-action-btn-premium" onClick={() => setShowBulkModal(true)}>
                        <Upload size={18} />
                        {/* <span>Bulk Upload</span> */}
                    </button>
                    <button className="primary-action-btn-premium" onClick={() => setShowAddModal(true)}>
                        <UserPlus size={18} />
                        {/* <span>Add Student</span> */}
                    </button>
                </div>
            </header>

            {/* Notifications */}
            {error && <div className="premium-alert error">{error}</div>}
            {success && <div className="premium-alert success">{success}</div>}

            {/* Filters Section */}
            <section className="filters-section-premium">
                <div className="search-box-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="premium-search-input"
                        value={filters.search}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, search: e.target.value }));
                            setPage(1);
                        }}
                    />
                </div>

                <div className="filter-group-grid">
                    <div className="select-wrapper">
                        <BookOpen className="select-icon" size={16} />
                        <select
                            className="premium-select"
                            value={filters.department}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                        >
                            <option value="">All Departments</option>
                            <option value="UVPCE">UVPCE</option>
                            <option value="BSPP">BSPP</option>
                            <option value="KPGPF">KPGPF</option>
                            <option value="VCP">VCP</option>
                        </select>
                    </div>

                    <div className="select-wrapper">
                        <Calendar className="select-icon" size={16} />
                        <select
                            className="premium-select"
                            value={filters.year}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                        >
                            <option value="">All Years</option>
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                        </select>
                    </div>

                    <div className="select-wrapper">
                        <MapPin className="select-icon" size={16} />
                        <select
                            className="premium-select"
                            value={filters.routeId}
                            onChange={(e) => handleFilterChange('routeId', e.target.value)}
                        >
                            <option value="">All Routes</option>
                            {routes.map(r => (
                                <option key={r._id} value={r._id}>{r.routeNumber} - {r.routeName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="select-wrapper">
                        <Filter className="select-icon" size={16} />
                        <select
                            className="premium-select"
                            value={filters.shift}
                            onChange={(e) => handleFilterChange('shift', e.target.value)}
                        >
                            <option value="">All Shifts</option>
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Table Section */}
            <div className="table-card-premium">
                <div className="table-header-info">
                    <Users size={18} />
                    <span>Total Students: <strong>{totalStudents}</strong></span>
                </div>

                <div className="table-wrapper-responsive">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>ENROLLMENT</th>
                                <th>NAME & CONTACT</th>
                                <th>DEPT / YEAR</th>
                                <th>ROUTE INFO</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="table-loading-state">
                                            <div className="spinner-indigo"></div>
                                            <span>Fetching student records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <Users size={48} />
                                            <h3>No students found</h3>
                                            <p>Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student._id}>
                                        <td className="cell-enrollment">{student.enrollmentNumber}</td>
                                        <td className="cell-student-info">
                                            <div className="student-name">{student.name}</div>
                                            <div className="student-subtext">
                                                <Mail size={12} /> {student.email}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="dept-tag">{student.department}</div>
                                            <div className="year-subtext">{student.year} Year</div>
                                        </td>
                                        <td>
                                            {student.activePass ? (
                                                <div className="route-display-group">
                                                    <div className="route-badge-new">
                                                        {student.routeNumber || 'unk'}
                                                    </div>
                                                    <div className="shift-subtext">{student.activePass.shift}</div>
                                                </div>
                                            ) : (
                                                <span className="no-pass-text">No Active Pass</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`premium-status ${student.isProfileComplete ? 'active' : 'pending'}`}>
                                                {student.isProfileComplete ? 'Active' : 'Incomplete'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="view-btn-premium"
                                                onClick={() => handleViewDetails(student._id)}
                                            >
                                                <span>Details</span>
                                                <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-footer-premium">
                    <div className="pagination-info">
                        Showing <strong>{students.length}</strong> of <strong>{totalStudents}</strong> members
                    </div>
                    <div className="pagination-controls">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-nav-btn"
                        >
                            Previous
                        </button>
                        <div className="p-pages">
                            Page <strong>{page}</strong> of <span>{totalPages}</span>
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-nav-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Upload Modal */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2>Bulk Upload Students</h2>
                            <button className="modal-close" onClick={() => setShowBulkModal(false)}>×</button>
                        </header>

                        {!uploadResult ? (
                            <form onSubmit={handleBulkUpload}>
                                <div className="bulk-instructions">
                                    <p>Upload a CSV file with the following headers:</p>
                                    <div className="csv-format-tag">
                                        <code>enrollmentNumber, name, email, mobile, department, year, dateOfBirth</code>
                                    </div>
                                </div>

                                <label className="upload-area-premium">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="upload-icon-circle">
                                        <Download size={32} />
                                    </div>
                                    <div className="upload-text">
                                        {uploadFile ? <strong>{uploadFile.name}</strong> : 'Click to select or drag CSV file'}
                                        <span>Supports .csv files up to 10MB</span>
                                    </div>
                                </label>

                                <div className="modal-footer-actions">
                                    <button type="button" className="secondary-action-btn" onClick={() => setShowBulkModal(false)}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="primary-action-btn"
                                        disabled={!uploadFile}
                                    >
                                        <Upload size={18} />
                                        <span>Upload & Process</span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="upload-result-container">
                                <div className="result-summary-card">
                                    <div className="summary-item success">
                                        <span className="count">{uploadResult.summary.success}</span>
                                        <span className="label">Successfully Imported</span>
                                    </div>
                                    <div className="summary-item failed">
                                        <span className="count">{uploadResult.summary.failed}</span>
                                        <span className="label">Failed Records</span>
                                    </div>
                                </div>

                                {uploadResult.summary.errors.length > 0 && (
                                    <div className="error-log-section">
                                        <h4>Error Details</h4>
                                        <div className="error-list">
                                            {uploadResult.summary.errors.map((err, i) => (
                                                <div key={i} className="error-item">
                                                    <span className="error-dot"></span>
                                                    {err}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="primary-action-btn w-full"
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
                    <div className="modal-box premium-modal-wide" onClick={(e) => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2>Add New Student</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </header>

                        <form onSubmit={handleAddStudent} className="premium-form">
                            <div className="form-grid-2">
                                <div className="premium-form-group">
                                    <label>Enrollment Number</label>
                                    <div className="input-with-icon">
                                        <BookOpen size={16} />
                                        <input
                                            type="text"
                                            placeholder="e.g. 23012011..."
                                            value={formData.enrollmentNumber}
                                            onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="premium-form-group">
                                    <label>Initial Password</label>
                                    <div className="input-with-icon">
                                        <MoreVertical size={16} />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="premium-form-group">
                                    <label>Full Name</label>
                                    <div className="input-with-icon">
                                        <Users size={16} />
                                        <input
                                            type="text"
                                            placeholder="Student Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="premium-form-group">
                                    <label>Date of Birth</label>
                                    <div className="input-with-icon">
                                        <Calendar size={16} />
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="premium-form-group">
                                    <label>Mobile Number</label>
                                    <div className="input-with-icon">
                                        <Phone size={16} />
                                        <input
                                            type="tel"
                                            placeholder="10 digit number"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            required
                                            pattern="[0-9]{10}"
                                        />
                                    </div>
                                </div>
                                <div className="premium-form-group">
                                    <label>Email Address</label>
                                    <div className="input-with-icon">
                                        <Mail size={16} />
                                        <input
                                            type="email"
                                            placeholder="student@university.edu"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="premium-form-group">
                                    <label>Department</label>
                                    <div className="input-with-icon">
                                        <Filter size={16} />
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Dept</option>
                                            <option value="UVPCE">UVPCE</option>
                                            <option value="BSPP">BSPP</option>
                                            <option value="KPGPF">KPGPF</option>
                                            <option value="VCP">VCP</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="premium-form-group">
                                    <label>Current Year</label>
                                    <div className="input-with-icon">
                                        <Calendar size={16} />
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
                            </div>

                            <div className="modal-footer-actions">
                                <button type="button" className="secondary-action-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="primary-action-btn">
                                    <UserPlus size={18} />
                                    <span>Create Student Record</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail View Modal */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-box premium-modal-xl" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>Student Details</h2>
                                <p className="modal-subtitle">Full profile and transportation logs</p>
                            </div>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
                        </header>

                        {loadingDetails || !selectedStudent ? (
                            <div className="modal-loading-state">
                                <div className="spinner-indigo"></div>
                                <span>Loading student dossier...</span>
                            </div>
                        ) : (
                            <div className="student-profile-dossier">
                                {/* Left: Profile Card */}
                                <aside className="profile-identity-card">
                                    <div className="profile-photo-wrapper">
                                        {selectedStudent.student.profilePhoto ? (
                                            <img src={selectedStudent.student.profilePhoto} className="profile-img-large" />
                                        ) : (
                                            <div className="profile-img-placeholder">
                                                <Users size={48} />
                                            </div>
                                        )}
                                        <div className={`status-glow ${selectedStudent.student.isProfileComplete ? 'active' : 'pending'}`}></div>
                                    </div>

                                    <div className="profile-main-info">
                                        <h3>{selectedStudent.student.name}</h3>
                                        <span className="enroll-tag">{selectedStudent.student.enrollmentNumber}</span>
                                    </div>

                                    <div className="profile-quick-stats">
                                        <div className="stat-row">
                                            <span className="label">Current Route</span>
                                            <span className="value high-contrast">
                                                {selectedStudent.passes.find(p => p.status === 'approved')?.route?.routeNumber || 'None'}
                                            </span>
                                        </div>
                                        <div className="stat-row">
                                            <span className="label">Department</span>
                                            <span className="value">{selectedStudent.student.department}</span>
                                        </div>
                                        <div className="stat-row">
                                            <span className="label">Mobile</span>
                                            <span className="value">{selectedStudent.student.mobile}</span>
                                        </div>
                                    </div>
                                </aside>

                                {/* Right: Pass History & Boarding Logs */}
                                <main className="profile-activity-logs">
                                    <div className="activity-tabs">
                                        <button className="activity-tab-btn active">
                                            Boarding Logs (Recent Trips)
                                        </button>
                                    </div>

                                    <div className="activity-list-container">
                                        {selectedStudent.attendanceLogs && selectedStudent.attendanceLogs.length > 0 ? (
                                            <div className="activity-grid">
                                                {selectedStudent.attendanceLogs.map(log => (
                                                    <div key={log._id} className="activity-card">
                                                        <div className="activity-meta">
                                                            <div className="activity-date">
                                                                {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                            <div className="activity-route-pill">
                                                                {log.routeId?.routeNumber} • {log.shift}
                                                            </div>
                                                        </div>
                                                        <div className="activity-times">
                                                            <div className="time-entry in">
                                                                <span className="label">CHECK IN</span>
                                                                <span className="value">
                                                                    {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            {log.checkOutTime && (
                                                                <div className="time-entry out">
                                                                    <span className="label">CHECK OUT</span>
                                                                    <span className="value">
                                                                        {new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="no-activity-state">
                                                <Calendar size={40} />
                                                <p>No transportation logs recorded yet</p>
                                            </div>
                                        )}
                                    </div>
                                </main>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
