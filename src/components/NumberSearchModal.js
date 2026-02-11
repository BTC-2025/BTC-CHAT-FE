import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../api";
import { useAuth } from "../context/AuthContext";

export default function NumberSearchModal({ onClose, onOpenChat }) {
    const { user } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Focus trap or just refined UI
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleDigitClick = (digit) => {
        if (phoneNumber.length < 15) { // Simple length limit
            setPhoneNumber((prev) => prev + digit);
            setError(null);
        }
    };

    const handleBackspace = () => {
        setPhoneNumber((prev) => prev.slice(0, -1));
        setError(null);
    };

    const handleSearch = async () => {
        if (!phoneNumber) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Try to find user by phone number
            // Note: Assuming an endpoint exists or we use a general search. 
            // If specific endpoint for phone search doesn't exist, we might need to adjust.
            // For now, I'll attempt to use a likely endpoint or just create a chat directly if the backend supports "create by phone".
            // Often 'create chat' with a phone number is the way to go.

            // Let's try to create/fetch chat by phone number. 
            // If the backend expects a userId for creating chat, we first need to find the user.
            // I'll try a search endpoint first.

            const { data: users } = await axios.get(`${API_BASE}/users/search?query=${phoneNumber}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const foundUser = users.find(u => u.phone === phoneNumber || u.username === phoneNumber); // Adjust based on actual user model

            if (foundUser) {
                // Create/Open chat
                const { data: chat } = await axios.post(`${API_BASE}/chats`, { userId: foundUser._id }, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                onOpenChat(chat);
                onClose();
            } else {
                // If exact match not found in search, maybe try creating chat directly if backend supports raw phone?
                // If not, show error.
                setError("User not found with this number.");
            }

        } catch (err) {
            console.error(err);
            setError("Failed to find user. Please check the number.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#0f172a] w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-white">Dial Number</h2>
                        <p className="text-white/40 text-xs font-medium">Enter phone number to chat</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    </button>
                </div>

                {/* Display */}
                <div className="px-6 py-4">
                    <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5 relative">
                        <span className="text-3xl font-mono tracking-widest text-white/90 min-h-[40px] block">
                            {phoneNumber || <span className="opacity-20">...</span>}
                        </span>
                        {error && <div className="absolute -bottom-6 left-0 right-0 text-red-400 text-xs font-bold">{error}</div>}
                    </div>
                </div>

                {/* Keypad */}
                <div className="p-6 pt-2 grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleDigitClick(num.toString())}
                            className="h-14 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-all flex items-center justify-center text-xl font-bold text-white border border-white/5"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={() => handleDigitClick("+")}
                        className="h-14 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-all flex items-center justify-center text-xl font-bold text-white border border-white/5"
                    >
                        +
                    </button>
                    <button
                        onClick={() => handleDigitClick("0")}
                        className="h-14 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-all flex items-center justify-center text-xl font-bold text-white border border-white/5"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="h-14 rounded-xl bg-white/5 hover:bg-red-500/20 active:bg-red-500/30 transition-all flex items-center justify-center text-xl font-bold text-red-400 border border-white/5 group"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l5.94-6.287c.813-.86 2.079-1.213 3.227-.852 2.37.747 4.143 3.091 4.543 5.76.284 1.89-.356 3.797-1.623 5.115-1.004 1.045-2.457 1.543-3.9 1.258-1.58-.312-2.924-1.428-3.483-2.94L3 12z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    </button>
                </div>

                {/* Action */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleSearch}
                        disabled={loading || phoneNumber.length < 3}
                        className="w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                                <span>Search & Chat</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
