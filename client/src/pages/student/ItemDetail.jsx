import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, MapPin, Calendar, Clock,
    MessageSquare, Send, ShieldAlert, PackageSearch
} from 'lucide-react';
import { lostFound } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_ICONS = {
    id_card: '🪪', bag: '🎒', electronics: '📱',
    clothing: '👕', documents: '📄', water_bottle: '🍶', other: '📦'
};

export default function ItemDetail() {
    const { type, id } = useParams(); // type is 'found' or 'report'
    const navigate = useNavigate();
    const { user } = useAuth();

    const [item, setItem] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
        fetchComments();
    }, [type, id]);

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
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
            </StudentLayout>
        );
    }

    if (error || !item) {
        return (
            <StudentLayout>
                <div className="max-w-2xl mx-auto text-center py-20">
                    <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">{error || 'Item Not Found'}</h2>
                    <button onClick={() => navigate('/student/lost-and-found')} className="text-indigo-600 hover:underline">
                        Return to Board
                    </button>
                </div>
            </StudentLayout>
        );
    }

    const isFoundTab = type === 'found';
    const dateField = isFoundTab ? item.foundDate : item.lostDate;
    const routeObj = isFoundTab ? item.routeId : item.busRouteId;

    return (
        <StudentLayout>
            <div className="max-w-3xl mx-auto pb-10">
                <button
                    onClick={() => navigate('/student/lost-and-found')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Noticeboard
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    {/* Image / Icon Header */}
                    <div className="h-64 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                        {item.imageBase64 ? (
                            <img src={item.imageBase64} alt={item.itemName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-8xl drop-shadow-sm">{CATEGORY_ICONS[item.category] || '📦'}</div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 border border-slate-200 shadow-sm uppercase tracking-wider">
                            {isFoundTab ? 'Found Item' : 'Lost Report'}
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{item.itemName}</h1>

                                {/* Privacy: Show name/enrollment for lost reports */}
                                {!isFoundTab && item.reportedBy && (
                                    <div className="inline-flex items-center text-sm font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                                        Posted by: {item.reportedBy.name} ({item.reportedBy.enrollmentNumber})
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-slate max-w-none text-slate-600 mb-8">
                            <p className="whitespace-pre-wrap">{item.description}</p>

                            {!isFoundTab && item.identifyingDetails && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                    <strong className="text-slate-700 block mb-1">Identifying Details:</strong>
                                    {item.identifyingDetails}
                                </div>
                            )}
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
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
                                        {new Date(dateField).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Admin directions */}
                        {isFoundTab && (
                            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-800 m-0">Is this yours?</h4>
                                    <p className="text-sm text-amber-700 mt-1 mb-0">
                                        This item is currently held at the depot. Leave a comment below or contact your Admin to arrange collection.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isFoundTab && item.status === 'ADMIN_FOUND' && (
                            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                                <PackageSearch className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-emerald-800 m-0">Item Secured!</h4>
                                    <p className="text-sm text-emerald-700 mt-1 mb-0">
                                        Good news! An admin has found and secured your item. Please visit the admin office/depot to collect it.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comment Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-800 m-0">Discussion Board</h2>
                    </div>

                    <div className="p-6 bg-slate-50/50">
                        {/* Comments List */}
                        <div className="space-y-6 mb-8">
                            {comments.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-sm">
                                    No comments yet. Be the first to start the discussion!
                                </div>
                            ) : (
                                comments.map(comment => {
                                    const isMe = comment.userId?._id === user?._id;
                                    const roleBadge = comment.userId?.role === 'admin' ? 'Admin' :
                                        comment.userId?.role === 'driver' ? 'Driver' : null;

                                    return (
                                        <div key={comment._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] sm:max-w-md ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200'} rounded-2xl px-5 py-4 shadow-sm`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs font-bold ${isMe ? 'text-indigo-200' : 'text-slate-800'}`}>
                                                        {isMe ? 'You' : comment.userId?.name || 'Anonymous Student'}
                                                    </span>
                                                    {!isMe && comment.userId?.enrollmentNumber && (
                                                        <span className="text-xs font-medium text-slate-500">
                                                            ({comment.userId.enrollmentNumber})
                                                        </span>
                                                    )}
                                                    {roleBadge && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isMe ? 'bg-indigo-500 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                                            {roleBadge}
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

                        {/* Comment Input or Lock Message */}
                        {item.isChatEnabled === false ? (
                            <div className="mt-4 p-4 rounded-xl bg-slate-100 border border-slate-200 text-center flex flex-col items-center">
                                <ShieldAlert className="w-6 h-6 text-slate-400 mb-2" />
                                <h4 className="font-semibold text-slate-700 m-0">This thread is locked.</h4>
                                <p className="text-sm text-slate-500 mt-1 mb-0">An administrator has disabled new comments on this item.</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePostComment} className="flex items-end gap-3 mt-4">
                                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all overflow-hidden">
                                    <textarea
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full max-h-32 min-h-[56px] p-3 text-sm focus:outline-none resize-y"
                                        rows="1"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={posting || !newComment.trim()}
                                    className="h-14 w-14 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl transition-colors flex-shrink-0"
                                >
                                    {posting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </form>
                        )}
                        <p className="text-xs text-center text-slate-400 mt-3 font-medium flex items-center justify-center gap-1.5">
                            <ShieldAlert className="w-3 h-3" />
                            Your Name and Enrollment Number will be visible to everyone on this board.
                        </p>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
