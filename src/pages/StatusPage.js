import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import StatusPrivacyModal from "../components/StatusPrivacyModal";

export default function StatusPage({ onBack }) {
    const { user } = useAuth();
    const [statusGroups, setStatusGroups] = useState([]);
    const [selectedGroupIdx, setSelectedGroupIdx] = useState(null);
    const [currentStatusIdx, setCurrentStatusIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [showViewers, setShowViewers] = useState(false);
    const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);

    const fetchStatuses = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/status`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setStatusGroups(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch statuses:", err);
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) fetchStatuses();
    }, [user?.token, fetchStatuses]);

    const myGroup = statusGroups.find(g => g.user._id === user?.id);
    const otherGroups = statusGroups.filter(g => g.user._id !== user?.id);

    const currentGroup = selectedGroupIdx !== null ? statusGroups[selectedGroupIdx] : null;
    const currentStatus = currentGroup?.statuses?.[currentStatusIdx];
    const isMine = currentGroup?.user?._id === user?.id;

    const handleNext = useCallback(() => {
        if (!currentGroup) return;
        if (currentStatusIdx < currentGroup.statuses.length - 1) {
            setCurrentStatusIdx(currentStatusIdx + 1);
        } else if (selectedGroupIdx < statusGroups.length - 1) {
            const nextIdx = selectedGroupIdx + 1;
            setSelectedGroupIdx(nextIdx);
            setCurrentStatusIdx(0);
        } else {
            setSelectedGroupIdx(null);
        }
    }, [currentGroup, currentStatusIdx, selectedGroupIdx, statusGroups.length]);

    // Progress bar and auto-advance
    useEffect(() => {
        if (!currentStatus || showViewers) return;

        setProgress(0);
        const duration = 5000;
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentStatus, showViewers, handleNext]);

    // Track views
    useEffect(() => {
        if (currentStatus && !isMine && !currentStatus.viewedBy?.includes(user?.id)) {
            axios.post(`${API_BASE}/status/view/${currentStatus._id}`, {}, {
                headers: { Authorization: `Bearer ${user?.token}` }
            }).catch(e => console.error("View track failed", e));
        }
    }, [currentStatus, isMine, user?.id, user?.token]);

    const handlePrev = () => {
        if (!currentGroup) return;
        if (currentStatusIdx > 0) {
            setCurrentStatusIdx(currentStatusIdx - 1);
        } else if (selectedGroupIdx > 0) {
            const prevIdx = selectedGroupIdx - 1;
            setSelectedGroupIdx(prevIdx);
            setCurrentStatusIdx(statusGroups[prevIdx].statuses.length - 1);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingFile(file);
        setPrivacyModalOpen(true);
        e.target.value = "";
    };

    const handleConfirmPrivacy = async (visibleTo) => {
        setPrivacyModalOpen(false);
        if (!pendingFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", pendingFile);
            const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
                headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "multipart/form-data" }
            });

            await axios.post(`${API_BASE}/status`,
                {
                    content: uploadRes.data.url,
                    type: "image",
                    visibleTo: visibleTo
                },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            await fetchStatuses();
            setPendingFile(null);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload status.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteStatus = async () => {
        if (!window.confirm("Delete this status?")) return;
        try {
            await axios.delete(`${API_BASE}/status/${currentStatus._id}`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            await fetchStatuses();
            if (currentGroup.statuses.length === 1) {
                setSelectedGroupIdx(null);
            } else {
                handleNext();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    if (loading) return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
        </div>
    );

    return (
        <div className="h-full w-full bg-[#e9f4ff] flex relative overflow-hidden select-none animate-fade-in">
            {/* Background Layer (Blurred) */}
            {currentStatus && (
                <div
                    className="absolute inset-0 opacity-20 blur-[100px] scale-125 pointer-events-none transition-all duration-1000 animate-pulse-slow"
                    style={{ backgroundImage: `url(${currentStatus.content})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
            )}

            {/* LEFT SIDEBAR - Responsive: Hidden on mobile when viewing status */}
            <div className={`w-full md:w-[400px] flex flex-col bg-white/80 backdrop-blur-3xl border-r border-slate-200 z-50 overflow-hidden ${selectedGroupIdx !== null ? 'hidden md:flex' : 'flex'} relative shadow-[10px_0_30px_rgba(0,0,0,0.05)]`}>

                {/* Decorative Gradients */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                <div className="p-6 border-b border-slate-200 flex items-center justify-between relative z-10">
                    <div>
                        <h2 className="text-slate-800 font-black text-2xl tracking-tight">Status</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Updates & Stories</p>
                    </div>
                    <button onClick={onBack} title="Back to Chats" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-800 hover:scale-105 active:scale-95 border border-transparent">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar relative z-10">
                    {/* MY STATUS SECTION */}
                    <div className="px-2 py-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span>My Status</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-3xl transition-all mb-2 bg-gradient-to-r from-white to-slate-50 hover:shadow-md border border-slate-200/60 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {/* OWNER RING */}
                            <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-primary to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-500">
                                <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-100 relative">
                                    {user?.avatar ? <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">{user?.full_name?.[0]}</div>}
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white text-lg font-bold shadow-lg transform group-hover:scale-110 transition-transform">+</div>
                        </div>

                        <div className="flex-1 flex items-center justify-between relative z-10">
                            <div className="cursor-pointer" onClick={() => {
                                if (myGroup) {
                                    setSelectedGroupIdx(statusGroups.findIndex(g => g.user._id === user.id));
                                    setCurrentStatusIdx(0);
                                } else {
                                    fileInputRef.current?.click();
                                }
                            }}>
                                <div className="text-slate-800 font-bold text-base group-hover:text-primary transition-colors">My Status</div>
                                <div className="text-slate-500 text-xs font-medium mt-0.5">{myGroup ? `${myGroup.statuses.length} updates` : 'Tap to add status update'}</div>
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all rounded-xl hover:scale-105 active:scale-95">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* RECENT UPDATES SECTION */}
                    {otherGroups.length > 0 && (
                        <>
                            <div className="px-2 py-4 text-slate-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                                <div className="h-px bg-slate-200 flex-1"></div>
                                <span>Recent Updates</span>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>

                            <div className="space-y-2">
                                {otherGroups.map((g, idx) => {
                                    const globalIdx = statusGroups.findIndex(sg => sg.user._id === g.user._id);
                                    const hasUnviewed = g.statuses.some(s => !s.viewedBy?.some(v => (v._id || v) === user?.id));

                                    return (
                                        <div
                                            key={g.user._id}
                                            onClick={() => { setSelectedGroupIdx(globalIdx); setCurrentStatusIdx(0); }}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                            className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all animate-slide-up group border border-transparent ${globalIdx === selectedGroupIdx
                                                ? 'bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                                : 'hover:bg-white hover:shadow-sm hover:border-slate-100'
                                                }`}
                                        >
                                            <div className={`w-14 h-14 rounded-full p-[2px] transition-all duration-500 ${hasUnviewed
                                                ? 'bg-gradient-to-tr from-emerald-400 to-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                                : 'bg-slate-200 group-hover:bg-slate-300'
                                                } hover:scale-105`}>
                                                <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-100">
                                                    {g.user.avatar ? <img src={g.user.avatar} alt={g.user.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{g.user.full_name?.[0]}</div>}
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className={`text-slate-800 font-bold text-base truncate transition-colors ${hasUnviewed ? 'text-slate-900' : 'text-slate-600'} group-hover:text-primary`}>
                                                    {g.user.full_name}
                                                </div>
                                                <div className="text-slate-500 text-xs truncate flex items-center gap-2 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${hasUnviewed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                    {new Date(g.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <svg className={`w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-all ${globalIdx === selectedGroupIdx ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* VIEWER AREA - Responsive: Hidden on mobile when list is visible */}
            <div className={`flex-1 flex flex-col relative h-full bg-black ${selectedGroupIdx === null ? 'hidden md:flex' : 'flex'}`}>
                {currentStatus ? (
                    <>
                        <div className="absolute top-0 inset-x-0 p-4 sm:p-8 z-[60] flex flex-col gap-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
                            <div className="flex gap-2 w-full max-w-3xl mx-auto px-4">
                                {currentGroup.statuses.map((_, idx) => (
                                    <div key={idx} className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className="h-full bg-white transition-all duration-75 linear shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                            style={{ width: idx < currentStatusIdx ? "100%" : idx === currentStatusIdx ? `${progress}%` : "0%" }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-2 mt-2">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedGroupIdx(null)} className="md:hidden text-white p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-primary to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                                        <div className="w-full h-full rounded-full border-2 border-black overflow-hidden relative">
                                            {currentGroup?.user?.avatar ? <img src={currentGroup.user.avatar} alt={currentGroup.user.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white font-bold text-xl">{currentGroup?.user?.full_name?.[0]}</div>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-white font-black text-lg leading-tight drop-shadow-lg tracking-tight">{currentGroup?.user?.full_name}</div>
                                        <div className="text-white/80 text-xs font-bold mt-0.5 drop-shadow-md flex items-center gap-2">
                                            <span className="opacity-60">Today at</span>
                                            {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4">
                                    {isMine && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const newShow = !showViewers;
                                                    setShowViewers(newShow);
                                                    if (newShow) fetchStatuses();
                                                }}
                                                className={`flex items-center gap-2 px-5 py-2.5 transition-all rounded-full border font-bold text-sm backdrop-blur-md ${showViewers ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-white bg-black/20 border-white/20 hover:bg-white/10 hover:border-white/40'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                <span>{currentStatus.viewedBy?.length || 0}</span>
                                            </button>
                                            <button onClick={handleDeleteStatus} className="text-white/60 hover:text-red-400 p-3 transition-all rounded-full hover:bg-red-500/10 hover:border-red-500/30 border border-transparent">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setSelectedGroupIdx(null)} className="text-white/60 hover:text-white p-3 transition-all rounded-full hover:bg-white/10 hover:scale-110 active:scale-90 border border-transparent hover:border-white/20 hidden md:block">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative z-20" onClick={(e) => {
                            const x = e.clientX;
                            const width = window.innerWidth;
                            if (x < width / 3) handlePrev();
                            else handleNext();
                        }}>
                            <img
                                key={currentStatus._id}
                                src={currentStatus.content}
                                className="max-w-full max-h-full object-contain shadow-2xl animate-scale-up duration-300 pointer-events-none select-none drop-shadow-2xl"
                                alt="Status Content"
                                style={{ maxHeight: '85vh', maxWidth: '90vw' }}
                            />

                            {/* Viewers List Drawer */}
                            {showViewers && isMine && (
                                <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-3xl border-t border-white/10 p-8 z-[100] animate-slide-up rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                    <div className="max-w-md mx-auto">
                                        <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
                                            <div>
                                                <h3 className="text-white font-black text-2xl">Views</h3>
                                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">People who saw this update</p>
                                            </div>
                                            <button onClick={() => setShowViewers(false)} className="text-white/60 hover:text-white px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-bold text-sm">Close</button>
                                        </div>
                                        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {currentStatus.viewedBy?.length > 0 ? (
                                                currentStatus.viewedBy.map((v, i) => {
                                                    const isPopulated = v && typeof v === 'object';
                                                    return (
                                                        <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors">
                                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                                                                {isPopulated && v.avatar ? (
                                                                    <img src={v.avatar} alt={v.full_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-white/50 font-bold text-lg">
                                                                        {(isPopulated ? (v.full_name || v.phone) : 'U')[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-white text-base font-bold">
                                                                    {isPopulated ? (v.full_name || v.phone) : 'Viewing user'}
                                                                </div>
                                                                <div className="text-white/40 text-xs font-medium">
                                                                    {isPopulated && v.phone ? v.phone : 'Viewed recently'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-12 flex flex-col items-center opacity-40">
                                                    <svg className="w-12 h-12 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    <p className="text-white font-bold">No views yet</p>
                                                    <p className="text-xs mt-1">Share with more friends!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Arrows */}
                            <div className="hidden md:flex absolute inset-y-0 left-0 right-0 justify-between items-center px-12 opacity-0 hover:opacity-100 transition-opacity pointer-events-none group">
                                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-5 rounded-full bg-slate-900/40 text-white pointer-events-auto hover:bg-primary hover:text-white border border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-90 shadow-xl group/btn">
                                    <svg className="w-8 h-8 group-hover/btn:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-5 rounded-full bg-slate-900/40 text-white pointer-events-auto hover:bg-primary hover:text-white border border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-90 shadow-xl group/btn">
                                    <svg className="w-8 h-8 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    // LANDING VIEW (No status selected) - UPDATED FOR LIGHT THEME
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden bg-[#e9f4ff]">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px] animate-pulse-slow animation-delay-2000 pointer-events-none" />

                        <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center backdrop-blur-md border border-slate-200 mb-10 shadow-xl relative z-10 animate-scale-up">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-[3rem]" />
                            <svg className="w-16 h-16 text-primary drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>

                        <h3 className="text-slate-800 text-5xl font-black tracking-tighter mb-4 relative z-10 drop-shadow-sm">
                            Status <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Stories</span>
                        </h3>

                        <p className="text-slate-500 text-lg max-w-[400px] mx-auto leading-relaxed mb-12 relative z-10 font-medium">
                            {statusGroups.length > 0
                                ? "Select a contact from the list to immerse yourself in their shared moments."
                                : "Share your world. Be the first to start a visual conversation with your contacts."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 relative z-10">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-10 py-5 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-2xl hover:to-primary transition-all hover:scale-105 shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center gap-3 group border border-transparent"
                            >
                                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                <span>Share My Update</span>
                            </button>
                            {statusGroups.length === 0 && (
                                <button onClick={onBack} className="px-10 py-5 bg-white text-slate-500 hover:text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-200">
                                    Return to Chats
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} accept="image/*" />

            <StatusPrivacyModal
                isOpen={privacyModalOpen}
                onClose={() => { setPrivacyModalOpen(false); setPendingFile(null); }}
                onConfirm={handleConfirmPrivacy}
            />

            {uploading && (
                <div className="absolute inset-0 bg-slate-900/50 z-[200] flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-white/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent animate-spin rounded-full shadow-lg" />
                    </div>
                    <span className="text-white font-black tracking-[0.3em] text-sm uppercase mt-8 animate-pulse text-center drop-shadow-md">Uploading Moment...</span>
                </div>
            )}
        </div>
    );
}
