import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ApprovedPasses() {
    const navigate = useNavigate();
    const [passes, setPasses] = useState([]);
    const [filteredPasses, setFilteredPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPasses, setSelectedPasses] = useState([]);

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        route: 'all',
        shift: 'all',
        year: 'all',
        department: 'all',
        dateFrom: '',
        dateTo: ''
    });

    // Unique values for filters
    const [routes, setRoutes] = useState([]);
    const [departments, setDepartments] = useState([]);

    // QR modal
    const [qrModal, setQrModal] = useState({ show: false, pass: null });

    useEffect(() => {
        fetchPasses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, passes]);

    const fetchPasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/passes/admin/approved`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPasses(response.data);

            // Extract unique routes and departments
            const uniqueRoutes = [...new Set(response.data.map(p => p.route?.routeName).filter(Boolean))];
            const uniqueDepts = [...new Set(response.data.map(p => p.department).filter(Boolean))];

            setRoutes(uniqueRoutes);
            setDepartments(uniqueDepts);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching passes:', error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...passes];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.studentName?.toLowerCase().includes(searchLower) ||
                p.enrollmentNumber?.toLowerCase().includes(searchLower) ||
                p.referenceNumber?.toLowerCase().includes(searchLower)
            );
        }

        // Route filter
        if (filters.route !== 'all') {
            filtered = filtered.filter(p => p.route?.routeName === filters.route);
        }

        // Shift filter
        if (filters.shift !== 'all') {
            filtered = filtered.filter(p => p.shift === filters.shift);
        }

        // Year filter
        if (filters.year !== 'all') {
            filtered = filtered.filter(p => p.year === filters.year);
        }

        // Department filter
        if (filters.department !== 'all') {
            filtered = filtered.filter(p => p.department === filters.department);
        }

        // Date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(filters.dateFrom));
        }
        if (filters.dateTo) {
            filtered = filtered.filter(p => new Date(p.createdAt) <= new Date(filters.dateTo));
        }

        setFilteredPasses(filtered);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            route: 'all',
            shift: 'all',
            year: 'all',
            department: 'all',
            dateFrom: '',
            dateTo: ''
        });
    };

    const toggleSelectPass = (passId) => {
        setSelectedPasses(prev =>
            prev.includes(passId)
                ? prev.filter(id => id !== passId)
                : [...prev, passId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPasses.length === filteredPasses.length) {
            setSelectedPasses([]);
        } else {
            setSelectedPasses(filteredPasses.map(p => p._id));
        }
    };

    const printPasses = (passesToPrint) => {
        const printWindow = window.open('', '_blank');
        const passesHtml = passesToPrint.map(pass => `
            <div class="pass-card" style="page-break-after: always; padding: 20px; border: 2px solid #333; margin: 20px; width: 350px;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                    <h2 style="margin: 0; color: #1565c0;">🚌 UNIVERSITY BUS PASS</h2>
                    <p style="margin: 5px 0; font-size: 12px; color: #666;">Semester Pass</p>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    ${pass.studentPhoto ? `
                        <img src="${pass.studentPhoto}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 2px solid #ddd;" />
                    ` : `
                        <div style="width: 80px; height: 80px; border-radius: 8px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 40px;">👤</div>
                    `}
                    <div style="flex: 1;">
                        <p style="margin: 2px 0; font-weight: bold; font-size: 16px;">${pass.studentName}</p>
                        <p style="margin: 2px 0; font-size: 12px; color: #666;">Enr: ${pass.enrollmentNumber}</p>
                        <p style="margin: 2px 0; font-size: 12px; color: #666;">${pass.department} - Year ${pass.year}</p>
                        <p style="margin: 2px 0; font-size: 12px; color: #666;">📱 ${pass.mobile || 'N/A'}</p>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                    <p style="margin: 3px 0; font-size: 13px;"><strong>Route:</strong> ${pass.route?.routeName} (${pass.route?.routeNumber})</p>
                    <p style="margin: 3px 0; font-size: 13px;"><strong>Stop:</strong> ${pass.selectedStop || 'N/A'}</p>
                    <p style="margin: 3px 0; font-size: 13px;"><strong>Shift:</strong> ${pass.shift === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}</p>
                    <p style="margin: 3px 0; font-size: 13px;"><strong>Valid Until:</strong> ${pass.validUntil ? new Date(pass.validUntil).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div style="text-align: center; margin-bottom: 10px;">
                    ${pass.qrCode ? `
                        <img src="${pass.qrCode}" style="width: 150px; height: 150px; border: 1px solid #ddd;" />
                    ` : `
                        <div style="width: 150px; height: 150px; background: #f0f0f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd;">
                            <p style="margin: 0; color: #999;">QR Not Available</p>
                        </div>
                    `}
                </div>

                <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 8px;">
                    <p style="margin: 2px 0; font-size: 11px; font-family: monospace; color: #666;">Ref: ${pass.referenceNumber}</p>
                    <p style="margin: 2px 0; font-size: 10px; color: #999;">Issued: ${new Date(pass.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Bus Passes - Print</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                            .pass-card { page-break-after: always; }
                        }
                        body { font-family: Arial, sans-serif; }
                    </style>
                </head>
                <body>
                    ${passesHtml}
                    <script>
                        window.onload = function() {
                            window.print();
                            // window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrint = (type) => {
        let passesToPrint = [];

        switch (type) {
            case 'selected':
                passesToPrint = passes.filter(p => selectedPasses.includes(p._id));
                if (passesToPrint.length === 0) {
                    alert('Please select passes to print');
                    return;
                }
                break;
            case 'filtered':
                passesToPrint = filteredPasses;
                if (passesToPrint.length === 0) {
                    alert('No passes match your filters');
                    return;
                }
                break;
            case 'all':
                passesToPrint = passes;
                break;
            default:
                return;
        }

        if (passesToPrint.length > 50) {
            if (!confirm(`You are about to print ${passesToPrint.length} passes. This may take a while. Continue?`)) {
                return;
            }
        }

        printPasses(passesToPrint);
    };

    const printSingle = (pass) => {
        printPasses([pass]);
    };

    return (
        <div className="dashboard">
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <button onClick={() => navigate('/admin')} className="back-button">
                            ← Back
                        </button>
                        <h1>✅ Approved Bus Passes</h1>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Print Options */}
                <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 15px 0' }}>🖨️ Print Options</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handlePrint('selected')}
                            className="primary-btn"
                            style={{ background: 'white', color: '#667eea', border: 'none' }}
                        >
                            📋 Print Selected ({selectedPasses.length})
                        </button>
                        <button
                            onClick={() => handlePrint('filtered')}
                            className="primary-btn"
                            style={{ background: 'white', color: '#667eea', border: 'none' }}
                        >
                            🔍 Print Filtered ({filteredPasses.length})
                        </button>
                        <button
                            onClick={() => handlePrint('all')}
                            className="primary-btn"
                            style={{ background: 'white', color: '#667eea', border: 'none' }}
                        >
                            📄 Print All ({passes.length})
                        </button>
                    </div>
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: '0.9' }}>
                        💡 Tip: Use filters to print route-wise, shift-wise, or date-wise passes
                    </p>
                </div>

                {/* Filters Section */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>🔍 Filters</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {/* Search */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Search</label>
                            <input
                                type="text"
                                placeholder="Name, Enrollment, Ref..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        {/* Route */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Route</label>
                            <select
                                value={filters.route}
                                onChange={(e) => handleFilterChange('route', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="all">All Routes</option>
                                {routes.map(route => (
                                    <option key={route} value={route}>{route}</option>
                                ))}
                            </select>
                        </div>

                        {/* Shift */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Shift</label>
                            <select
                                value={filters.shift}
                                onChange={(e) => handleFilterChange('shift', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="all">All Shifts</option>
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                            </select>
                        </div>

                        {/* Year */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Year</label>
                            <select
                                value={filters.year}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="all">All Years</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>

                        {/* Department */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Department</label>
                            <select
                                value={filters.department}
                                onChange={(e) => handleFilterChange('department', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>From Date</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>To Date</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        {/* Reset Button */}
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={resetFilters}
                                className="secondary-btn"
                                style={{ width: '100%' }}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div style={{ marginTop: '15px', padding: '10px', background: '#f0f9ff', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Showing {filteredPasses.length} of {passes.length} passes</strong>
                        {filteredPasses.length > 0 && (
                            <button
                                onClick={toggleSelectAll}
                                className="secondary-btn"
                                style={{ padding: '5px 15px', fontSize: '13px' }}
                            >
                                {selectedPasses.length === filteredPasses.length ? '☑️ Deselect All' : '☐ Select All'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Passes Table */}
                {loading ? (
                    <div className="loading">Loading approved passes...</div>
                ) : filteredPasses.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ fontSize: '18px', color: '#666' }}>
                            {passes.length === 0 ? 'No approved passes found' : 'No passes match your filters'}
                        </p>
                    </div>
                ) : (
                    <div className="card">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPasses.length === filteredPasses.length}
                                                onChange={toggleSelectAll}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Photo</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Enrollment</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Department</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Year</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Route</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Shift</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Valid Until</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>QR Code</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPasses.map((pass) => (
                                        <tr key={pass._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPasses.includes(pass._id)}
                                                    onChange={() => toggleSelectPass(pass._id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {pass.studentPhoto ? (
                                                    <img
                                                        src={pass.studentPhoto}
                                                        alt={pass.studentName}
                                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        👤
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>{pass.studentName}</td>
                                            <td style={{ padding: '12px' }}>{pass.enrollmentNumber}</td>
                                            <td style={{ padding: '12px' }}>{pass.department}</td>
                                            <td style={{ padding: '12px' }}>{pass.year}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div>
                                                    <strong>{pass.route?.routeName}</strong>
                                                    <br />
                                                    <small style={{ color: '#666' }}>{pass.route?.routeNumber}</small>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: pass.shift === 'morning' ? '#fff3cd' : '#d1ecf1',
                                                    color: pass.shift === 'morning' ? '#856404' : '#0c5460',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {pass.shift === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {pass.validUntil ? new Date(pass.validUntil).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {pass.qrCode ? (
                                                    <img
                                                        src={pass.qrCode}
                                                        alt="QR"
                                                        style={{ width: '50px', height: '50px', cursor: 'pointer', border: '1px solid #ddd' }}
                                                        onClick={() => setQrModal({ show: true, pass })}
                                                        title="Click to enlarge"
                                                    />
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '12px' }}>No QR</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <button
                                                    onClick={() => printSingle(pass)}
                                                    className="secondary-btn"
                                                    style={{ padding: '5px 10px', fontSize: '12px' }}
                                                >
                                                    🖨️ Print
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* QR Modal */}
            {qrModal.show && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setQrModal({ show: false, pass: null })}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            maxWidth: '400px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0 }}>{qrModal.pass?.studentName}</h3>
                        <p style={{ color: '#666', margin: '5px 0' }}>{qrModal.pass?.enrollmentNumber}</p>
                        <img
                            src={qrModal.pass?.qrCode}
                            alt="QR Code"
                            style={{ width: '250px', height: '250px', margin: '20px 0', border: '2px solid #ddd' }}
                        />
                        <p style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                            Ref: {qrModal.pass?.referenceNumber}
                        </p>
                        <button
                            onClick={() => setQrModal({ show: false, pass: null })}
                            className="primary-btn"
                            style={{ marginTop: '10px' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
