import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';

export default function AdminDashboard() {
    const [businesses, setBusinesses] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [adminUser, setAdminUser] = useState(null);

    const loadBusinesses = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get(`${API_BASE}/admin/business/all?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBusinesses(data);
        } catch (error) {
            console.error('Load businesses error:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        // Check if admin is logged in
        const token = localStorage.getItem('adminToken');
        const admin = localStorage.getItem('adminUser');

        if (!token || !admin) {
            window.history.pushState(null, '', '/admin');
            window.dispatchEvent(new PopStateEvent('popstate'));
            return;
        }

        setAdminUser(JSON.parse(admin));
        loadBusinesses();
    }, [loadBusinesses]);

    const handleApprove = async (businessId) => {
        if (!window.confirm('Approve this business?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`${API_BASE}/admin/business/${businessId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Business approved successfully!');
            loadBusinesses();
        } catch (error) {
            console.error('Approve error:', error);
            alert(error.response?.data?.message || 'Failed to approve business');
        }
    };

    const handleReject = async (businessId) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`${API_BASE}/admin/business/${businessId}/reject`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Business rejected');
            loadBusinesses();
        } catch (error) {
            console.error('Reject error:', error);
            alert(error.response?.data?.message || 'Failed to reject business');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.history.pushState(null, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            approved: 'bg-green-100 text-green-700 border-green-300',
            rejected: 'bg-red-100 text-red-700 border-red-300'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-white border-b border-background-dark sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-primary">Business Admin Dashboard</h1>
                            <p className="text-xs text-primary/60">Welcome, {adminUser?.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['pending', 'approved', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${filter === tab
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white text-primary hover:bg-background-dark'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Business List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading businesses...</p>
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                        <svg className="w-16 h-16 mx-auto text-primary/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-600">No {filter} businesses found</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {businesses.map(business => (
                            <div key={business._id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-black text-black">{business.businessName}</h3>
                                                {getStatusBadge(business.status)}
                                            </div>
                                            <p className="text-sm text-gray-600">{business.category}</p>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Owner</p>
                                            <p className="text-sm font-bold text-black">{business.userId?.full_name || 'N/A'}</p>
                                            <p className="text-xs text-gray-600">{business.userId?.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact</p>
                                            <p className="text-sm text-black">{business.email || 'No email'}</p>
                                            <p className="text-xs text-gray-600">{business.website || 'No website'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address</p>
                                            <p className="text-sm text-black">{business.address || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Submitted</p>
                                            <p className="text-sm text-black">{new Date(business.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {business.description && (
                                        <div className="mb-4 p-3 bg-background rounded-xl">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-sm text-black">{business.description}</p>
                                        </div>
                                    )}

                                    {/* Rejection Reason */}
                                    {business.status === 'rejected' && business.rejectionReason && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                                            <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</p>
                                            <p className="text-sm text-red-600">{business.rejectionReason}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {business.status === 'pending' && (
                                        <div className="flex gap-3 pt-4 border-t border-background-dark">
                                            <button
                                                onClick={() => handleApprove(business._id)}
                                                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(business._id)}
                                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                                            >
                                                × Reject
                                            </button>
                                        </div>
                                    )}

                                    {business.status === 'approved' && business.approvedBy && (
                                        <div className="pt-4 border-t border-background-dark text-xs text-gray-600">
                                            Approved by {business.approvedBy.username} on {new Date(business.approvedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
