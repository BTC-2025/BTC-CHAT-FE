import { useAuth } from "./context/AuthContext.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Home from "./pages/Home.js";
import DeleteAccount from "./pages/DeleteAccount.js"; // ✅ New Import
import { useState, useEffect } from "react";
import logo from "./assets/logo.png";

export default function App() {
  const { user } = useAuth();
  const [mode, setMode] = useState("login");
  const [path, setPath] = useState(window.location.pathname);

  // Monitor path changes (for simple routing without react-router)
  useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // ✅ 1. Check for dedicated Delete Account route
  if (path === "/delete-account") {
    return <DeleteAccount />;
  }

  // ✅ 2. Auth handling
  if (!user) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-background-dark">
          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src={logo}
              alt="BTC Chat"
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-xl"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-primary">BTC Chat</h1>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${mode === 'login' ? 'bg-primary text-white' : 'bg-background text-primary hover:bg-background-dark'
                }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${mode === 'register' ? 'bg-primary text-white' : 'bg-background text-primary hover:bg-background-dark'
                }`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {mode === "login" ? <Login /> : <Register />}
        </div>
      </div>
    );
  }

  return <Home />;
}
