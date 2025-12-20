import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";

export default function SearchBar({ onOpen }) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const search = async () => {
    setError("");
    setResult(null);

    if (!phone.trim()) return;

    try {
      const { data: userFound } = await axios.get(
        `${API_BASE}/users/search/${phone}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      setResult(userFound);
    } catch (err) {
      setError("No user found");
    }
  };

  const openChat = async () => {
    try {
      const { data: chat } = await axios.post(
        `${API_BASE}/chats/open`,
        { targetPhone: result.phone },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      onOpen(chat);
      setPhone("");
      setResult(null);

    } catch (err) {
      console.error("Failed to open chat:", err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full bg-white/90 backdrop-blur-sm border border-background-dark/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all duration-200 text-primary placeholder:text-primary/40 shadow-sm"
            placeholder="Search by phone number..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
        </div>
        <button
          className="px-4 py-2.5 bg-white border border-primary/30 hover:bg-background-dark text-primary rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md flex items-center gap-1.5"
          onClick={search}
        >
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {error && <div className="text-xs sm:text-sm text-red-500 animate-fade-in">{error}</div>}

      {result && (
        <div className="p-3 rounded-xl bg-white border border-background-dark/50 flex items-center justify-between gap-3 shadow-card animate-slide-up">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light grid place-items-center text-sm font-bold text-white shadow-md">
              {result.full_name?.[0] || "?"}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate text-primary">{result.full_name || "Unnamed"}</div>
              <div className="text-xs text-primary/50">{result.phone}</div>
            </div>
          </div>
          <button
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md flex-shrink-0"
            onClick={openChat}
          >
            Chat
          </button>
        </div>
      )}
    </div>
  );
}
