import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
      const { data } = await axios.get(
        `https://btc-chat-be.onrender.com/api/users/search/${phone}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`, // ✅ Add token
          },
        }
      );

      setResult(data);
    } catch (err) {
      setError("No user found");
    }
  };

  const openChat = async () => {
    try {
      const { data } = await axios.post(
        "https://btc-chat-be.onrender.com/api/chats/open",
        { targetPhone: result.phone },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`, // ✅ Add token
          },
        }
      );

      onOpen(data); // { id, other }

      setPhone("");
      setResult(null);

    } catch (err) {
      console.error("Failed to open chat:", err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-neutral-800 rounded-xl px-3 py-2 outline-none"
          placeholder="Search by phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="px-3 py-2 bg-teal-600 rounded-xl" onClick={search}>
          Search
        </button>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      {result && (
        <div className="p-3 rounded-xl bg-neutral-800 flex items-center justify-between">
          <div>
            <div className="font-medium">{result.full_name || "Unnamed"}</div>
            <div className="text-xs text-neutral-400">{result.phone}</div>
          </div>
          <button className="px-3 py-2 bg-teal-600 rounded-lg" onClick={openChat}>
            Chat
          </button>
        </div>
      )}
    </div>
  );
}
