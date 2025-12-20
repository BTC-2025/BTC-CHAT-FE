import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";

export default function StatusModal({ group, onClose, onDelete }) {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const currentStatus = group.statuses[currentIndex];
    const isMine = group.user._id === user?.id;

    // Progress bar and auto-advance
    useEffect(() => {
        setProgress(0);
        const duration = 5000; // 5 seconds per status
        const interval = 50; // Update every 50ms
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
    }, [currentIndex]);

    const handleNext = () => {
        if (currentIndex < group.statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this status?")) return;
        try {
            await axios.delete(`${API_BASE} /status/${currentStatus._id} `, {
                headers: { Authorization: `Bearer ${user?.token} ` }
            });
            if (group.statuses.length === 1) {
                onClose();
            } else {
                handleNext();
            }
            onDelete();
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete status.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                {group.statuses.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-75 linear"
                            style={{
                                width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}% ` : "0%"
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header info */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/30 overflow-hidden bg-white/10">
                        {group.user.avatar ? <img src={group.user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{group.user.full_name?.[0]}</div>}
                    </div>
                    <div>
                        <div className="text-white font-bold text-sm">{group.user.full_name}</div>
                        <div className="text-white/60 text-[10px]">{new Date(currentStatus.createdAt).toLocaleTimeString()}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isMine && (
                        <button onClick={handleDelete} className="text-white/60 hover:text-red-400 p-2 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                    <button onClick={onClose} className="text-white/60 hover:text-white p-2 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Storage Area */}
            <div className="relative w-full h-full max-w-2xl flex items-center justify-center" onClick={(e) => {
                const x = e.clientX;
                const width = window.innerWidth;
                if (x < width / 3) handlePrev();
                else handleNext();
            }}>
                <img
                    src={currentStatus.content}
                    className="max-h-full max-w-full object-contain shadow-2xl"
                    alt="Status"
                    onLoad={() => setProgress(0)}
                />
            </div>

            {/* Bottom tap indicators */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 flex cursor-pointer z-10 pointer-events-none">
                <div className="flex-1 pointer-events-auto" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
                <div className="flex-1 pointer-events-auto" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
            </div>
        </div>
    );
}
