import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Search, AlertCircle, Clock,
    MapPin, Calendar, ChevronRight, PackageSearch, Plus, FileSearch
} from 'lucide-react';
import { lostFound } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';

const CATEGORY_LABELS = {
    id_card: 'ID Card', bag: 'Bag', electronics: 'Electronics',
    clothing: 'Clothing', documents: 'Documents', water_bottle: 'Water Bottle', other: 'Other'
};

const CATEGORY_ICONS = {
    id_card: '🪪', bag: '🎒', electronics: '📱',
    clothing: '👕', documents: '📄', water_bottle: '🍶', other: '📦'
};

export default function LostAndFound() {
    // Two main boards now: found (Depot) and lost (Looking for)
    const [activeTab, setActiveTab] = useState('found');
    const [boardData, setBoardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ category: '', search: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchBoard();
    }, [activeTab]);

    const fetchBoard = async () => {
        setLoading(true);
        try {
            if (activeTab === 'found') {
                const res = await lostFound.getBoardFound({ limit: 50 });
                setBoardData(res.data.items || []);
            } else {
                const res = await lostFound.getBoardReports({ limit: 50 });
                setBoardData(res.data.reports || []);
            }
        } catch (err) {
            console.error('Failed to fetch board data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = boardData.filter(item => {
        const matchesCategory = !filters.category || item.category === filters.category;
        const matchesSearch = !filters.search ||
            item.itemName.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.description?.toLowerCase().includes(filters.search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const tabs = [
        { id: 'found', label: 'Found Items (Depot)', icon: Package },
        { id: 'lost', label: 'Lost Reports (Looking for)', icon: FileSearch }
    ];

    return (
        <StudentLayout>
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PackageSearch className="w-7 h-7 text-indigo-600" />
                        Community Noticeboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Help each other find lost belongings. See what's found, post what you lost.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/student/lost-and-found/my-reports')}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-2"
                    >
                        My Posts
                    </button>
                    <button
                        onClick={() => navigate('/student/lost-and-found/report')}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Report a Loss
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit flex-wrap">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 bg-white border border-slate-200 rounded-xl p-4">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={activeTab === 'found' ? "Search found items..." : "Search lost reports..."}
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    />
                </div>
                <select
                    value={filters.category}
                    onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                >
                    <option value="">All Categories</option>
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
                {(filters.category || filters.search) && (
                    <button onClick={() => setFilters({ category: '', search: '' })} className="px-3 py-2 text-sm text-indigo-600 hover:underline">
                        Clear
                    </button>
                )}
            </div>

            {/* Board Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            {activeTab === 'found' ? (
                                <PackageSearch className="w-16 h-16 text-slate-200 mb-4" />
                            ) : (
                                <FileSearch className="w-16 h-16 text-slate-200 mb-4" />
                            )}
                            <h3 className="font-semibold text-slate-700 mb-1">
                                {activeTab === 'found' ? 'No items found at the depot' : 'No active lost reports'}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {activeTab === 'found'
                                    ? "If you lost something, post a report so the community can help."
                                    : "Looks like nobody has reported anything lost recently."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredData.map((item, i) => {
                                const isFoundTab = activeTab === 'found';
                                const dateField = isFoundTab ? item.foundDate : item.lostDate;
                                const routeObj = isFoundTab ? item.routeId : item.busRouteId;
                                const detailRoute = `/student/lost-and-found/item/${isFoundTab ? 'found' : 'report'}/${item._id}`;

                                return (
                                    <motion.div
                                        key={item._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => navigate(detailRoute)}
                                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
                                    >
                                        <div className="relative h-40 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                                            {item.imageBase64 ? (
                                                <img src={item.imageBase64} alt={item.itemName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-6xl drop-shadow-sm">{CATEGORY_ICONS[item.category] || '📦'}</span>
                                            )}
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 mb-2">
                                                <h3 className="font-semibold text-slate-800 text-lg leading-tight w-full">{item.itemName}</h3>
                                                {/* Privacy: Show poster name/enrollment if it's a lost report */}
                                                {!isFoundTab && item.reportedBy && (
                                                    <span className="text-xs text-slate-500 font-medium w-full truncate">
                                                        Posted by: {item.reportedBy.name} ({item.reportedBy.enrollmentNumber})
                                                    </span>
                                                )}
                                                {!isFoundTab && item.status === 'ADMIN_FOUND' && (
                                                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                        📍 Secured at Depot
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{item.description}</p>

                                            <div className="space-y-2 mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                {routeObj && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                        <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                                        <span className="truncate">{routeObj.routeName} ({routeObj.routeNumber})</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                                    <span>
                                                        {isFoundTab ? 'Found: ' : 'Lost: '}
                                                        {new Date(dateField).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold py-2.5 rounded-xl transition-colors">
                                                View Details & Comments
                                                <ChevronRight className="w-4 h-4 opacity-70" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </StudentLayout>
    );
}
