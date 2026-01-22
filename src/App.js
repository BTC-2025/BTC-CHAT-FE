import { useAuth } from "./context/AuthContext.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Home from "./pages/Home.js";
import DeleteAccount from "./pages/DeleteAccount.js"; // ✅ New Import
import PrivacyPolicy from "./pages/PrivacyPolicy.js"; // ✅ New Import
import DisabledAccount from "./components/DisabledAccount.js"; // ✅ New Import
import AdminLogin from "./pages/AdminLogin.js"; // ✅ Admin
import AdminDashboard from "./pages/AdminDashboard.js"; // ✅ Admin
import logo from "./assets/Blue-Chat.jpeg";
import { useState, useEffect } from "react";
import { requestNotificationPermission } from "./utils/notificationHelper";

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

  // ✅ Initialize Notifications on Login
  useEffect(() => {
    if (user && user.token) {
      requestNotificationPermission(user.token);
    }
  }, [user]);

  // ✅ 0. Check if account is disabled
  if (user?.isDisabled) {
    return <DisabledAccount />;
  }

  // ✅ 1. Check for dedicated routes

  if (path === "/delete-account") {
    return <DeleteAccount />;
  }

  if (path === "/privacy-policy") {
    return <PrivacyPolicy />;
  }

  // ✅ Admin routes (before auth check)
  if (path === "/admin") {
    return <AdminLogin />;
  }

  if (path === "/admin/dashboard") {
    return <AdminDashboard />;
  }

  // ✅ 2. Auth handling
  if (!user) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-4 sm:p-6">
        <div className="checking w-full max-w-md bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-background-dark">
          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src={logo}
              alt="BlueChat"
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-xl cursor-default"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-primary">BlueChat</h1>
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

          {/* Privacy Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                window.history.pushState(null, "", "/privacy-policy");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="text-primary/60 text-[11px] font-medium hover:text-primary transition-colors underline underline-offset-4"
            >
              View Privacy Policy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Home />;
}
