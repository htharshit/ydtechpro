
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Users, Activity, TrendingUp, CheckCircle2, 
  XCircle, Search, RefreshCw, Terminal, Gavel, Eye,
  IndianRupee, Edit2, Save, ToggleLeft, ToggleRight, Clock,
  UserCheck, Check, Plus, Database, Cloud, Wifi, WifiOff,
  UserPlus, UserMinus, UserX, ShieldAlert, User as UserIcon, Building, 
  MapPin, Lock, Unlock, Mail, Phone, ChevronRight, Package, FileText,
  Trash2, AlertCircle, Settings, HardDrive, Cpu, ActivitySquare, X
} from 'lucide-react';
import { User, Lead, Payment, LeadStatus, ExemptionScope, UserRole, Product, Permission } from '../types';
import { storageService } from '../services/storageService';

import { io } from 'socket.io-client';

interface Props {
  currentUser: User;
}

const AdminView: React.FC<Props> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'analytics' | 'leads' | 'inventory' | 'verification' | 'system' | 'audit'>('analytics');
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [healthData, setHealthData] = useState<any>(null);
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentForm, setContentForm] = useState({
    type: 'LEAD' as 'LEAD' | 'PRODUCT' | 'SERVICE',
    targetUserId: '',
    title: '',
    price: 0,
    category: 'General',
    description: ''
  });
  const [liveLogins, setLiveLogins] = useState<any[]>([]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const socket = io();
    socket.on('live_login', (data) => {
      setLiveLogins(prev => [data, ...prev].slice(0, 5));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateContent = async () => {
    setLoading(true);
    try {
      if (contentForm.type === 'LEAD') {
        await storageService.createLead({
          id: `LEAD-${Date.now()}`,
          buyerId: contentForm.targetUserId,
          buyerName: users.find(u => u.id === contentForm.targetUserId)?.name || 'Admin Assigned',
          requirementName: contentForm.title,
          description: contentForm.description,
          budget: contentForm.price,
          category: contentForm.category,
          leadImage: '',
          quantity: 1,
          gstRequired: false,
          negotiationAllowed: true,
          status: LeadStatus.OPEN,
          createdAt: new Date().toISOString()
        });
      } else if (contentForm.type === 'PRODUCT') {
        await storageService.createProduct({
          id: `PROD-${Date.now()}`,
          name: contentForm.title,
          companyName: users.find(u => u.id === contentForm.targetUserId)?.companyName || 'Admin Store',
          brand: 'Generic',
          modelNumber: 'ADMIN-GEN',
          price: contentForm.price,
          category: contentForm.category,
          gstPercent: 18,
          stock: 100,
          specifications: contentForm.description,
          description: contentForm.description,
          availabilityType: 'INSTANT' as any,
          availabilityDays: 0,
          vendorId: contentForm.targetUserId,
          vendorName: users.find(u => u.id === contentForm.targetUserId)?.name || 'Admin',
          productImage: ''
        });
      }
      setShowContentModal(false);
      await refreshData();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setLoading(true);
    const res = await storageService.adminUpdateUser(currentUser.id, updatedUser.id, updatedUser);
    if (res.status === 'success' || res.success) {
      setEditingUser(null);
      await refreshData();
    }
    setLoading(false);
  };

  useEffect(() => { 
    refreshData();
    const interval = setInterval(checkSync, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkSync = async () => {
    try {
      const res = await fetch('/api/v1/system/health');
      const data = await res.json();
      setHealthData(data);
      setSyncStatus(res.ok ? 'online' : 'offline');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setSyncStatus('syncing');
    try {
      const [u, p, l, i] = await Promise.all([
        storageService.getUsers(),
        storageService.getGovernancePayments(),
        storageService.getLeads(),
        storageService.getProducts()
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setPayments(Array.isArray(p) ? p : []);
      setLeads(Array.isArray(l) ? l : []);
      setInventory(Array.isArray(i) ? i : []);
      await checkSync();
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Registry Sync Failure", e);
      setSyncStatus('offline');
    }
    setLoading(false);
  };

  const handleUserAction = async (user: User, action: 'approve' | 'reject') => {
    setLoading(true);
    const updates: Partial<User> = action === 'approve' 
      ? { isApproved: true, status: 'active' } 
      : { isApproved: false, status: 'rejected' };
    
    const res = await storageService.adminUpdateUser(currentUser.id, user.id, { ...user, ...updates });
    if (res.status === 'success' || res.success) {
      setShowUserModal(false);
      await refreshData();
    }
    setLoading(false);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("Are you sure you want to terminate this broadcast?")) {
      setLoading(true);
      try {
        await storageService.deleteLead(id);
        await refreshData();
      } catch (e) {
        alert("Termination failed.");
      }
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this asset from the global registry?")) {
      setLoading(true);
      try {
        await storageService.deleteProduct(id);
        await refreshData();
      } catch (e) {
        alert("Asset removal failed.");
      }
      setLoading(false);
    }
  };

  const handleLockToggle = async (user: User) => {
    setLoading(true);
    const res = await storageService.adminUpdateUser(currentUser.id, user.id, { isLocked: !user.isLocked });
    if (res.status === 'success' || res.success) {
      await refreshData();
    }
    setLoading(false);
  };

  const stats = {
    totalRevenue: (payments || []).filter(p => p.verification_status === 'verified').reduce((sum, p) => sum + Number(p.amount), 0),
    pendingIdentityQueue: (users || []).filter(u => !u.isApproved && u.status === 'pending').length,
    activeMarketLeads: (leads || []).filter(l => l.status === LeadStatus.OPEN).length,
    dbStatus: syncStatus === 'online' ? 'Connected' : 'Interrupted'
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Command <span className="text-indigo-600">Dashboard</span></h2>
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Enterprise Governance & Protocol Node Management</p>
        </div>
        
        <div className="flex items-center gap-6">
           <button onClick={() => setShowContentModal(true)} className="px-8 py-4.5 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest">
              <Plus size={20}/> Add Content
           </button>
           <div className="flex items-center gap-4 bg-white p-3 pr-8 rounded-[1.5rem] border border-slate-100 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                 syncStatus === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
              }`}>
                 {syncStatus === 'online' ? <Wifi size={24}/> : <WifiOff size={24}/>}
              </div>
              <div>
                 <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Node Integrity</p>
                 <span className={`text-[11px] font-black uppercase tracking-widest ${syncStatus === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {syncStatus === 'online' ? 'Registry Link Active' : 'Registry Sync Error'}
                 </span>
              </div>
           </div>
           <button onClick={refreshData} disabled={loading} className="p-4.5 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
              <RefreshCw size={24} className={loading ? 'animate-spin' : ''}/>
           </button>
        </div>
      </div>

      {/* Governance Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {[
           { label: 'Platform Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <IndianRupee size={28}/>, color: 'bg-emerald-50 text-emerald-600' },
           { label: 'Identity Queue', value: stats.pendingIdentityQueue, icon: <ShieldAlert size={28}/>, color: 'bg-rose-50 text-rose-600' },
           { label: 'Active Broadcasts', value: stats.activeMarketLeads, icon: <ActivitySquare size={28}/>, color: 'bg-indigo-50 text-indigo-600' },
           { label: 'Registry Node', value: stats.dbStatus, icon: <Database size={28}/>, color: 'bg-slate-50 text-slate-600' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-2xl transition-all">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                 <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
              </div>
              <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${stat.color}`}>
                 {stat.icon}
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[700px]">
         <div className="bg-slate-900 px-12 py-8 flex items-center gap-4">
            {[
              { id: 'analytics', label: 'Pulse', icon: <Activity size={16}/> },
              { id: 'users', label: 'Identity Registry', icon: <Users size={16}/> },
              { id: 'verification', label: 'Verification Queue', icon: <ShieldCheck size={16}/> },
              { id: 'leads', label: 'Procurement Control', icon: <FileText size={16}/> },
              { id: 'inventory', label: 'Inventory Auditor', icon: <Package size={16}/> },
              { id: 'audit', label: 'Audit Logs', icon: <FileText size={16}/> },
              { id: 'system', label: 'Hardware Diagnostics', icon: <Cpu size={16}/> },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-400 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
         </div>

         <div className="p-16">
            {activeTab === 'verification' && (
              <div className="space-y-10 animate-in slide-in-from-right duration-500">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Identity Verification Queue</h3>
                    <div className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                       {users.filter(u => !u.isApproved && u.status === 'pending').length} Pending Audits
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-6">
                    {users.filter(u => !u.isApproved).map(user => (
                       <div key={user.id} onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-indigo-200 transition-all cursor-pointer">
                          <div className="flex items-center gap-8">
                             <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border overflow-hidden shadow-inner">
                                {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={40}/>}
                             </div>
                             <div>
                                <h4 className="text-2xl font-black text-slate-900">{user.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{user.email} • {user.roles.join(', ')}</p>
                                <div className="flex items-center gap-3 mt-4">
                                   <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">{user.companyName || 'Individual'}</span>
                                   <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100">{user.city || 'No Location'}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-4">
                             <button onClick={(e) => { e.stopPropagation(); handleUserAction(user, 'reject'); }} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Reject Identity</button>
                             <button onClick={(e) => { e.stopPropagation(); handleUserAction(user, 'approve'); }} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2">
                                <CheckCircle2 size={16}/> Approve Protocol
                             </button>
                          </div>
                       </div>
                    ))}
                    {users.filter(u => !u.isApproved).length === 0 && (
                       <div className="py-32 text-center opacity-20">
                          <ShieldCheck size={80} className="mx-auto mb-6" />
                          <p className="text-sm font-black uppercase tracking-widest">Verification Registry is Clear</p>
                       </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="space-y-10 animate-in slide-in-from-right duration-500">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Marketplace Lead Registry</h3>
                    <span className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{leads.length} Active Broadcasts</span>
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    {leads.map(lead => (
                       <div key={lead.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-8">
                             <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] border flex items-center justify-center text-slate-300">
                                <FileText size={32}/>
                             </div>
                             <div>
                                <h4 className="text-xl font-black text-slate-900">{lead.requirementName}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Buyer: {lead.buyerName} • ID: {lead.id}</p>
                                <div className="flex items-center gap-2 mt-3">
                                   <span className="px-3 py-1 bg-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-600">{lead.status}</span>
                                   <span className="text-[10px] font-black text-slate-900 ml-2">₹{lead.budget?.toLocaleString()}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <button onClick={() => handleDeleteLead(lead.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-600 transition-all"><Trash2 size={20}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-10 animate-in slide-in-from-right duration-500">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Global Inventory Auditor</h3>
                    <span className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{inventory.length} Assets Registered</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {inventory.map(item => (
                       <div key={item.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm group hover:shadow-xl transition-all">
                          <div className="aspect-video bg-slate-50 rounded-[2rem] mb-6 overflow-hidden border">
                             <img src={item.productImage || 'https://picsum.photos/400/300'} className="w-full h-full object-cover" />
                          </div>
                          <h4 className="text-lg font-black text-slate-900 truncate">{item.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.vendorName} • {item.companyName}</p>
                          <div className="mt-6 pt-6 border-t flex items-center justify-between">
                             <span className="text-xl font-black text-slate-900">₹{item.price.toLocaleString()}</span>
                             <button onClick={() => handleDeleteProduct(item.id)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 transition-all"><Trash2 size={16}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-12 animate-in fade-in">
                 <div className="flex items-center gap-6 p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100">
                    <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl"><Activity size={32}/></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Platform Health Narrative</h3>
                       <p className="text-[11px] font-medium text-indigo-900 uppercase tracking-widest mt-1 opacity-60">System running at 99.8% Efficiency • Last incident: None</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden group">
                       <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform"><Terminal size={240}/></div>
                       <div className="relative z-10 space-y-8">
                          <h4 className="text-xl font-black uppercase tracking-widest flex items-center gap-4"><Settings size={20} className="text-indigo-400"/> Operational Log</h4>
                          <div className="space-y-4 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                             <div className="flex items-center gap-3"><span className="text-emerald-500">[OK]</span> Registry Auth Handshake Verified</div>
                             <div className="flex items-center gap-3"><span className="text-emerald-500">[OK]</span> ST_Distance_Sphere Index Optimized</div>
                             <div className="flex items-center gap-3"><span className="text-amber-500">[WARN]</span> Storage Node Approaching 60% Capacity</div>
                             <div className="flex items-center gap-3"><span className="text-emerald-500">[OK]</span> Razorpay Webhook Signatures Match</div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-12 bg-white rounded-[3.5rem] border border-slate-100 space-y-8 shadow-sm">
                       <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-4"><ActivitySquare size={20} className="text-rose-500"/> Live Activity Feed</h4>
                       <div className="space-y-4">
                          {liveLogins.length > 0 ? liveLogins.map((login, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-right">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <UserIcon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-900 truncate">{login.userName}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authenticated via {login.type}</p>
                              </div>
                              <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">{new Date(login.timestamp).toLocaleTimeString()}</span>
                            </div>
                          )) : (
                            <div className="text-center py-8 text-slate-400">
                              <ActivitySquare size={32} className="mx-auto mb-3 opacity-20" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Waiting for live events...</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-12 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><HardDrive size={24}/></div>
                      <h4 className="text-lg font-black uppercase tracking-tight">Database Management</h4>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Perform critical database operations. Warning: Resetting the database will permanently delete all records and re-seed initial data.
                    </p>
                    <button 
                      onClick={async () => {
                        if (window.confirm('CRITICAL WARNING: This will DELETE ALL DATA and recreate the database schema. Are you absolutely sure?')) {
                          setLoading(true);
                          try {
                            const res = await storageService.resetDatabase();
                            if (res.status === 'success') {
                              alert(res.message);
                              window.location.reload();
                            } else {
                              alert('Reset failed: ' + (res.error || res.message));
                            }
                          } catch (e) {
                            alert('Communication failure during reset.');
                          }
                          setLoading(false);
                        }
                      }}
                      className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                    >
                      <Trash2 size={18}/> Recreate & Seed Database
                    </button>
                  </div>

                  <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Activity size={24}/></div>
                      <h4 className="text-lg font-black uppercase tracking-tight">System Health</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MySQL Status</span>
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">Operational</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Socket.io Node</span>
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uptime</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">99.99%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Governance Audit Trail</h3>
                  <button className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Export CSV</button>
                </div>
                <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">User</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Action</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Details</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(auditLogs.length > 0 ? auditLogs : [
                        { timestamp: new Date().toISOString(), userName: 'System', action: 'BOOT', details: 'Governance Node Initialized', ipAddress: '127.0.0.1' },
                        { timestamp: new Date().toISOString(), userName: 'Admin', action: 'LOGIN', details: 'Admin Session Started', ipAddress: '192.168.1.1' }
                      ]).map((log, i) => (
                        <tr key={i} className="hover:bg-white transition-colors">
                          <td className="p-6 text-[10px] font-bold text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-6 text-[10px] font-black text-slate-900">{log.userName}</td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase">{log.action}</span>
                          </td>
                          <td className="p-6 text-[10px] font-medium text-slate-600">{log.details}</td>
                          <td className="p-6 text-[10px] font-mono text-slate-400">{log.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-10 animate-in slide-in-from-right duration-500">
                 <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="text" placeholder="Filter Registry by Name, Identity Email, Company GST..." className="pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-sm font-bold w-full outline-none focus:border-indigo-600 transition-all shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>

                 <div className="grid grid-cols-1 gap-6">
                    {users.map(user => (
                       <div key={user.id} className={`p-8 bg-slate-50 border border-slate-100 rounded-[3rem] flex items-center justify-between group transition-all hover:border-indigo-200 ${user.isLocked ? 'grayscale opacity-70 border-rose-200' : 'shadow-sm'}`}>
                          <div className="flex items-center gap-8">
                             <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-slate-400 border overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={32}/>}
                             </div>
                             <div>
                                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                   {user.name} 
                                   {user.isLocked && <Lock size={16} className="text-rose-600 animate-pulse"/>}
                                   {user.isApproved && <ShieldCheck size={16} className="text-emerald-500"/>}
                                </h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{user.email} • {user.roles.join(', ')}</p>
                                <div className="flex items-center gap-2 mt-3">
                                   <span className="px-3 py-1 bg-white border rounded-lg text-[8px] font-black uppercase text-indigo-600">{user.city || 'No Geodata'}</span>
                                   <span className="px-3 py-1 bg-white border rounded-lg text-[8px] font-black uppercase text-slate-400">{user.companyName || 'Individual Identity'}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <button onClick={() => handleLockToggle(user)} className={`p-4 rounded-2xl transition-all shadow-sm ${user.isLocked ? 'bg-rose-600 text-white' : 'bg-white text-slate-400 hover:text-rose-600 border'}`}>
                                {user.isLocked ? <Unlock size={22}/> : <Lock size={22}/>}
                             </button>
                             <button onClick={() => setEditingUser(user)} className="p-4 bg-white text-slate-400 hover:text-indigo-600 rounded-2xl border transition-all shadow-sm"><Edit2 size={22}/></button>
                             <button className="p-4 bg-white text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl border transition-all shadow-sm"><Trash2 size={22}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center"><UserIcon size={24}/></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Edit <span className="text-indigo-400">Identity</span></h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry ID: {editingUser.id}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-3 hover:bg-white/10 rounded-2xl"><X size={24}/></button>
              </div>
              <div className="p-12 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Full Name</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email</label>
                    <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Phone</label>
                    <input type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">City</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={editingUser.city} onChange={e => setEditingUser({...editingUser, city: e.target.value})} />
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Role Assignment (Multi-Select)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.values(UserRole).map(role => (
                      <button 
                        key={role}
                        onClick={() => {
                          const currentRoles = editingUser.roles || [];
                          const newRoles = currentRoles.includes(role) 
                            ? currentRoles.filter(r => r !== role)
                            : [...currentRoles, role];
                          setEditingUser({ ...editingUser, roles: newRoles });
                        }}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          editingUser.roles?.includes(role) 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200'
                        }`}
                      >
                        {role.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Granular Permissions (Super Admin Only)</label>
                  <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar p-2 border rounded-2xl">
                    {Object.values(Permission).map(perm => (
                      <label key={perm} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingUser.permissions?.includes(perm) || false}
                          onChange={(e) => {
                            const currentPerms = editingUser.permissions || [];
                            const newPerms = e.target.checked 
                              ? [...currentPerms, perm]
                              : currentPerms.filter(p => p !== perm);
                            setEditingUser({ ...editingUser, permissions: newPerms });
                          }}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span className="text-[9px] font-bold uppercase text-slate-600">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={() => handleUpdateUser(editingUser)} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all">Save Registry Updates</button>
              </div>
            </motion.div>
          </div>
        )}

        {showContentModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Plus size={24}/></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Direct <span className="text-indigo-200">Content Injection</span></h3>
                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mt-1">Assign leads/products to users</p>
                  </div>
                </div>
                <button onClick={() => setShowContentModal(false)} className="p-3 hover:bg-white/10 rounded-2xl"><X size={24}/></button>
              </div>
              <div className="p-12 space-y-8 max-h-[700px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Content Type</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={contentForm.type} onChange={e => setContentForm({...contentForm, type: e.target.value as any})}>
                      <option value="LEAD">Lead Requirement</option>
                      <option value="PRODUCT">Marketplace Product</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Assign to User</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={contentForm.targetUserId} onChange={e => setContentForm({...contentForm, targetUserId: e.target.value})}>
                      <option value="">Select Target User</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.roles[0]})</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Title / Requirement Name</label>
                  <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={contentForm.title} onChange={e => setContentForm({...contentForm, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Budget / Price (INR)</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={contentForm.price} onChange={e => setContentForm({...contentForm, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Category</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={contentForm.category} onChange={e => setContentForm({...contentForm, category: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Description / Specifications</label>
                  <textarea 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-sm outline-none focus:bg-white min-h-[120px]"
                    placeholder="Enter detailed description or product specifications..."
                    value={contentForm.description}
                    onChange={e => setContentForm({...contentForm, description: e.target.value})}
                  />
                </div>
                <button onClick={handleCreateContent} disabled={!contentForm.targetUserId || !contentForm.title} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-20">Inject into Registry</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-white/20 flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tighter">Identity Audit</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Protocol v2.5</p>
                    </div>
                 </div>
                 <button onClick={() => setShowUserModal(false)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition-all"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-10">
                 <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="w-48 h-48 bg-slate-50 rounded-[3rem] border-4 border-slate-100 overflow-hidden shrink-0 shadow-xl">
                       <img src={selectedUser.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-6">
                       <div>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedUser.name}</h2>
                          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">{selectedUser.email}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Phone</p>
                             <p className="text-sm font-bold text-slate-900">{selectedUser.phone || 'N/A'}</p>
                          </div>
                          <div className={`p-4 rounded-2xl border ${selectedUser.isApproved ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                             <p className="text-[9px] font-black uppercase mb-1 opacity-60">Status</p>
                             <p className="text-sm font-black uppercase">{selectedUser.status}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 border-b pb-2">Business Credentials</h4>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Company</span>
                             <span className="text-xs font-bold text-slate-900">{selectedUser.companyName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-slate-400 uppercase">GSTIN</span>
                             <span className="text-xs font-bold text-indigo-600">{selectedUser.gstNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Roles</span>
                             <div className="flex gap-2">
                                {selectedUser.roles.map(r => <span key={r} className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase">{r}</span>)}
                             </div>
                          </div>
                       </div>
                       {selectedUser.companyLogo && (
                         <div className="mt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Brand Visual Proof</p>
                            <div className="w-32 h-32 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                               <img src={selectedUser.companyLogo} className="w-full h-full object-cover" />
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 border-b pb-2">Geospatial Data</h4>
                       <div className="space-y-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Registered Address</p>
                             <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{selectedUser.address || 'No address provided'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">City</p>
                                <p className="text-xs font-bold text-slate-900">{selectedUser.city || 'N/A'}</p>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Service Radius</p>
                                <p className="text-xs font-bold text-slate-900">{selectedUser.serviceRadius || 0} km</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <button onClick={() => handleUserAction(selectedUser, 'reject')} className="flex-1 py-5 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Reject Identity</button>
                 <button onClick={() => handleUserAction(selectedUser, 'approve')} className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 size={18}/> Authorize Governance Protocol
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminView;
