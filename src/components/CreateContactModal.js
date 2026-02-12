import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";
import { useAuth } from "../context/AuthContext";

export default function CreateContactModal({ onClose, onOpenChat }) {
    const { user } = useAuth();

    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // ✅ Use specific phone search endpoint
            const { data: foundUser } = await axios.get(`${API_BASE}/users/search/${phone}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (foundUser) {
                const { data: chat } = await axios.post(`${API_BASE}/chats`, { userId: foundUser.id || foundUser._id }, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                onOpenChat(chat);
                onClose();
            } else {
                setError("User not found with this number.");
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setError("User not found with this number.");
            } else {
                setError("Failed to add contact or find user.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#0f172a] w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col">

                <div className="p-6 pb-2 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-white">New Chat</h2>
                        <p className="text-white/40 text-xs font-medium">Start conversation</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 uppercase tracking-wider">Phone / Username</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors font-mono"
                            placeholder="Enter phone or username"
                            required
                        />
                    </div>

                    {/* Name field is purely decorative if we are just searching by phone, 
                 unless we saved it locally. For now, we'll hide it or keep it visual. 
                 Let's keep it simple to just phone for "New Contact" flow essentially being "New Chat" 
                 if backend support isn't confirmed. 
                 Actually, let's allow searching by name too if the backend supports it.
             */}

                    {error && <div className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-2 rounded-lg">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-base shadow-lg shadow-primary/25 transition-all mt-4"
                    >
                        {loading ? "Searching..." : "Start Chat"}
                    </button>
                </form>

            </div>
        </div>
    );
}
