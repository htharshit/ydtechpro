
import React, { useState } from 'react';
import { 
  LayoutDashboard, Package, FileText, MessageSquare, 
  Layers, Bell, User as UserIcon, Lock, ShieldAlert,
  Store, Settings, ChevronLeft, ChevronRight, Menu, X,
  Briefcase, ClipboardList, Zap, ShieldCheck, Globe,
  TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { User, UserRole, Lead, Product, Service, Negotiation, NegotiationStatus } from '../types';
import { storageService } from '../services/storageService';
import BuyerView from './BuyerView';
import ProviderView from './ProviderView';
import StoreView from './StoreView';
import ProfileSettings from './ProfileSettings';
import NegotiationEngine from './NegotiationEngine';
import LeadsPool from './LeadsPool';

const chartData = [
  { name: 'Jan', leads: 40, quotes: 24, volume: 2400 },
  { name: 'Feb', leads: 30, quotes: 13, volume: 2210 },
  { name: 'Mar', leads: 20, quotes: 98, volume: 2290 },
  { name: 'Apr', leads: 27, quotes: 39, volume: 2000 },
  { name: 'May', leads: 18, quotes: 48, volume: 2181 },
  { name: 'Jun', leads: 23, quotes: 38, volume: 2500 },
];

interface Props {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  initialView?: 'buyer' | 'seller' | 'store' | 'profile';
  isGuest?: boolean;
  onLoginRequired?: () => void;
}

const UnifiedDashboard: React.FC<Props> = ({ currentUser, onUpdateUser, initialView, isGuest, onLoginRequired }) => {
  const [activeModule, setActiveModule] = useState<string>(initialView || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null);

  const handleStartNegotiation = async (item: any) => {
    if (isGuest && onLoginRequired) {
      onLoginRequired();
      return;
    }

    // Determine entity type
    let entityType: 'PRODUCT' | 'SERVICE' | 'LEAD' = 'PRODUCT';
    if (item.requirementName) entityType = 'LEAD';
    else if (item.unit) entityType = 'SERVICE';

    const res = await storageService.startNegotiation({
      entityId: item.id,
      entityType: entityType,
      buyerId: currentUser.id,
      sellerId: item.vendorId || 'system_broadcast',
      currentOffer: item.price || item.budget || 0
    });

    if (res.status === 'success') {
      // In a real app, we'd get the negotiation object back
      // For now, we'll just switch to the negotiations module
      setActiveModule('negotiations');
    } else {
      alert("Failed to initiate negotiation protocol.");
    }
  };

  const isAdmin = currentUser.roles?.includes(UserRole.ADMIN) || currentUser.roles?.includes(UserRole.SUPER_ADMIN);
  const isSeller = currentUser.roles?.includes(UserRole.SELLER);
  const isVerified = currentUser.isApproved || isAdmin;
  const isLocked = currentUser.isLocked;

  // Role-based Sidebar Config
  const buyerLinks = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20}/> },
    { id: 'buyer', label: 'My Leads', icon: <FileText size={20}/> },
    { id: 'negotiations', label: 'Negotiations', icon: <MessageSquare size={20}/> },
    { id: 'store', label: 'Product Store', icon: <Store size={20}/> },
  ];

  const sellerLinks = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20}/> },
    { id: 'seller', label: 'Inventory', icon: <Package size={20}/> },
    { id: 'leads_pool', label: 'Open Leads Pool', icon: <Globe size={20}/> },
    { id: 'negotiations', label: 'Negotiations', icon: <MessageSquare size={20}/> },
    { id: 'store', label: 'Storefront', icon: <Store size={20}/> },
  ];

  const commonLinks = [
    { id: 'notifications', label: 'Alerts', icon: <Bell size={20}/> },
    { id: 'profile', label: 'Profile Settings', icon: <UserIcon size={20}/> },
  ];

  const links = isSeller ? sellerLinks : buyerLinks;

  if (isGuest) {
    if (initialView === 'buyer') {
      return <BuyerView currentUser={currentUser} isGuest={true} onLoginRequired={onLoginRequired} />;
    }
    if (initialView === 'seller') {
      return <ProviderView currentUser={currentUser} isGuest={true} onLoginRequired={onLoginRequired} />;
    }
    return <StoreView currentUser={currentUser} onLoginRequired={onLoginRequired || (() => {})} onNegotiate={() => {}} />;
  }

  if (isLocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
         <div className="max-w-xl w-full bg-white rounded-[3rem] border-2 border-rose-100 p-12 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>
            <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-600 mx-auto mb-8 shadow-xl shadow-rose-100 animate-pulse">
               <Lock size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Account <span className="text-rose-600">Locked</span></h2>
            <p className="text-slate-500 text-sm font-medium mt-6 leading-relaxed uppercase tracking-widest px-4">
              Your profile has been suspended by governance. All leads, products, and negotiations are currently frozen.
            </p>
            <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact support to appeal this action.</p>
            </div>
         </div>
      </div>
    );
  }

  if (isSeller && !isVerified && activeModule !== 'profile') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
         <div className="max-w-xl w-full bg-white rounded-[3rem] border border-slate-100 p-12 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
            <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-xl shadow-amber-50">
               <ShieldAlert size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Verification <span className="text-amber-500">Pending</span></h2>
            <p className="text-slate-400 text-sm font-medium mt-4 leading-relaxed italic uppercase tracking-tighter">
              Your Seller identity is being audited. Commercial features will unlock after Admin approval.
            </p>
            <button onClick={() => setActiveModule('profile')} className="mt-10 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Complete Profile Verification</button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] -mx-6 -my-10">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-white border-r border-slate-100 transition-all duration-300 flex flex-col pt-10 pb-6 shadow-sm z-40`}>
         <div className="px-6 mb-12 flex items-center justify-between">
            {sidebarOpen && <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Menu</h2>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
               {sidebarOpen ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}
            </button>
         </div>

         <div className="flex-1 space-y-2 px-4">
            {links.map(link => (
               <button
                  key={link.id}
                  onClick={() => setActiveModule(link.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                     activeModule === link.id 
                     ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                     : 'text-slate-500 hover:bg-slate-50'
                  }`}
               >
                  <div className="shrink-0">{link.icon}</div>
                  {sidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">{link.label}</span>}
               </button>
            ))}

            <div className="my-8 h-px bg-slate-50 mx-4"></div>

            {commonLinks.map(link => (
               <button
                  key={link.id}
                  onClick={() => setActiveModule(link.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                     activeModule === link.id 
                     ? 'bg-slate-900 text-white shadow-xl' 
                     : 'text-slate-500 hover:bg-slate-50'
                  }`}
               >
                  <div className="shrink-0">{link.icon}</div>
                  {sidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">{link.label}</span>}
               </button>
            ))}
         </div>

         <div className="px-6 mt-10">
            <div className={`p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center ${!sidebarOpen && 'hidden'}`}>
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 border shadow-sm">
                  <Zap size={24}/>
               </div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Enterprise Access Active</p>
            </div>
         </div>
      </aside>

      <main className="flex-1 p-10 bg-slate-50/30 overflow-y-auto custom-scrollbar">
         {activeModule === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-slate-900 italic">Overview <span className="text-indigo-600">Summary</span></h2>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Status:</span>
                     <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Operational</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><FileText size={24}/></div>
                        <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                           <ArrowUpRight size={14}/> +12%
                        </div>
                     </div>
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Active Requirements</h3>
                     <p className="text-4xl font-black text-slate-900">04</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><MessageSquare size={24}/></div>
                        <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                           <ArrowUpRight size={14}/> +5%
                        </div>
                     </div>
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Active Negotiations</h3>
                     <p className="text-4xl font-black text-slate-900">02</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><Bell size={24}/></div>
                        <div className="flex items-center gap-1 text-rose-500 font-black text-[10px]">
                           <ArrowDownRight size={14}/> -2%
                        </div>
                     </div>
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pending Alerts</h3>
                     <p className="text-4xl font-black text-slate-900">07</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                     <div className="flex items-center justify-between mb-10">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Market Activity</h4>
                        <select className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none">
                           <option>Last 6 Months</option>
                           <option>Last Year</option>
                        </select>
                     </div>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                              <defs>
                                 <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                              <YAxis hide />
                              <Tooltip 
                                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                 cursor={{ stroke: '#4f46e5', strokeWidth: 2 }}
                              />
                              <Area type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                     <div className="flex items-center justify-between mb-10">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Quote Conversion</h4>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase">Leads</span>
                           <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase">Quotes</span>
                        </div>
                     </div>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                              <YAxis hide />
                              <Tooltip 
                                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                              />
                              <Bar dataKey="leads" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="quotes" fill="#10b981" radius={[4, 4, 0, 0]} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>

               <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6 text-center md:text-left">
                     <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                        <ShieldCheck size={40}/>
                     </div>
                     <div>
                        <h4 className="text-xl font-black">Identity Verified Registry</h4>
                        <p className="text-slate-400 text-xs mt-2 max-w-sm">Your enterprise identity has been validated against the national registry. All transactions are fully governed.</p>
                     </div>
                  </div>
                  <button onClick={() => setActiveModule('store')} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95">Explore Marketplace</button>
               </div>
            </div>
         )}

         {activeModule === 'buyer' && (
            <div className="animate-in fade-in duration-500">
               <BuyerView currentUser={currentUser} isGuest={false} />
            </div>
         )}
         {activeModule === 'seller' && <ProviderView currentUser={currentUser} isGuest={false} />}
         {activeModule === 'leads_pool' && <LeadsPool currentUser={currentUser} onQuoteSubmitted={() => setActiveModule('negotiations')} />}
         {activeModule === 'store' && <StoreView currentUser={currentUser} onLoginRequired={onLoginRequired || (() => {})} onNegotiate={handleStartNegotiation} />}
         {activeModule === 'profile' && <ProfileSettings currentUser={currentUser} onUpdateUser={onUpdateUser} />}
         {activeModule === 'negotiations' && (
            <div className="space-y-10">
               <h2 className="text-3xl font-black text-slate-900 italic">Negotiation <span className="text-indigo-600">Hub</span></h2>
               <div className="py-20 text-center opacity-30 italic uppercase tracking-widest text-[10px] font-black">Select an active terminal below to continue discussions</div>
               {/* List of active negotiations would go here, fetching from storageService */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* This would be populated dynamically in a full implementation */}
               </div>
            </div>
         )}
      </main>
    </div>
  );
};

export default UnifiedDashboard;
