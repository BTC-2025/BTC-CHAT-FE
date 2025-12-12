import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export default function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold text-primary">Welcome back</h2>
      <input
        className="w-full bg-white border border-background-dark rounded-lg px-3 py-2.5 text-sm sm:text-base outline-none focus:ring-2 focus:ring-secondary transition-shadow text-primary placeholder:text-primary/50"
        placeholder="Phone"
        onChange={e => setPhone(e.target.value)}
      />
      <input
        className="w-full bg-white border border-background-dark rounded-lg px-3 py-2.5 text-sm sm:text-base outline-none focus:ring-2 focus:ring-secondary transition-shadow text-primary placeholder:text-primary/50"
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />
      <button
        onClick={() => login(phone, password)}
        className="w-full bg-primary hover:bg-primary-light rounded-lg py-2.5 font-medium text-sm sm:text-base transition-colors text-white"
      >
        Continue
      </button>
    </div>
  );
}
