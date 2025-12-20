import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.js";
import axios from "axios";
import { API_BASE } from "../api";

export default function Register() {
  const { register } = useAuth();
  const [phone, setPhone] = useState("");
  const [full_name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_BASE}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setAvatar(response.data.url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRegister = async () => {
    if (!phone || !full_name || !password) return;
    setLoading(true);
    setError("");
    try {
      await register(phone, full_name, password, avatar);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold text-primary">Create account</h2>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Avatar Picker */}
      <div className="flex justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarUploading || loading}
          className="relative group"
        >
          <div className={`w-20 h-20 rounded-full border-2 border-dashed border-secondary/50 flex items-center justify-center overflow-hidden bg-secondary/10 transition-all ${avatarUploading ? 'animate-pulse' : 'hover:border-secondary'}`}>
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : avatarUploading ? (
              <svg className="w-6 h-6 text-secondary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-xs shadow-md">
            +
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
          className="hidden"
        />
      </div>
      <p className="text-xs text-center text-primary/50">Add profile picture (optional)</p>

      <input
        className="w-full bg-white border border-background-dark rounded-lg px-3 py-2.5 text-sm sm:text-base outline-none focus:ring-2 focus:ring-secondary transition-shadow text-primary placeholder:text-primary/50"
        placeholder="Phone"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        disabled={loading}
      />
      <input
        className="w-full bg-white border border-background-dark rounded-lg px-3 py-2.5 text-sm sm:text-base outline-none focus:ring-2 focus:ring-secondary transition-shadow text-primary placeholder:text-primary/50"
        placeholder="Full name"
        value={full_name}
        onChange={e => setName(e.target.value)}
        disabled={loading}
      />
      <input
        className="w-full bg-white border border-background-dark rounded-lg px-3 py-2.5 text-sm sm:text-base outline-none focus:ring-2 focus:ring-secondary transition-shadow text-primary placeholder:text-primary/50"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        disabled={loading}
      />
      <button
        onClick={handleRegister}
        disabled={loading || avatarUploading || !phone || !full_name || !password}
        className="w-full bg-primary hover:bg-primary-light rounded-lg py-2.5 font-medium text-sm sm:text-base transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating account...
          </>
        ) : (
          "Register"
        )}
      </button>
    </div>
  );
}
