import { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await axios.post(`${API_BASE}/admin/login`, {
                username,
                password
            });

            // Store admin token
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));

            // Redirect to dashboard
            window.history.pushState(null, '', '/admin/dashboard');
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (err) {
            console.error('Admin login error:', err);
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-primary">Admin Login</h1>
                    <p className="text-sm text-primary/60 mt-2">Business Management Dashboard</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 border border-background-dark rounded-xl focus:ring-2 focus:ring-primary outline-none text-black"
                            placeholder="Enter admin username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-background-dark rounded-xl focus:ring-2 focus:ring-primary outline-none text-black"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Back to App */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            window.history.pushState(null, '', '/');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                        className="text-sm text-primary/60 hover:text-primary underline"
                    >
                        ← Back to Chat App
                    </button>
                </div>
            </div>
        </div>
    );
}
