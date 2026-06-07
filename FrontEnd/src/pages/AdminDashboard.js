import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  fetchAdminStats,
  fetchAllUsers,
  deleteUserAccount,
  fetchAllReports,
  resolveReportDispute
} from '../utils/api';
import {
  ShieldAlert,
  Users,
  Sprout,
  TrendingUp,
  Scale,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'reports'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchAdminStats();
      const usersRes = await fetchAllUsers();
      const reportsRes = await fetchAllReports();

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (usersRes.data?.success) setUsers(usersRes.data.users);
      if (reportsRes.data?.success) setReports(reportsRes.data.reports);
    } catch (err) {
      console.error('Failed to load admin records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: Deleting this user will recursively erase all their listed crops and associated orders. Proceed?')) return;
    try {
      const res = await deleteUserAccount(userId);
      if (res.data?.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete account: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      const res = await resolveReportDispute(reportId, status);
      if (res.data?.success) {
        alert(`Dispute Ticket updated to: ${status}`);
        loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update report: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col w-full text-left">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <Scale className="h-8 w-8 text-amber-500 mr-2" />
            Platform Admin Panel
          </h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Mediate transaction disputes, manage verified users, and check agritech metrics</p>
        </div>

        {/* Tab Links */}
        <div className="flex flex-wrap justify-center sm:justify-start bg-gray-100/80 p-1.5 rounded-2xl mb-8 gap-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-grow sm:flex-grow-0 justify-center py-2.5 px-4 sm:px-6 font-bold text-sm rounded-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-emerald-800 shadow' : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-50'}`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Platform Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-grow sm:flex-grow-0 justify-center py-2.5 px-4 sm:px-6 font-bold text-sm rounded-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-emerald-800 shadow' : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-50'}`}
          >
            <Users className="h-4 w-4" />
            <span>User Accounts Control ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-grow sm:flex-grow-0 justify-center py-2.5 px-4 sm:px-6 font-bold text-sm rounded-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${activeTab === 'reports' ? 'bg-white text-emerald-800 shadow' : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-50'}`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Disputes & Tickets ({reports.filter((r) => r.status === 'Pending').length} pending)</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-semibold">Updating secure statistics logs...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-emerald-100 p-4 rounded-xl text-emerald-700">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Users</p>
                      <h4 className="text-2xl font-black text-emerald-950">{stats.totalUsers} profiles</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-amber-100 p-4 rounded-xl text-amber-700">
                      <Sprout className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Crops</p>
                      <h4 className="text-2xl font-black text-emerald-950">{stats.totalCrops} listings</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-purple-100 p-4 rounded-xl text-purple-700">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Gross Sales GMV</p>
                      <h4 className="text-2xl font-black text-emerald-950">₹{stats.grossGMV.toLocaleString('en-IN')}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex items-center space-x-4">
                    <div className="bg-red-100 p-4 rounded-xl text-red-700">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Open Disputes</p>
                      <h4 className="text-2xl font-black text-emerald-950">{stats.pendingDisputes} cases</h4>
                    </div>
                  </div>
                </div>

                {/* Subtext info */}
                <div className="bg-emerald-950 text-white p-8 rounded-3xl relative overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 bg-amber-500 w-32 h-32 rounded-full filter blur-2xl opacity-20 -mr-10 -mt-10"></div>
                  <h3 className="text-xl font-bold mb-2">Administrative Sandbox Operational</h3>
                  <p className="text-sm text-emerald-100/90 leading-relaxed max-w-xl">
                    You have complete system credentials. Mediate accounts, audit harvested crops, and enforce platform regulations. Always contact both farmer and corporate entities before dismissing claims.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
                <div className="overflow-x-auto text-left">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-emerald-950 text-white border-b border-emerald-900 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4 pl-6 text-left">Username & Location</th>
                        <th className="p-4 text-left">Email Address</th>
                        <th className="p-4 text-center">Contact Mobile</th>
                        <th className="p-4 text-center">Assigned Role</th>
                        <th className="p-4 pr-6 text-center">Account Operations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-sm font-semibold">
                          <td className="p-4 pl-6">
                            <p className="text-emerald-950 font-bold">{user.name}</p>
                            <p className="text-xs text-gray-400 font-medium">{user.location}</p>
                          </td>
                          <td className="p-4 text-gray-600 font-semibold">{user.email}</td>
                          <td className="p-4 text-center text-gray-600 font-semibold">{user.phone}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block font-extrabold text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'farmer' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-center">
                            {user.role === 'admin' ? (
                              <span className="text-xs text-gray-400 font-bold italic">Immutable Account</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1 mx-auto"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Suspend & Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                {reports.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 text-left">
                    {reports.map((report) => (
                      <div key={report._id} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
                        {/* Header metadata */}
                        <div className="flex justify-between border-b border-gray-100 pb-3 text-xs font-bold text-gray-400">
                          <div>
                            TICKET ID: #{report._id.slice(-8).toUpperCase()}
                            <span className="mx-2">•</span>
                            STATUS: 
                            <span className={`ml-1 font-black ${
                              report.status === 'Pending' ? 'text-amber-600' :
                              report.status === 'Resolved' ? 'text-emerald-600' :
                              'text-gray-500'
                            }`}>{report.status}</span>
                          </div>
                          <div>
                            Logged: {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Dispute parties details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-emerald-950 font-bold uppercase tracking-wider mb-1 text-[10px] text-gray-400">Reporting Plaintiff</p>
                            <p className="text-emerald-900">{report.reportedBy?.name} ({report.reportedBy?.email})</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Role: {report.reportedBy?.role}</p>
                          </div>
                          <div>
                            <p className="text-emerald-950 font-bold uppercase tracking-wider mb-1 text-[10px] text-gray-400">Defending Party</p>
                            <p className="text-emerald-900">{report.targetUser?.name} ({report.targetUser?.email})</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Role: {report.targetUser?.role}</p>
                          </div>
                        </div>

                        {/* Dispute core description */}
                        <div className="space-y-1">
                          <p className="text-sm text-emerald-950 font-black flex items-center">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                            Reason: {report.reason}
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                            Statement: {report.description}
                          </p>
                          {report.order && (
                            <p className="text-[10px] font-bold text-gray-400 pt-1">
                              Associated Order Reference ID: #{report.order._id} (Crop Sourced: {report.order.crop?.name || 'Deleted Harvest'})
                            </p>
                          )}
                        </div>

                        {/* Dispute controls */}
                        {report.status === 'Pending' && (
                          <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                            <button
                              onClick={() => handleResolveReport(report._id, 'Resolved')}
                              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-lg cursor-pointer flex items-center space-x-1"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Resolve Dispute</span>
                            </button>
                            <button
                              onClick={() => handleResolveReport(report._id, 'Dismissed')}
                              className="px-4 py-1.5 border border-gray-250 text-gray-500 hover:bg-gray-50 font-extrabold text-xs rounded-lg cursor-pointer"
                            >
                              Dismiss Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 text-center rounded-3xl border border-gray-150 max-w-md mx-auto">
                    <p className="text-lg font-bold text-emerald-950">Dispute logs are clear</p>
                    <p className="text-sm text-gray-500">Zero active dispute escalations are active on KisanSetu.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default AdminDashboard;
