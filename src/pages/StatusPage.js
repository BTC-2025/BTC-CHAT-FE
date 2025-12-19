import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function StatusPage({ onBack }) {
    const { user } = useAuth();
    const [statusGroups, setStatusGroups] = useState([]);
    const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
    const [currentStatusIdx, setCurrentStatusIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);

    const fetchStatuses = async () => {
        try {
            const { data } = await axios.get("https://btc-chat-be.onrender.com/api/status", {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setStatusGroups(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch statuses:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchStatuses();
    }, [user?.token]);

    const currentGroup = statusGroups[selectedGroupIdx];
    const currentStatus = currentGroup?.statuses?.[currentStatusIdx];
    const isMine = currentGroup?.user?._id === user?.id;

    // Progress bar and auto-advance
    useEffect(() => {
        if (!currentStatus) return;

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
    }, [selectedGroupIdx, currentStatusIdx, statusGroups]);

    const handleNext = () => {
        if (currentStatusIdx < currentGroup.statuses.length - 1) {
            setCurrentStatusIdx(currentStatusIdx + 1);
        } else if (selectedGroupIdx < statusGroups.length - 1) {
            setSelectedGroupIdx(selectedGroupIdx + 1);
            setCurrentStatusIdx(0);
        } else {
            onBack();
        }
    };

    const handlePrev = () => {
        if (currentStatusIdx > 0) {
            setCurrentStatusIdx(currentStatusIdx - 1);
        } else if (selectedGroupIdx > 0) {
            setSelectedGroupIdx(selectedGroupIdx - 1);
            setCurrentStatusIdx(statusGroups[selectedGroupIdx - 1].statuses.length - 1);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await axios.post("https://btc-chat-be.onrender.com/api/upload", formData, {
                headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "multipart/form-data" }
            });
            await axios.post("https://btc-chat-be.onrender.com/api/status",
                { content: uploadRes.data.url, type: "image" },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            await fetchStatuses();
            // Jump to my status after upload
            const id = user.id;
            const idx = statusGroups.findIndex(g => g.user._id === id);
            if (idx !== -1) setSelectedGroupIdx(idx);
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
            await axios.delete(`https://btc-chat-be.onrender.com/api/status/${currentStatus._id}`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            await fetchStatuses();
            if (currentGroup.statuses.length === 1) {
                if (selectedGroupIdx < statusGroups.length - 1) handleNext();
                else onBack();
            } else {
                handleNext();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    if (loading) return (
        <div className="h-screen w-screen bg-black flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white animate-spin rounded-full" />
        </div>
    );

    return (
        <div className="h-screen w-screen bg-black flex flex-col relative overflow-hidden select-none">
            {/* Background Layer (Blurred) */}
            {currentStatus && (
                <div
                    className="absolute inset-0 opacity-40 blur-3xl scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${currentStatus.content})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
            )}

            {/* TOP NAVIGATION / PROGRESS */}
            <div className="absolute top-0 inset-x-0 p-4 z-50 flex flex-col gap-4 bg-gradient-to-b from-black/60 to-transparent">
                {/* Progress Bars */}
                {currentGroup && (
                    <div className="flex gap-1.5 w-full max-w-2xl mx-auto">
                        {currentGroup.statuses.map((_, idx) => (
                            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-75 linear"
                                    style={{ width: idx < currentStatusIdx ? "100%" : idx === currentStatusIdx ? `${progress}%` : "0%" }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Header Controls */}
                <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors md:hidden">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full border border-white/30 overflow-hidden bg-white/10 ring-2 ring-primary">
                                {currentGroup?.user?.avatar ? <img src={currentGroup.user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{currentGroup?.user?.full_name?.[0]}</div>}
                            </div>
                            <div>
                                <div className="text-white font-bold text-sm leading-tight">{currentGroup?.user?.full_name}</div>
                                <div className="text-white/60 text-[10px]">{currentStatus ? new Date(currentStatus.createdAt).toLocaleTimeString() : ''}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isMine && (
                            <button onClick={handleDeleteStatus} className="text-white/60 hover:text-red-400 p-2 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        <button onClick={() => fileInputRef.current?.click()} className="text-white/60 hover:text-white p-2 transition-colors" title="Add status">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button onClick={onBack} className="hidden md:block text-white/60 hover:text-white p-2 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex items-center justify-center relative cursor-pointer group px-0 sm:px-4" onClick={(e) => {
                const x = e.clientX;
                const width = window.innerWidth;
                if (x < width / 3) handlePrev();
                else handleNext();
            }}>
                {currentStatus ? (
                    <div className="relative w-full h-full flex items-center justify-center max-w-4xl mx-auto overflow-hidden">
                        <img
                            src={currentStatus.content}
                            className="w-full h-full object-contain transition-all duration-300"
                            alt="Status"
                            onLoad={() => setProgress(0)}
                        />
                    </div>
                ) : (
                    <div className="text-white/40 text-center px-4">
                        <p className="text-lg">No statuses yet</p>
                        <p className="text-sm mt-2">Share your moment with contacts</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="mt-6 px-6 py-2.5 bg-primary rounded-full font-semibold text-white hover:bg-primary-light transition-all shadow-lg"
                        >
                            Upload Photo
                        </button>
                    </div>
                )}

                {/* Desktop arrows */}
                <div className="hidden md:flex absolute inset-y-0 left-0 right-0 justify-between items-center px-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-3 rounded-full bg-black/40 text-white pointer-events-auto hover:bg-black/60 border border-white/10 backdrop-blur-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-3 rounded-full bg-black/40 text-white pointer-events-auto hover:bg-black/60 border border-white/10 backdrop-blur-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {/* SIDEBAR TABS (Desktop Only) */}
            {statusGroups.length > 0 && (
                <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-white font-bold text-lg">Recent Updates</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-hide">
                        {statusGroups.map((g, idx) => (
                            <div
                                key={g.user._id}
                                onClick={(e) => { e.stopPropagation(); setSelectedGroupIdx(idx); setCurrentStatusIdx(0); }}
                                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${idx === selectedGroupIdx ? 'bg-primary/20 border border-primary/20 ring-1 ring-primary/50' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className={`w-12 h-12 rounded-full p-[2px] ${idx === selectedGroupIdx ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className="w-full h-full rounded-full border border-black overflow-hidden bg-white/5">
                                        {g.user.avatar ? <img src={g.user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{g.user.full_name?.[0]}</div>}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-white font-bold text-sm truncate">{g.user.full_name}</div>
                                    <div className="text-white/40 text-xs truncate">
                                        {g.statuses.length} updates • {new Date(g.statuses[0].createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <input type="file" hidden ref={fileInputRef} onChange={handleUpload} accept="image/*" />

            {uploading && (
                <div className="absolute inset-0 bg-black/60 z-[200] flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
                    <span className="text-white font-bold tracking-widest text-sm uppercase">Uploading Moment...</span>
                </div>
            )}
        </div>
    );
}
