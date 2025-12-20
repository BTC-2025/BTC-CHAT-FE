import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import Login from "./Login";

export default function DeleteAccount() {
    const { user, logout } = useAuth();
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "CRITICAL: This will permanently wipe your profile, all messages, chats, and status updates. This action is irreversible. Are you absolutely sure?"
        );
        if (!confirmed) return;

        setDeleting(true);
        setError("");
        try {
            await axios.delete(`${API_BASE}/users/me`, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            setSuccess(true);
            setTimeout(() => {
                logout();
                window.location.href = "/";
            }, 3000);
        } catch (err) {
            console.error("Deletion failed:", err);
            setError("Failed to delete account. Please ensure you are logged in and try again.");
            setDeleting(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-background-dark">
                    <div className="text-center mb-8">
                        <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" />
                        <h1 className="text-2xl font-bold text-primary">Account Deletion</h1>
                        <p className="text-primary/60 mt-2">Please login to verify your identity before deleting your account.</p>
                    </div>
                    <Login />
                    <div className="mt-6 text-center">
                        <a href="/" className="text-secondary font-semibold hover:underline text-sm">Return to Chats</a>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 border border-green-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">Account Deleted</h1>
                    <p className="text-primary/60">Your data has been permanently removed. Redirecting you...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-background-dark flex flex-col md:flex-row">
                {/* Left Side - Warning Info */}
                <div className="bg-red-500 p-8 md:w-1/3 text-white flex flex-col justify-center text-center md:text-left">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Permanent Action</h2>
                    <p className="text-white/80 text-sm leading-relaxed">Deleting your account will wipe all your personal data from our servers.</p>
                </div>

                {/* Right Side - Content */}
                <div className="p-8 md:w-2/3 flex flex-col justify-center">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-primary">Delete your BTC Chat Account</h1>
                        <p className="text-primary/60 text-sm mt-2">Logged in as <span className="font-bold text-primary">{user.phone}</span></p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex gap-3 text-sm text-primary/70">
                            <span className="text-red-500 font-bold">•</span>
                            <span>Your profile, avatar, and contact info will be deleted.</span>
                        </div>
                        <div className="flex gap-3 text-sm text-primary/70">
                            <span className="text-red-500 font-bold">•</span>
                            <span>All personal 1:1 chat history and media will be erased.</span>
                        </div>
                        <div className="flex gap-3 text-sm text-primary/70">
                            <span className="text-red-500 font-bold">•</span>
                            <span>You will be removed from all group conversations.</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {deleting ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Deleting Account...
                                </>
                            ) : (
                                "Permanently Delete My Account"
                            )}
                        </button>
                        <a
                            href="/"
                            className="w-full py-3 text-center text-primary/60 hover:text-primary font-semibold text-sm transition-colors"
                        >
                            Cancel and Go Back
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
