import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';

export default function MyBusinessDashboard({ onBack }) {
    const { user } = useAuth();
    const [business, setBusiness] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, productId: null });
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        currency: 'INR',
        category: '',
        inStock: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [businessRes, productsRes] = await Promise.all([
                axios.get(`${API_BASE}/business/my-business`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                }),
                axios.get(`${API_BASE}/business/products`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                })
            ]);

            setBusiness(businessRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('❌ Load error:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/business/products`, productForm, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setProductForm({ name: '', description: '', price: '', currency: 'INR', category: '', inStock: true });
            setShowAddProduct(false);
            loadData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add product');
        }
    };

    const handleDeleteProduct = (id) => {
        setConfirmDialog({ show: true, productId: id });
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_BASE}/business/products/${confirmDialog.productId}`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setConfirmDialog({ show: false, productId: null });
            loadData();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-primary/10 via-background to-background-dark grid place-items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-primary font-bold">Loading your business...</p>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-primary/10 via-background to-background-dark grid place-items-center p-6">
                <div className="text-center max-w-md">
                    <div className="text-8xl mb-6">🏢</div>
                    <h2 className="text-3xl font-black text-primary mb-4">No Business Found</h2>
                    <p className="text-gray-600 mb-6">You haven't registered a business yet. Register one to start showcasing your products!</p>
                    <button onClick={onBack} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-all shadow-lg">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const getStatusConfig = () => {
        const configs = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Pending Approval' },
            approved: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Rejected' }
        };
        return configs[business.status] || configs.pending;
    };

    const statusConfig = getStatusConfig();

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-primary/5 via-background to-gray-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-primary-light to-primary text-white shadow-2xl">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Go Back"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-4xl font-black mb-1">{business.businessName}</h1>
                                <p className="text-sm opacity-90">{business.category}</p>
                            </div>
                        </div>
                        <div className={`px-6 py-3 rounded-full font-bold ${statusConfig.bg} ${statusConfig.text} shadow-lg`}>
                            {statusConfig.icon} {statusConfig.label}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-8">
                        {['overview', 'products'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                disabled={tab === 'products' && business.status !== 'approved'}
                                className={`py-4 font-bold capitalize border-b-4 transition-all ${activeTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    } ${tab === 'products' && business.status !== 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {tab}
                                {tab === 'products' && ` (${products.length})`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {business.status === 'pending' && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">⏳</span>
                                        <div>
                                            <h3 className="font-bold text-yellow-900 mb-1">Awaiting Approval</h3>
                                            <p className="text-yellow-800">Your business registration is currently under review. You'll be able to manage products once approved by an admin.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {business.status === 'rejected' && business.rejectionReason && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-5 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">❌</span>
                                        <div>
                                            <h3 className="font-bold text-red-900 mb-1">Registration Rejected</h3>
                                            <p className="text-red-800"><strong>Reason:</strong> {business.rejectionReason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="text-2xl">ℹ️</span>
                                        Basic Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Business Name</label>
                                            <p className="text-lg font-semibold text-gray-900">{business.businessName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Category</label>
                                            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg font-semibold">
                                                {business.category}
                                            </span>
                                        </div>
                                        {business.description && (
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Description</label>
                                                <p className="text-gray-700 leading-relaxed">{business.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="text-2xl">📞</span>
                                        Contact Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Email</label>
                                            <p className="text-gray-900">{business.email || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Website</label>
                                            {business.website ? (
                                                <a href={business.website} target="_blank" rel="noopener noreferrer"
                                                    className="text-primary hover:underline font-medium">
                                                    {business.website}
                                                </a>
                                            ) : (
                                                <p className="text-gray-500">Not provided</p>
                                            )}
                                        </div>
                                        {business.address && (
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Address</label>
                                                <p className="text-gray-700">{business.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-gray-900">Product Catalog</h3>
                                <button
                                    onClick={() => setShowAddProduct(!showAddProduct)}
                                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-bold hover:shadow-lg transition-all"
                                >
                                    {showAddProduct ? '✕ Cancel' : '+ Add Product'}
                                </button>
                            </div>

                            {showAddProduct && (
                                <form onSubmit={handleAddProduct} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                    <h4 className="text-xl font-black text-gray-900 mb-6">New Product</h4>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Product Name *</label>
                                            <input
                                                type="text"
                                                value={productForm.name}
                                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-black"
                                                placeholder="Enter product name"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                            <textarea
                                                value={productForm.description}
                                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-black"
                                                placeholder="Describe your product"
                                                rows={4}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Price *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={productForm.price}
                                                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-black"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                                            <select
                                                value={productForm.currency}
                                                onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })}
                                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-black"
                                            >
                                                <option value="INR">INR (₹)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                            <input
                                                type="text"
                                                value={productForm.category}
                                                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-black"
                                                placeholder="e.g., Electronics"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={productForm.inStock}
                                                onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                                                className="w-5 h-5 text-primary rounded focus:ring-primary text-black"
                                                id="inStock"
                                            />
                                            <label htmlFor="inStock" className="font-bold text-gray-700 cursor-pointer">Product In Stock</label>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all text-lg"
                                    >
                                        Add Product
                                    </button>
                                </form>
                            )}

                            {products.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                                    <div className="text-8xl mb-6">📦</div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Yet</h3>
                                    <p className="text-gray-500">Start building your catalog by adding your first product!</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {products.map(product => (
                                        <div key={product._id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h4 className="font-black text-xl text-gray-900 mb-2">{product.name}</h4>
                                                    {product.category && (
                                                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-lg font-semibold mb-2">
                                                            {product.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`px-3 py-1 text-sm rounded-lg font-bold whitespace-nowrap ml-3 ${product.inStock
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {product.inStock ? '✓ In Stock' : 'Out of Stock'}
                                                </span>
                                            </div>
                                            {product.description && (
                                                <p className="text-gray-600 mb-4 leading-relaxed">{product.description}</p>
                                            )}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <p className="text-3xl font-black text-primary">
                                                    {product.currency === 'INR' ? '₹' : product.currency} {parseFloat(product.price).toFixed(2)}
                                                </p>
                                                <button
                                                    onClick={() => handleDeleteProduct(product._id)}
                                                    className="px-5 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmDialog.show && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
                            <h3 className="text-2xl font-black">Confirm Delete</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-6 text-lg">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDialog({ show: false, productId: null })}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
