import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, MapPin, Calendar, Clock,
    MessageSquare, Send, ShieldAlert, PackageSearch,
    Trash2, Lock, Unlock
} from 'lucide-react';
import { lostFound } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

const CATEGORY_ICONS = {
    id_card: '🪪', bag: '🎒', electronics: '📱',
    clothing: '👕', documents: '📄', water_bottle: '🍶', other: '📦'
};

export default function AdminItemDetail() {
    const { type, id } = useParams(); // type is 'found' or 'report'
    const navigate = useNavigate();
    const { user } = useAuth(); // Logged in admin

    const [item, setItem] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetchDetails();
        fetchComments();
    }, [type, id]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const fetchDetails = async () => {
        try {
            const res = await lostFound.getItemDetails(type, id);
            setItem(res.data);
        } catch (err) {
            setError('Item not found or has been resolved.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await lostFound.getComments(type, id);
            setComments(res.data);
        } catch (err) {
            console.error('Failed to load comments', err);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setPosting(true);
        try {
            const res = await lostFound.addComment(type, id, { message: newComment });
            setComments(prev => [...prev, res.data]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to post comment', err);
            showToast('❌ ' + (err.response?.data?.message || 'Failed to post'));
        } finally {
            setPosting(false);
        }
    };

    // Chat Moderation Actions
    const handleToggleChat = async () => {
        if (!item) return;
        const newStatus = !item.isChatEnabled;
        try {
            const res = await lostFound.toggleChatEnabled(type, id, { isChatEnabled: newStatus });
            setItem(prev => ({ ...prev, isChatEnabled: res.data.isChatEnabled }));
            showToast(`✅ Chat thread ${newStatus ? 'unlocked' : 'locked'}`);
        } catch (err) {
            console.error('Toggle chat error', err);
            showToast('❌ Failed to toggle chat status');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment permanently?')) return;
        try {
            await lostFound.deleteComment(commentId);
            setComments(prev => prev.filter(c => c._id !== commentId));
            showToast('✅ Comment deleted');
        } catch (err) {
            console.error('Delete comment error', err);
            showToast('❌ Failed to delete comment');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ padding: '4rem' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="admin-dashboard-wrapper">
                <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">{error || 'Item Not Found'}</h2>
                    <button onClick={() => navigate('/admin/lost-found')} className="admin-btn admin-btn-primary mx-auto mt-4">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isFoundTab = type === 'found';
    const dateField = isFoundTab ? item.foundDate : item.lostDate;
    const routeObj = isFoundTab ? item.routeId : item.busRouteId;

    return (
        <div className="admin-dashboard-wrapper max-w-5xl mx-auto pb-10">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    background: '#1e293b', color: 'white', padding: '12px 20px',
                    borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxWidth: '320px'
                }}>
                    {toast}
                </div>
            )}

            <button
                onClick={() => navigate('/admin/lost-found')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium border-none bg-transparent cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                {/* Moderation Banner */}
                <div className={`px-6 py-3 border-b flex items-center justify-between ${item.isChatEnabled ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2">
                        {item.isChatEnabled ? <Unlock className="w-4 h-4 text-indigo-600" /> : <Lock className="w-4 h-4 text-rose-600" />}
                        <span className={`text-sm font-semibold ${item.isChatEnabled ? 'text-indigo-800' : 'text-rose-800'}`}>
                            {item.isChatEnabled ? 'Chat is currently OPEN to students.' : 'Chat is LOCKED. Students cannot comment.'}
                        </span>
                    </div>
                    <button
                        onClick={handleToggleChat}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${item.isChatEnabled ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                    >
                        {item.isChatEnabled ? 'Lock Thread' : 'Unlock Thread'}
                    </button>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {item.imageBase64 ? (
                                    <img src={item.imageBase64} alt={item.itemName} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="text-3xl drop-shadow-sm">{CATEGORY_ICONS[item.category] || '📦'}</div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-1">{item.itemName}</h1>
                                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${isFoundTab ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {isFoundTab ? 'Found Item' : 'Lost Report'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-slate-600 mb-6">
                        <p className="whitespace-pre-wrap">{item.description}</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                            <MapPin className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Route Area</p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {routeObj ? `${routeObj.routeName} (${routeObj.routeNumber})` : 'Unknown Route'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">
                                    {isFoundTab ? 'Date Found' : 'Date Lost'}
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {new Date(dateField).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                            <ShieldAlert className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Status</p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {item.status}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comment Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-800 m-0">Admin Discussion View</h2>
                </div>

                <div className="p-6 bg-slate-50/50">
                    {/* Comments List */}
                    <div className="space-y-6 mb-8">
                        {comments.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-sm">
                                No comments yet on this item.
                            </div>
                        ) : (
                            comments.map(comment => {
                                const isMe = comment.userId?._id === user?._id;
                                const roleBadge = comment.userId?.role === 'admin' ? 'Admin' :
                                    comment.userId?.role === 'driver' ? 'Driver' : null;

                                return (
                                    <div key={comment._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                                        <div className={`max-w-[85%] sm:max-w-md ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200'} rounded-2xl px-5 py-4 shadow-sm relative`}>

                                            {/* Admin Delete Button (Visible on hover) */}
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10`}
                                                title="Delete Comment"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`text-xs font-bold ${isMe ? 'text-indigo-200' : 'text-slate-800'}`}>
                                                    {isMe ? 'You' : comment.userId?.name || 'Anonymous Student'}
                                                </span>
                                                <span className={`text-xs font-medium ${isMe ? 'text-indigo-300' : 'text-slate-500'}`}>
                                                    ({comment.userId?.enrollmentNumber || comment.userId?.employeeId || 'System'})
                                                </span>
                                                {roleBadge && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isMe ? 'bg-indigo-500 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                                        {roleBadge}
                                                    </span>
                                                )}
                                                {/* Admins can see full details */}
                                                {!isMe && comment.userId?.role === 'student' && comment.userId?.mobile && (
                                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">
                                                        📞 {comment.userId.mobile}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm whitespace-pre-wrap ${isMe ? 'text-indigo-50' : 'text-slate-600'}`}>
                                                {comment.message}
                                            </p>
                                            <div className={`text-[10px] mt-2 text-right ${isMe ? 'text-indigo-300' : 'text-slate-400'}`}>
                                                {new Date(comment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Comment Input */}
                    <form onSubmit={handlePostComment} className="flex items-end gap-3">
                        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all overflow-hidden">
                            <textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Type an admin message..."
                                className="w-full max-h-32 min-h-[56px] p-3 text-sm focus:outline-none resize-y"
                                rows="1"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={posting || !newComment.trim()}
                            className="h-14 w-14 flex items-center justify-center bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
                        >
                            {posting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
