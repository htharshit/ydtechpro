
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, Bell, Wallet, Star, 
  ShoppingCart, Briefcase, Store, Shield,
  ChevronDown, User as UserIcon,
  CheckCircle2, Handshake, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { User, Notification } from '../types';
import { storageService } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: 'buyer' | 'seller' | 'store' | 'profile' | 'login' | 'register' | 'landing') => void;
  activeView: string;
  onLogin: (user: User) => void;
}

const GlobalHeader: React.FC<Props> = ({ user, onLogout, onNavigate, activeView, onLogin }) => {
  const [avgRating, setAvgRating] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth states for header login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (user) {
      refreshData();
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshData = async () => {
    if (!user) return;
    try {
      const orders = await storageService.getOrders();
      const relevantRatings = orders
        .map(o => (o.providerId === user.id ? o.providerRatingFromBuyer : (o.buyerId === user.id ? o.buyerRatingFromProvider : undefined)))
        .filter((r): r is number => typeof r === 'number');
      
      if (relevantRatings.length > 0) {
        setAvgRating(relevantRatings.reduce((a, b) => a + b, 0) / relevantRatings.length);
      }

      const notifs = await storageService.getNotifications(user.id);
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch (e) {
      console.warn("Header refresh failed", e);
    }
  };

  const checkEmail = async (val: string) => {
    if (!val || !val.includes('@')) return;
    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/v1/auth/check-email?email=${encodeURIComponent(val)}`);
      const data = await res.json();
      setEmailExists(data.exists);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => checkEmail(val), 600);
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await storageService.login(email, password);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.message || "Invalid Credentials");
      }
    } catch (err) {
      setError("Registry connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/v1/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (e) {
      setError("Google Auth failed.");
    }
  };

  const getProfileImage = (u: User) => {
    const img = u.profileImage || u.photoUrl;
    if (!img) return null;
    if (img.startsWith('/')) return `${window.location.origin}${img}`;
    return img;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-[75px] bg-[#0f172a] text-white z-[9999] px-6 flex items-center justify-between shadow-2xl border-b border-white/5">
      <div className="flex items-center gap-4 cursor-pointer shrink-0" onClick={() => onNavigate('landing')}>
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
          <Shield size={24} />
        </div>
        <div className="hidden xl:block">
          <h1 className="text-sm font-black uppercase tracking-tighter leading-none">YDTechPro</h1>
          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Enterprise Governance</p>
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-4">
        <button 
          onClick={() => onNavigate('buyer')}
          className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:scale-105 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.05)] bg-blue-600 text-white"
        >
          <ShoppingCart size={14}/> I am Buyer
        </button>
        <button 
          onClick={() => onNavigate('seller')}
          className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:scale-105 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.05)] bg-green-600 text-white"
        >
          <Handshake size={14}/> I am Seller
        </button>
        <button 
          onClick={() => onNavigate('store')}
          className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:scale-105 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.05)] bg-amber-500 text-white"
        >
          <Store size={14}/> Store
        </button>
      </nav>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-slate-400 hover:text-white transition-all relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-[#0f172a] text-[8px] text-white flex items-center justify-center font-black">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-white/10 mx-1"></div>

          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-4 px-4 h-10 bg-white/5 rounded-xl border border-white/5 mr-2">
                 <div className="flex items-center gap-2">
                   <Wallet size={14} className="text-emerald-400" />
                   <span className="text-[10px] font-black tracking-widest">₹{(user.walletBalance ?? 0).toLocaleString()}</span>
                 </div>
                 {avgRating > 0 && (
                   <div className="flex items-center gap-1 border-l border-white/10 pl-4">
                     <Star size={10} className="fill-amber-400 text-amber-400" />
                     <span className="text-[10px] font-black">{avgRating.toFixed(1)}</span>
                   </div>
                 )}
              </div>

              <button 
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-3 p-1 pr-3 hover:bg-white/5 rounded-2xl transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white overflow-hidden shadow-inner">
                  {getProfileImage(user) ? (
                    <img src={getProfileImage(user)!} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black">{user.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white leading-none truncate max-w-[80px]">{user.name}</p>
                  <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">{user.roles?.[0] || 'Member'}</p>
                </div>
                <ChevronDown size={12} className="text-slate-500 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 transition-all ml-1"
                title="End Session"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleGoogleLogin} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2">
                <img src="https://www.google.com/favicon.ico" className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Google</span>
              </button>

              <button 
                onClick={() => onNavigate('login')}
                className="hidden lg:block px-5 py-2.5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
              >
                Login
              </button>

              <button 
                onClick={() => onNavigate('register')}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all"
              >
                Register Free
              </button>
            </div>
          )}
        </div>
      </div>

      {showNotifs && (
        <div className="absolute top-[80px] right-6 w-80 bg-white rounded-[2rem] border border-slate-200 shadow-2xl animate-in zoom-in duration-200 overflow-hidden text-slate-900">
           <div className="p-5 border-b border-slate-50 bg-[#0f172a] text-white flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest">Protocol Alerts</span>
              {unreadCount > 0 && <span className="text-[9px] bg-indigo-500 px-2 py-0.5 rounded-full font-black">{unreadCount} New</span>}
           </div>
           <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-slate-50 flex gap-3 ${n.isRead ? 'opacity-60 bg-white' : 'bg-indigo-50/30'}`}>
                   <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Bell size={14}/>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-900">{n.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed truncate">{n.message}</p>
                      <p className="text-[8px] text-slate-300 font-bold mt-1 uppercase tracking-widest">{new Date(n.timestamp).toLocaleTimeString()}</p>
                   </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="p-10 text-center opacity-20">
                   <Bell size={32} className="mx-auto mb-3" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Silence on all circuits</p>
                </div>
              )}
           </div>
        </div>
      )}
    </header>
  );
};

export default GlobalHeader;
