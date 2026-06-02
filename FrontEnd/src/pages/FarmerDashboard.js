import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CropCard from '../components/CropCard';
import {
  fetchFarmerCrops,
  createCropListing,
  updateCropListing,
  deleteCropListing,
  fetchFarmerOrders,
  updateOrderStatus,
  uploadImage,
  getOrCreateConversation,
  getMe
} from '../utils/api';
import { 
  BarChart, 
  Package, 
  PlusCircle, 
  ClipboardList, 
  Sprout, 
  IndianRupee, 
  TrendingUp, 
  Upload, 
  Loader2,
  MessageCircle
} from 'lucide-react';
import ChatWidget from '../components/ChatWidget';

function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'listings' | 'add' | 'orders'
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Chat UI states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState(null);
  const [chatOrderId, setChatOrderId] = useState(null);

  // Form states for adding/editing crop
  const [editingCrop, setEditingCrop] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Grains');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const cropsRes = await fetchFarmerCrops();
      const ordersRes = await fetchFarmerOrders();
      if (cropsRes.data?.success) setCrops(cropsRes.data.crops);
      if (ordersRes.data?.success) setOrders(ordersRes.data.orders);
    } catch (err) {
      console.error('Failed to load farmer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await getMe();
        if (res.data?.success) setCurrentUser(res.data.user);
      } catch (err) {
        console.error('Failed to get current user:', err);
      }
    };
    fetchMe();
  }, []);

  const openChatWithBuyer = async (buyerId, orderId) => {
    try {
      await getOrCreateConversation({ partnerId: buyerId, orderId });
      setChatPartnerId(buyerId);
      setChatOrderId(orderId);
      setIsChatOpen(true);
    } catch (err) {
      console.error('Failed to open chat', err);
      alert('Could not start chat right now.');
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await uploadImage(formData);
      if (res.data?.success) {
        setImage(res.data.imagePath);
        setFormSuccess('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setFormError('Image upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Submit listing create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name || !quantity || !price || !location) {
      setFormError('Please fill in all required fields');
      return;
    }

    const payload = {
      name,
      category,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      location,
      description,
      image: image || undefined
    };

    try {
      if (editingCrop) {
        const res = await updateCropListing(editingCrop._id, payload);
        if (res.data?.success) {
          setFormSuccess('Crop listing updated successfully!');
          setEditingCrop(null);
          clearForm();
          loadData();
          setActiveTab('listings');
        }
      } else {
        const res = await createCropListing(payload);
        if (res.data?.success) {
          setFormSuccess('New crop listing created successfully!');
          clearForm();
          loadData();
          setActiveTab('listings');
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Action failed. Please try again.');
    }
  };

  const clearForm = () => {
    setName('');
    setCategory('Grains');
    setQuantity('');
    setPrice('');
    setLocation('');
    setDescription('');
    setImage('');
    setImageFile(null);
  };

  const handleEditInit = (crop) => {
    setEditingCrop(crop);
    setName(crop.name);
    setCategory(crop.category);
    setQuantity(crop.quantity);
    setPrice(crop.price);
    setLocation(crop.location);
    setDescription(crop.description || '');
    setImage(crop.image || '');
    setActiveTab('add');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await deleteCropListing(id);
      if (res.data?.success) {
        alert('Listing deleted successfully!');
        loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      const res = await updateOrderStatus(orderId, status);
      if (res.data?.success) {
        alert(`Order status updated to: ${status}`);
        loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Status update failed.');
    }
  };

  // Calculations for overview stats
  const revenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const completedOrders = orders.filter((o) => o.status === 'Delivered').length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col w-full text-left">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <Sprout className="h-8 w-8 text-amber-500 mr-2" />
            Farmer Business Portal
          </h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Manage inventories, view direct orders, and analyze crop sales</p>
        </div>

        {/* Dashboard Nav Tabs */}
        <div className="flex border-b border-gray-250 mb-8 overflow-x-auto gap-1">
          <button
            onClick={() => { setActiveTab('overview'); setEditingCrop(null); clearForm(); }}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'overview' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-400 hover:text-emerald-700'}`}
          >
            <BarChart className="h-4 w-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => { setActiveTab('listings'); setEditingCrop(null); clearForm(); }}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'listings' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-400 hover:text-emerald-700'}`}
          >
            <Package className="h-4 w-4" />
            <span>My Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'add' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-400 hover:text-emerald-700'}`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>{editingCrop ? 'Edit Crop' : 'List New Crop'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setEditingCrop(null); clearForm(); }}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'orders' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-400 hover:text-emerald-700'}`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Received Orders ({pendingOrders} pending)</span>
          </button>
          <button
            onClick={() => setIsChatOpen(true)}
            className="py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap border-transparent text-gray-400 hover:text-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Messages</span>
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-semibold">Updating server records...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-emerald-100 p-4 rounded-xl text-emerald-700">
                      <IndianRupee className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Gross Sales</p>
                      <h4 className="text-2xl font-black text-emerald-950">₹{revenue.toLocaleString('en-IN')}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-amber-100 p-4 rounded-xl text-amber-700">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Crops</p>
                      <h4 className="text-2xl font-black text-emerald-950">{crops.length} listed</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-xl text-blue-700">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Orders</p>
                      <h4 className="text-2xl font-black text-emerald-950">{orders.length} received</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-emerald-100 p-4 rounded-xl text-emerald-700">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Completed Payouts</p>
                      <h4 className="text-2xl font-black text-emerald-950">{completedOrders} parcels</h4>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Sales Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-left">
                  <h3 className="text-lg font-bold text-emerald-950 mb-6 flex items-center">
                    <BarChart className="h-5 w-5 mr-1.5 text-emerald-700" />
                    Sales Analytics by Harvest Listing
                  </h3>
                  
                  {crops.length > 0 ? (
                    <div className="space-y-4">
                      {crops.slice(0, 5).map((crop, idx) => {
                        // Calculate sales for this crop
                        const cropSales = orders
                          .filter((o) => o.crop?._id === crop._id && o.status !== 'Cancelled')
                          .reduce((sum, o) => sum + o.totalPrice, 0);

                        const maxSales = Math.max(
                          ...crops.map((c) =>
                            orders
                              .filter((o) => o.crop?._id === c._id && o.status !== 'Cancelled')
                              .reduce((sum, o) => sum + o.totalPrice, 0)
                          ),
                          1000 // default divisor
                        );

                        const percentage = (cropSales / maxSales) * 100;

                        return (
                          <div key={crop._id} className="space-y-1.5">
                            <div className="flex justify-between text-sm font-semibold">
                              <span className="text-emerald-950">{crop.name}</span>
                              <span className="text-emerald-700 font-black">₹{cropSales.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">List crops in the portal to display revenue bar graphs.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div>
                {crops.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {crops.map((crop) => (
                      <CropCard
                        key={crop._id}
                        crop={crop}
                        viewMode="farmer"
                        onEdit={handleEditInit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 text-center rounded-3xl border border-gray-150 max-w-md mx-auto">
                    <p className="text-lg font-bold text-emerald-950 mb-1">Your inventory is empty</p>
                    <p className="text-sm text-gray-500 mb-6">Create crop listings to publish them live to Pan-India buyers.</p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold px-6 py-2.5 rounded-xl cursor-pointer"
                    >
                      Add First Crop Listing
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'add' && (
              <div className="bg-white p-8 rounded-3xl border border-gray-150 shadow-sm max-w-2xl mx-auto">
                <h3 className="text-2xl font-black text-emerald-950 mb-1">
                  {editingCrop ? `Edit Listing: ${editingCrop.name}` : 'List New Crop Harvest'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">Enter specifications and upload real photos for buyers to review.</p>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl mb-5">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-3 rounded-xl mb-5">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Crop Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Basmati Rice (Pusa)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 border border-gray-250 rounded-xl bg-white outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Grains">Grains</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Pulses">Pulses</option>
                        <option value="Oilseeds">Oilseeds</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Available Stock (in kg) *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1000"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Price per kg (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 45"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Sourcing Location *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ludhiana, Punjab"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Harvest Description / Quality Notes</label>
                    <textarea
                      rows="3"
                      placeholder="Specify texture, aging duration, organic certifications..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500 resize-none"
                    ></textarea>
                  </div>

                  {/* Image Upload Area */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Harvest Photo</label>
                    <div className="border-2 border-dashed border-gray-250 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50/50 relative">
                      {uploading ? (
                        <div className="py-4 text-center">
                          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mx-auto mb-2" />
                          <p className="text-xs text-gray-400 font-bold">Uploading file asset...</p>
                        </div>
                      ) : image ? (
                        <div className="text-center space-y-2">
                          <img
                            src={image.startsWith('http') ? image : `http://localhost:550${image}`}
                            alt="Crop preview"
                            className="h-32 object-cover rounded-xl border border-gray-200 mx-auto"
                          />
                          <p className="text-xs text-emerald-700 font-bold">Image loaded successfully!</p>
                          <button
                            type="button"
                            onClick={() => setImage('')}
                            className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-xs text-gray-500 font-bold">PNG, JPG, JPEG, WEBP files up to 2MB</p>
                          <label className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all shadow-sm">
                            Choose File
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      className="flex-grow p-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-base rounded-xl transition-all shadow-md cursor-pointer flex justify-center items-center"
                    >
                      {editingCrop ? 'Save Update' : 'Publish Listing'}
                    </button>
                    {editingCrop && (
                      <button
                        type="button"
                        onClick={() => { setEditingCrop(null); clearForm(); setActiveTab('listings'); }}
                        className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-extrabold text-base rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
                {orders.length > 0 ? (
                  <div className="overflow-x-auto text-left">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-emerald-950 text-white border-b border-emerald-900 text-xs font-bold uppercase tracking-wider">
                          <th className="p-4 pl-6 text-left">Crop Listing</th>
                          <th className="p-4 text-left">Buyer Sourced</th>
                          <th className="p-4 text-center">Volume Ordered</th>
                          <th className="p-4 text-right">Invoice Sum</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 pr-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-sm font-semibold">
                            <td className="p-4 pl-6">
                              <p className="text-emerald-950 font-bold">{order.crop?.name || 'Deleted Harvest'}</p>
                              <p className="text-xs text-gray-400 font-medium">{order.crop?.category || 'General'}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-emerald-950 font-bold">{order.buyer?.name}</p>
                              <p className="text-xs text-gray-400 font-medium">Mob: {order.buyer?.phone}</p>
                              <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-[200px] truncate" title={order.shippingAddress}>
                                Addr: {order.shippingAddress}
                              </p>
                            </td>
                            <td className="p-4 text-center font-black text-emerald-900">{order.quantity} kg</td>
                            <td className="p-4 text-right font-black text-emerald-800">₹{order.totalPrice.toLocaleString('en-IN')}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-block font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider ${
                                order.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                order.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-center">
                              <div className="flex flex-col justify-center gap-1.5 items-center">
                                <button
                                  onClick={() => openChatWithBuyer(order.buyer._id, order._id)}
                                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 mb-1"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>Message Buyer</span>
                                </button>
                                <div className="flex justify-center gap-1.5">
                                  {order.status === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => handleOrderStatusUpdate(order._id, 'Approved')}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleOrderStatusUpdate(order._id, 'Cancelled')}
                                      className="border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {order.status === 'Approved' && (
                                  <button
                                    onClick={() => handleOrderStatusUpdate(order._id, 'Shipped')}
                                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Ship Shipment
                                  </button>
                                )}
                                {order.status === 'Shipped' && (
                                  <button
                                    onClick={() => handleOrderStatusUpdate(order._id, 'Delivered')}
                                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                                {['Delivered', 'Cancelled'].includes(order.status) && (
                                  <span className="text-xs text-gray-400 font-bold italic">No actions available</span>
                                )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-lg font-bold text-emerald-950 mb-1">No orders received yet</p>
                    <p className="text-sm text-gray-500">Harvest purchases will trigger automatic order reports here.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      <ChatWidget 
        isOpen={isChatOpen} 
        onClose={() => { setIsChatOpen(false); setChatPartnerId(null); setChatOrderId(null); }}
        initialPartnerId={chatPartnerId}
        initialOrderId={chatOrderId}
        currentUser={currentUser}
      />
    </div>
  );
}

export default FarmerDashboard;