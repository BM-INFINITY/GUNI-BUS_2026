import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../../services/api';
import {
    CheckCircle,
    Sunrise,
    Sunset,
    AlertTriangle,
    Search,
    Printer,
    FileDown,
    MoreHorizontal,
    X,
    RotateCcw,
    Ticket,
    ArrowLeft
} from 'lucide-react';

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
            const response = await admin.getApprovedPasses();

            setPasses(response.data);

            const uniqueRoutes = [...new Set(response.data.map(p => p.route?.routeName).filter(Boolean))];
            const uniqueDepts = [...new Set(response.data.map(p => p.department).filter(Boolean))];

            setRoutes(uniqueRoutes.sort());
            setDepartments(uniqueDepts.sort());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching passes:', error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...passes];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.studentName?.toLowerCase().includes(searchLower) ||
                p.enrollmentNumber?.toLowerCase().includes(searchLower) ||
                p.referenceNumber?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.route !== 'all') {
            filtered = filtered.filter(p => p.route?.routeName === filters.route);
        }

        if (filters.shift !== 'all') {
            filtered = filtered.filter(p => p.shift === filters.shift);
        }

        if (filters.year !== 'all') {
            filtered = filtered.filter(p => p.year === filters.year);
        }

        if (filters.department !== 'all') {
            filtered = filtered.filter(p => p.department === filters.department);
        }

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
            <div class="pass-card" style="page-break-after: always; padding: 20px; border: 2px solid #333; margin: 20px; width: 350px; font-family: sans-serif;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                    <h2 style="margin: 0; color: #4f46e5;">🚌 UNIVERSITY BUS PASS</h2>
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
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e5e7eb;">
                    <p style="margin: 4px 0; font-size: 13px;"><strong>Route:</strong> ${pass.route?.routeName}</p>
                    <p style="margin: 4px 0; font-size: 13px;"><strong>Shift:</strong> ${pass.shift === 'morning' ? 'Morning' : 'Afternoon'}</p>
                    <p style="margin: 4px 0; font-size: 13px;"><strong>Valid Until:</strong> ${pass.validUntil ? new Date(pass.validUntil).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div style="text-align: center; margin-bottom: 10px;">
                    ${pass.qrCode ? `<img src="${pass.qrCode}" style="width: 140px; height: 140px;" />` : `<div style="height: 140px; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">QR Not Available</div>`}
                </div>

                <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    <p style="margin: 2px 0; font-size: 11px; font-family: monospace; color: #666;">Ref: ${pass.referenceNumber}</p>
                </div>
            </div>
        `).join('');

        printWindow.document.write(`<html><head><title>Print Passes</title></head><body onload="window.print()">${passesHtml}</body></html>`);
        printWindow.document.close();
    };

    const handlePrint = (type) => {
        let passesToPrint = [];
        if (type === 'selected') passesToPrint = passes.filter(p => selectedPasses.includes(p._id));
        else if (type === 'filtered') passesToPrint = filteredPasses;

        if (passesToPrint.length === 0) return alert('No passes selected or matching filters');
        printPasses(passesToPrint);
    };

    const exportCSV = () => {
        const headers = ['Name', 'Enrollment', 'Department', 'Year', 'Route', 'Shift', 'Ref Number'];
        const csvContent = [
            headers.join(','),
            ...filteredPasses.map(p => [
                p.studentName,
                p.enrollmentNumber,
                p.department,
                p.year,
                p.route?.routeName,
                p.shift,
                p.referenceNumber
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `approved_passes_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Calculate stats
    const stats = {
        total: passes.length,
        morning: passes.filter(p => p.shift === 'morning').length,
        afternoon: passes.filter(p => p.shift === 'afternoon').length,
        expiringSoon: passes.filter(p => {
            if (!p.validUntil) return false;
            const diff = new Date(p.validUntil) - new Date();
            return diff > 0 && diff < (7 * 24 * 60 * 60 * 1000); // 7 days
        }).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        /*
 
 {/* Summary Cards */
        <div className="admin-page-container">
            <header className="page-header-premium">
                <div className="header-hero-box">

                    <button
                        className="back-hero-btn"
                        onClick={() => navigate('/admin')}
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1>Approved Bus Passes</h1>
                    </div>
                </div>
            </header>

            {/* 📤 Action Buttons Below */}
            <div className="admin-actions">
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="admin-btn admin-btn-secondary">
                        <FileDown size={18} />
                    </button>

                    <button onClick={() => handlePrint('filtered')} className="admin-btn admin-btn-primary">
                        <Printer size={18} />
                    </button>
                </div>
            </div>
            <div className="admin-grid-stats">
                <div className="admin-stat-card border-l-4 border-indigo-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="admin-stat-title">Total Approved</span>
                            <div className="admin-stat-value">{stats.total}</div>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>
                <div className="admin-stat-card border-l-4 border-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="admin-stat-title">Morning Passes</span>
                            <div className="admin-stat-value">{stats.morning}</div>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Sunrise size={24} />
                        </div>
                    </div>
                </div>
                <div className="admin-stat-card border-l-4 border-sky-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="admin-stat-title">Afternoon Passes</span>
                            <div className="admin-stat-value">{stats.afternoon}</div>
                        </div>
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                            <Sunset size={24} />
                        </div>
                    </div>
                </div>
                <div className="admin-stat-card border-l-4 border-rose-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="admin-stat-title">Expiring Soon</span>
                            <div className="admin-stat-value">{stats.expiringSoon}</div>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar shadow-sm">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            className="admin-input pl-10 w-full"
                            placeholder="Search"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                </div>

                <select
                    className="admin-select"
                    value={filters.route}
                    onChange={(e) => handleFilterChange('route', e.target.value)}
                >
                    <option value="all">All Routes</option>
                    {routes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select
                    className="admin-select"
                    value={filters.shift}
                    onChange={(e) => handleFilterChange('shift', e.target.value)}
                >
                    <option value="all">All Shifts</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                </select>

                <select
                    className="admin-select"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                    <option value="all">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <button onClick={resetFilters} className="admin-filter-reset" title="Reset Filters">
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Table Area */}
            <div className="admin-table-container">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-indigo-600"
                                checked={selectedPasses.length === filteredPasses.length && filteredPasses.length > 0}
                                onChange={toggleSelectAll}
                            />
                            Select All
                        </label>
                        {selectedPasses.length > 0 && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                <span className="text-sm font-semibold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                                    {selectedPasses.length} selected
                                </span>
                                <button onClick={() => handlePrint('selected')} className="text-sm font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-1">
                                    <Printer size={14} />
                                    Print Selected
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-10"></th>
                                <th>Student</th>
                                <th>Route Info</th>
                                <th>Shift</th>
                                <th>Department</th>
                                <th>Valid Until</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPasses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-slate-500">
                                        No passes found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredPasses.map((pass) => (
                                    <tr key={pass._id} className={selectedPasses.includes(pass._id) ? 'bg-indigo-50/30' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-indigo-600"
                                                checked={selectedPasses.includes(pass._id)}
                                                onChange={() => toggleSelectPass(pass._id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                                    {pass.studentPhoto ? (
                                                        <img src={pass.studentPhoto} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                                            {pass.studentName?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{pass.studentName}</div>
                                                    <div className="text-xs text-slate-500">{pass.enrollmentNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-medium text-slate-700">{pass.route?.routeName}</div>
                                            <div className="text-xs text-slate-500">Stop: {pass.selectedStop}</div>
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${pass.shift === 'morning' ? 'admin-badge-warning' : 'admin-badge-primary'}`}>
                                                {pass.shift}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="text-sm text-slate-600">{pass.department}</div>
                                            <div className="text-xs text-slate-400">Year {pass.year}</div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-medium">
                                                {pass.validUntil ? new Date(pass.validUntil).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => printPasses([pass])}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                                    title="Print Pass"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setQrModal({ show: true, pass })}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                                    title="View QR"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QR Modal */}
            {qrModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setQrModal({ show: false, pass: null })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">Bus Pass QR</h3>
                                <button onClick={() => setQrModal({ show: false, pass: null })} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl mb-4 inline-block mx-auto">
                                <img src={qrModal.pass?.qrCode} className="w-56 h-56 mx-auto" alt="QR" />
                            </div>
                            <div className="text-sm font-medium text-slate-900">{qrModal.pass?.studentName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">REF: {qrModal.pass?.referenceNumber}</div>

                            <div className="mt-8">
                                <button onClick={() => printPasses([qrModal.pass])} className="admin-btn admin-btn-primary w-full justify-center">
                                    <Printer size={18} />
                                    Print Pass
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
