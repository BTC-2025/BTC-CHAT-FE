import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export default function Register() {
  const { register } = useAuth();
  const [phone, setPhone] = useState("");
  const [full_name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!phone || !full_name || !password) return;
    setLoading(true);
    setError("");
    try {
      await register(phone, full_name, password);
      // On success, user state changes and app navigates away
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
        disabled={loading || !phone || !full_name || !password}
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

