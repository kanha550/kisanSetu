import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CropCard from '../components/CropCard';
import {
  fetchCrops,
  placeOrder,
  fetchBuyerOrders,
  updateOrderStatus,
  submitReportDispute,
  getOrCreateConversation,
  getMe
} from '../utils/api';
import { 
  ShoppingBag, 
  ShoppingCart, 
  History, 
  Search, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  Sparkles,
  Sparkles,
  Flag,
  Loader2,
  MessageCircle
} from 'lucide-react';
import ChatWidget from '../components/ChatWidget';

function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'cart' | 'history'
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Chat UI states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState(null);
  const [chatOrderId, setChatOrderId] = useState(null);

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  // Cart state (saved in localStorage)
  const [cart, setCart] = useState(() => {
    const local = localStorage.getItem('cart');
    return local ? JSON.parse(local) : [];
  });

  // Checkout form states
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Dispute Report form states
  const [disputeOrder, setDisputeOrder] = useState(null); // order object
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadCrops = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      if (locationFilter) params.location = locationFilter;

      const res = await fetchCrops(params);
      if (res.data?.success) {
        setCrops(res.data.crops);
      }
    } catch (err) {
      console.error('Failed to fetch crops:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetchBuyerOrders();
      if (res.data?.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load buyer orders:', err);
    }
  };

  useEffect(() => {
    loadCrops();
  }, [search, category, locationFilter]);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

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

  const openChatWithFarmer = async (farmerId, orderId) => {
    try {
      await getOrCreateConversation({ partnerId: farmerId, orderId });
      setChatPartnerId(farmerId);
      setChatOrderId(orderId);
      setIsChatOpen(true);
    } catch (err) {
      console.error('Failed to open chat', err);
      alert('Could not start chat right now.');
    }
  };

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Cart operations
  const handleAddToCart = (crop, qty) => {
    setCart((prevCart) => {
      const idx = prevCart.findIndex((item) => item.crop._id === crop._id);
      if (idx > -1) {
        const newCart = [...prevCart];
        newCart[idx].qty = Math.min(crop.quantity, newCart[idx].qty + qty);
        return newCart;
      }
      return [...prevCart, { crop, qty }];
    });
  };

  const handleUpdateCartQty = (cropId, quantity, maxLimit) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.crop._id === cropId
          ? { ...item, qty: Math.max(1, Math.min(maxLimit, parseInt(quantity) || 1)) }
          : item
      )
    );
  };

  const handleRemoveFromCart = (cropId) => {
    setCart((prevCart) => prevCart.filter((item) => item.crop._id !== cropId));
  };

  // Submit checkout orders
  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutSuccess('');

    if (!shippingAddress) {
      setCheckoutError('Please provide a complete delivery address.');
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    setSubmittingOrder(true);
    let successCount = 0;

    try {
      for (const item of cart) {
        await placeOrder({
          cropId: item.crop._id,
          quantity: item.qty,
          shippingAddress
        });
        successCount++;
      }

      if (successCount === cart.length) {
        setCheckoutSuccess('All orders placed successfully! Farmers will verify your orders.');
        setCart([]);
        setShippingAddress('');
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.response?.data?.message || 'Checkout failed for one or more crops.');
      loadCrops(); // Refresh catalog stock levels
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Cancel order (allowed if pending)
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await updateOrderStatus(orderId, 'Cancelled');
      if (res.data?.success) {
        alert('Order cancelled and inventory stock returned.');
        loadOrders();
      }
    } catch (err) {
      console.error(err);
      alert('Cancel failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // File Dispute/Report
  const handleFileDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason || !disputeDesc) return;
    
    setSubmittingDispute(true);
    try {
      const res = await submitReportDispute({
        targetUserId: disputeOrder.farmer._id,
        orderId: disputeOrder._id,
        reason: disputeReason,
        description: disputeDesc
      });

      if (res.data?.success) {
        setDisputeSuccess(true);
        setDisputeReason('');
        setDisputeDesc('');
        setTimeout(() => {
          setDisputeOrder(null);
          setDisputeSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to log dispute: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingDispute(false);
    }
  };

  const getOrderStatusStep = (status) => {
    if (status === 'Cancelled') return -1;
    if (status === 'Pending') return 0;
    if (status === 'Approved') return 1;
    if (status === 'Shipped') return 2;
    if (status === 'Delivered') return 3;
    return 0;
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.crop.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col w-full text-left">
      <Navbar cartCount={cartCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <ShoppingBag className="h-8 w-8 text-amber-500 mr-2" />
            Procurement Lead Marketplace
          </h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Source fresh staples directly from Punjabi and Gujarati farmers</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-250 mb-8 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'marketplace' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-400 hover:text-emerald-700'}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Marketplace Sourcing</span>
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'cart' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-400 hover:text-emerald-700'}`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Cart Items ({cartCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'history' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-400 hover:text-emerald-700'}`}
          >
            <History className="h-4 w-4" />
            <span>My Orders & Invoices</span>
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
        {activeTab === 'marketplace' && (
          <div className="space-y-8">
            {/* Sourcing Filters panel */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search crops by keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-gray-200 rounded-xl bg-gray-50/50 outline-none text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="relative flex-grow w-full">
                <MapPin className="absolute left-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by harvest location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-gray-200 rounded-xl bg-gray-50/50 outline-none text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full md:w-auto flex-shrink-0">
                {['All', 'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Oilseeds'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${category === cat ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800 mx-auto"></div>
                <p className="mt-4 text-gray-500 font-semibold">Updating crop inventories...</p>
              </div>
            ) : crops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {crops.map((crop) => (
                  <CropCard
                    key={crop._id}
                    crop={crop}
                    viewMode="buyer"
                    onAddToCart={handleAddToCart}
                    onChatWithFarmer={openChatWithFarmer}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-gray-150 max-w-md mx-auto">
                <p className="text-lg font-bold text-emerald-950 mb-1">No crops match criteria</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or search keywords.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left items-start">
            {/* Cart list */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 p-6 space-y-6 shadow-sm">
              <h3 className="text-xl font-bold text-emerald-950 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-1 text-emerald-700" />
                Shopping Bag Details
              </h3>

              {cart.length > 0 ? (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.crop._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 last:border-b-0 last:pb-0 gap-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.crop.image?.startsWith('http') ? item.crop.image : `http://localhost:550${item.crop.image}`}
                          alt={item.crop.name}
                          className="h-16 w-20 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-emerald-950 leading-tight">{item.crop.name}</h4>
                          <p className="text-xs text-gray-400 font-medium">{item.crop.category}</p>
                          <p className="text-xs text-emerald-700 font-extrabold mt-1">₹{item.crop.price} / kg</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center space-x-2 border border-gray-250 rounded-lg p-1 bg-gray-50">
                          <span className="text-xs text-gray-400 font-semibold px-1">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max={item.crop.quantity}
                            value={item.qty}
                            onChange={(e) => handleUpdateCartQty(item.crop._id, e.target.value, item.crop.quantity)}
                            className="w-12 text-center text-xs font-bold bg-transparent outline-none"
                          />
                          <span className="text-[10px] text-gray-400">kg</span>
                        </div>

                        <div className="text-right flex items-center space-x-4">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Subtotal</p>
                            <p className="font-black text-emerald-800 text-base">₹{(item.crop.price * item.qty).toLocaleString('en-IN')}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.crop._id)}
                            className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="font-bold text-gray-400">Your bag is empty.</p>
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="text-emerald-700 hover:text-emerald-600 text-xs font-bold mt-2 underline"
                  >
                    Go back to Marketplace
                  </button>
                </div>
              )}
            </div>

            {/* Checkout Invoice Form */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-emerald-950">Purchase Checkout</h3>

              {checkoutError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl">
                  {checkoutError}
                </div>
              )}
              {checkoutSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-3 rounded-xl">
                  {checkoutSuccess}
                </div>
              )}

              <div className="border-t border-b border-gray-100 py-4 space-y-2.5 text-sm font-semibold">
                <div className="flex justify-between text-gray-500">
                  <span>Gross Sourced Volume</span>
                  <span>{cartCount} kg</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Logistics Transport</span>
                  <span className="text-emerald-600">Simulated FREE</span>
                </div>
                <div className="flex justify-between text-emerald-950 font-black text-base pt-2 border-t border-gray-100">
                  <span>Invoice Total</span>
                  <span className="text-emerald-800">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Delivery Shipping Address *</label>
                  <textarea
                    rows="3"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter complete company storage dock / destination address..."
                    className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-xs font-semibold focus:ring-2 focus:ring-emerald-500 resize-none"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Payment Protocol</label>
                  <input
                    type="text"
                    value="Cash on Delivery (Post-Inspection Verification)"
                    disabled
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 outline-none text-xs font-bold text-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder || cart.length === 0}
                  className="w-full p-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-base rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center cursor-pointer"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Transacting Orders...</span>
                    </>
                  ) : (
                    <span>Submit Orders</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Escalated Disputes form overlay if active */}
            {disputeOrder && (
              <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
                <div className="bg-white p-8 rounded-3xl max-w-md w-full relative border border-gray-200 shadow-2xl">
                  <h3 className="text-xl font-bold text-emerald-950 mb-1 flex items-center">
                    <Flag className="h-5 w-5 text-red-500 mr-2" />
                    Escalate Dispute Ticket
                  </h3>
                  <p className="text-xs text-gray-400 font-semibold mb-6">
                    Filing mediation against order #{disputeOrder._id.slice(-6)} (Farmer: {disputeOrder.farmer?.name})
                  </p>

                  {disputeSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold p-4 rounded-xl text-center">
                      Dispute ticket recorded! Platform Admin will mediate.
                    </div>
                  ) : (
                    <form onSubmit={handleFileDispute} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Dispute Category / Reason *</label>
                        <input
                          type="text"
                          placeholder="e.g., Damaged crop parcel, incorrect weight..."
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Problem Description *</label>
                        <textarea
                          rows="4"
                          placeholder="Describe the discrepancy in detail..."
                          value={disputeDesc}
                          onChange={(e) => setDisputeDesc(e.target.value)}
                          className="w-full p-3 border border-gray-250 rounded-xl bg-gray-50/50 outline-none text-xs font-semibold focus:ring-2 focus:ring-emerald-500 resize-none"
                          required
                        ></textarea>
                      </div>

                      <div className="flex space-x-3 pt-4 border-t border-gray-100">
                        <button
                          type="submit"
                          disabled={submittingDispute}
                          className="flex-grow p-3 bg-red-600 hover:bg-red-505 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow flex justify-center items-center"
                        >
                          {submittingDispute ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Dispute'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDisputeOrder(null)}
                          className="px-4 py-3 border border-gray-200 text-gray-500 font-extrabold text-xs rounded-xl cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* List Orders */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-emerald-950 flex items-center">
                <History className="h-5 w-5 mr-1 text-emerald-700" />
                Procurement Orders Log
              </h3>

              {orders.length > 0 ? (
                <div className="space-y-8">
                  {orders.map((order) => {
                    const activeStep = getOrderStatusStep(order.status);

                    return (
                      <div key={order._id} className="border border-gray-100 rounded-2xl p-5 hover:border-emerald-100 transition-colors text-left space-y-5 shadow-sm bg-gray-50/30">
                        {/* Header Details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100 font-semibold text-xs text-gray-400">
                          <div>
                            <span className="text-emerald-950 font-black">Order ID:</span> #{order._id.slice(-8).toUpperCase()}
                            <span className="mx-2">•</span>
                            <span className="text-emerald-950 font-black">Farmer:</span> {order.farmer?.name} ({order.farmer?.phone})
                          </div>
                          <div>
                            <span className="text-emerald-950 font-black">Placement Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Middle Crop Details */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={order.crop?.image?.startsWith('http') ? order.crop?.image : `http://localhost:550${order.crop?.image}`}
                              alt={order.crop?.name}
                              className="h-14 w-16 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                            />
                            <div>
                              <h4 className="font-extrabold text-base text-emerald-950 leading-tight">{order.crop?.name || 'Deleted Harvest'}</h4>
                              <p className="text-xs text-gray-400 font-bold mt-0.5">{order.crop?.category}</p>
                              <p className="text-xs text-emerald-950 font-bold mt-1">Volume Sourced: <span className="font-black text-emerald-800">{order.quantity}kg</span></p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Transaction Net</p>
                            <p className="font-black text-emerald-800 text-lg">₹{order.totalPrice.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Progress Stepper Visual Bar */}
                        {activeStep >= 0 ? (
                          <div className="pt-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                              <span className={activeStep >= 0 ? 'text-amber-600 font-extrabold' : ''}>Placed</span>
                              <span className={activeStep >= 1 ? 'text-blue-600 font-extrabold' : ''}>Approved</span>
                              <span className={activeStep >= 2 ? 'text-purple-600 font-extrabold' : ''}>Shipped</span>
                              <span className={activeStep >= 3 ? 'text-emerald-600 font-extrabold' : ''}>Delivered</span>
                            </div>
                            
                            {/* Visual Progress Line */}
                            <div className="relative flex items-center justify-between">
                              <div className="absolute left-0 right-0 h-1 bg-gray-200 z-0"></div>
                              <div
                                className={`absolute left-0 h-1 z-0 transition-all duration-700 ${
                                  activeStep === 0 ? 'bg-amber-400 w-0' :
                                  activeStep === 1 ? 'bg-blue-400 w-1/3' :
                                  activeStep === 2 ? 'bg-purple-500 w-2/3' :
                                  'bg-emerald-600 w-full'
                                }`}
                              ></div>
                              
                              {/* Step Dots */}
                              {[0, 1, 2, 3].map((step) => (
                                <div
                                  key={step}
                                  className={`h-4 w-4 rounded-full border-2 z-10 flex items-center justify-center transition-all ${
                                    activeStep >= step
                                      ? step === 0 ? 'bg-amber-500 border-amber-600' :
                                        step === 1 ? 'bg-blue-500 border-blue-600' :
                                        step === 2 ? 'bg-purple-500 border-purple-600' :
                                        'bg-emerald-600 border-emerald-700'
                                      : 'bg-white border-gray-300'
                                  }`}
                                ></div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 text-red-700 text-xs font-extrabold p-3 rounded-xl flex items-center space-x-1.5">
                            <AlertCircle className="h-4 w-4" />
                            <span>This order has been CANCELLED and resolved in database.</span>
                          </div>
                        )}

                        {/* Footer Dispute / Cancel Buttons */}
                        <div className="flex justify-end items-center space-x-2 pt-2">
                          <button
                            onClick={() => openChatWithFarmer(order.farmer._id, order._id)}
                            className="text-xs font-bold text-emerald-700 hover:text-white px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-600 transition-colors cursor-pointer flex items-center space-x-1 mr-auto"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Chat with Farmer</span>
                          </button>
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="text-xs font-bold text-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-600 transition-colors cursor-pointer"
                            >
                              Cancel Order
                            </button>
                          )}
                          {order.status === 'Delivered' && (
                            <button
                              onClick={() => setDisputeOrder(order)}
                              className="text-xs font-bold text-red-600 hover:text-white px-3.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-600 transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <Flag className="h-3.5 w-3.5" />
                              <span>Escalate Dispute</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="font-bold text-gray-400">You haven't placed any harvest procurement orders yet.</p>
                </div>
              )}
            </div>
          </div>
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

export default BuyerDashboard;