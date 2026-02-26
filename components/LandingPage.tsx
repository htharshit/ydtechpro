
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import { 
  ShieldCheck, ShoppingCart, Briefcase, Store, 
  ArrowRight, CheckCircle2, Zap, Globe, 
  Lock, Users, BarChart3, ChevronRight,
  Star, MessageSquare, IndianRupee, Play,
  Layout, Search, MapPin, Clock, Filter, Handshake,
  TrendingUp, Package, Building2, Eye, EyeOff, ChevronDown, Menu, X, Bell
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Lead, Product, User, UserRole } from '../types';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

interface Props {
  onNavigate: (view: 'buyer' | 'seller' | 'store' | 'profile' | 'login' | 'landing' | 'register' | 'privacy' | 'terms' | 'contact') => void;
  currentUser?: User | null;
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
}

const LandingPage: React.FC<Props> = ({ onNavigate, currentUser, onLoginSuccess, onLogout }) => {
  const [stats, setStats] = useState({
    leads: 75000,
    volume: 10,
    products: 1200000,
    vendors: 500
  });
  const [teasers, setTeasers] = useState<{leads: Lead[], products: Product[]}>({leads: [], products: []});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser) {
      const fetchNotifs = async () => {
        const n = await storageService.getNotifications(currentUser.id);
        setNotifications(n || []);
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [l, p] = await Promise.all([
          storageService.getLeads(),
          storageService.getProducts()
        ]);
        setTeasers({
          leads: (l || []).slice(0, 6),
          products: (p || []).slice(0, 6)
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleEmailBlur = async () => {
    if (email && email.includes('@')) {
      const exists = await storageService.checkEmail(email);
      setEmailExists(exists);
      if (!exists) {
        // Auto-transition to registration
        // In a real app, we might pass the email via context or query param
        if (confirm("Email not found. Proceed to Registration?")) {
           onNavigate('register');
        }
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError("Please enter your email first.");
      return;
    }
    const res = await storageService.forgotPassword(email);
    if (res.status === 'success') {
      alert("Password reset link sent to your email.");
    } else {
      setLoginError(res.message || "Failed to send reset link.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    const res = await storageService.login(email, password);
    if (res.success && res.user && onLoginSuccess) {
      onLoginSuccess(res.user);
    } else {
      setLoginError(res.message || "Login failed");
    }
  };

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^A-Za-z0-9]/)) score++;
    setPasswordStrength(score);
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  const CountUp = ({ end, suffix = '', prefix = '' }: { end: number, suffix?: string, prefix?: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
      if (isInView) {
        let start = 0;
        const duration = 2000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(start);
          }
        }, 16);
        return () => clearInterval(timer);
      }
    }, [isInView, end]);

    return <span ref={ref}>{prefix}{Math.floor(count).toLocaleString()}{suffix}</span>;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white overflow-x-hidden font-sans transition-colors duration-300">
      
      {/* Sticky Global Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-800/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                <path d="M20 4L4 12V20C4 28.8 10.8 37.1 20 39.4C29.2 37.1 36 28.8 36 20V12L20 4Z" fill="url(#paint0_linear)" stroke="white" strokeWidth="2"/>
                <path d="M20 10V30M10 20H30" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="4" y1="4" x2="36" y2="39.4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563EB"/>
                    <stop offset="1" stopColor="#16A34A"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">YDTechPro</h1>
          </div>

          {/* Desktop Navigation - Animated CTAs */}
          <nav className="hidden xl:flex items-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('buyer')} 
              className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-blue-600 text-white shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all"
            >
              <ShoppingCart size={16} /> I am Buyer
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('seller')} 
              className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 flex items-center gap-3 transition-all"
            >
              <Handshake size={16} /> I am Seller
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('store')} 
              className="px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-amber-500 text-white shadow-xl shadow-amber-500/20 flex items-center gap-3 transition-all"
            >
              <Store size={16} /> Store
            </motion.button>
          </nav>

          {/* Auth Section - Right Aligned */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all relative mr-2" 
                title="Notifications"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifs && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100]"
                  >
                    <div className="p-5 border-b border-slate-50 dark:border-slate-700 bg-slate-900 text-white flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest">Protocol Alerts</span>
                      <span className="text-[9px] bg-indigo-500 px-2 py-0.5 rounded-full font-black">
                        {notifications.filter(n => !n.isRead).length} New
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {currentUser ? (
                        notifications.length > 0 ? (
                          notifications.map(n => (
                            <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <p className="text-[11px] font-black text-slate-900 dark:text-white">{n.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center opacity-20">
                            <Bell size={32} className="mx-auto mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">No alerts found</p>
                          </div>
                        )
                      ) : (
                        <div className="p-10 text-center">
                          <Lock size={32} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login to view alerts</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {currentUser ? (
              <div className="relative group">
                <button className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-all hover:border-indigo-200">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300">{currentUser.name}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="p-4 border-b border-slate-50 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Identity Verified</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.email}</p>
                  </div>
                  <button onClick={() => onNavigate('profile')} className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors">Profile Terminal</button>
                  <button onClick={() => onNavigate(currentUser.roles.includes(UserRole.BUYER) ? 'buyer' : 'seller')} className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors">Active Dashboard</button>
                  <button onClick={onLogout} className="w-full text-left px-5 py-4 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-colors">Terminate Session</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="Enter email" 
                      className="bg-transparent pl-4 pr-2 py-2 text-[11px] font-bold outline-none w-40 dark:text-white placeholder:text-slate-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleEmailBlur}
                    />
                  </div>
                  
                  <AnimatePresence>
                    {emailExists && (
                      <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="flex items-center gap-2 overflow-hidden"
                      >
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Password" 
                          className="bg-transparent px-2 py-2 text-[11px] font-bold outline-none w-32 dark:text-white placeholder:text-slate-400"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={() => setShowPassword(!showPassword)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={emailExists ? handleLogin : handleEmailBlur}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg"
                  >
                    {emailExists ? 'Login' : 'Next'}
                  </button>
                </div>

                <div className="flex items-center gap-4 ml-2">
                  <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm group" title="Google Authentication">
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                  </button>
                  
                  <div className="flex flex-col items-start">
                    <button onClick={handleForgotPassword} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 underline underline-offset-4 transition-colors">Forgot Password?</button>
                    <button onClick={() => onNavigate('register')} className="mt-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:brightness-110 transition-all">Register Free</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="xl:hidden p-2 text-gray-600 dark:text-gray-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 p-6 md:hidden flex flex-col gap-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)}><X size={24}/></button>
              </div>
              <button onClick={() => onNavigate('buyer')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg">
                <ShoppingCart size={20} /> I am Buyer
              </button>
              <button onClick={() => onNavigate('seller')} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg">
                <Handshake size={20} /> I am Seller
              </button>
              <button onClick={() => onNavigate('store')} className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg">
                <Store size={20} /> Store
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>
              {!currentUser && (
                <div className="flex gap-3">
                  <button onClick={() => onNavigate('login')} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">Login</button>
                  <button onClick={() => onNavigate('register')} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold rounded-xl shadow-md">Register Free</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24 overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10 flex flex-col items-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight drop-shadow-lg mb-6"
          >
            Join the Revolution in <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-600">Governed Procurement</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed"
          >
            Post Urgent Leads • Discover Verified Sellers • Engage in Blind Negotiations • 
            Unlock Identities Only After Mutual 25 INR Governance Fees • 
            Secured with Admin Oversight & Real-Time Notifications
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center"
          >
            <button onClick={() => onNavigate('buyer')} className="group flex-1 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-3">
              <ShoppingCart size={32} />
              <span className="text-2xl font-bold">I am Buyer</span>
            </button>
            <button onClick={() => onNavigate('seller')} className="group flex-1 py-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-2xl hover:shadow-green-500/30 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-3">
              <Handshake size={32} />
              <span className="text-2xl font-bold">I am Seller</span>
            </button>
            <button onClick={() => onNavigate('store')} className="group flex-1 py-6 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-2xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-3">
              <Store size={32} />
              <span className="text-2xl font-bold">Store</span>
            </button>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-400"
          >
            <ChevronDown size={32} />
          </motion.div>
        </div>
      </section>

      {/* Live Market Stats */}
      <section className="py-24 bg-gray-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Active Leads', value: stats.leads, suffix: '+', icon: <TrendingUp size={24} />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
              { label: 'Governed Transactions', value: stats.volume, prefix: '₹', suffix: ' Cr+', icon: <IndianRupee size={24} />, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
              { label: 'Products Listed', value: stats.products, suffix: '+', icon: <Package size={24} />, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
              { label: 'Verified Vendors', value: stats.vendors, suffix: '+', icon: <Building2 size={24} />, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center group"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                  <CountUp end={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </p>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Marketplace Teaser Carousel */}
      <section className="py-24 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Live Market <span className="text-blue-600">Teasers</span></h3>
              <p className="text-gray-500 dark:text-gray-400">Real-time anonymized broadcasts from the ecosystem</p>
            </div>
            <button onClick={() => onNavigate('store')} className="hidden md:flex items-center gap-2 text-blue-600 font-bold hover:underline">
              View All <ArrowRight size={16} />
            </button>
          </div>

          <Slider {...sliderSettings} className="pb-12">
            {teasers.leads.map((lead, i) => (
              <div key={i} className="px-3">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden h-full group hover:shadow-2xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img src={lead.leadImage || `https://picsum.photos/seed/lead${i}/400/300`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                      {lead.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">{lead.requirementName}</h4>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Budget</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">₹{lead.budget.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Urgency</p>
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded-md text-xs font-bold flex items-center gap-1">
                          <Clock size={12}/> Immediate
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {teasers.products.map((prod, i) => (
              <div key={`prod-${i}`} className="px-3">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden h-full group hover:shadow-2xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img src={prod.productImage || `https://picsum.photos/seed/prod${i}/400/300`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                      In Stock
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">{prod.name}</h4>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Price</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">₹{prod.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Vendor</p>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold">4.8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* Buyer Journey Infographic */}
      <section className="py-24 bg-blue-50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Your Journey as a <span className="text-blue-600">Buyer</span></h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">From discovery to delivery, every step is governed for your protection.</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {[
                { title: 'Browse & Discover', desc: 'Geo-prioritized listings tailored to your location.', icon: <Search size={24} />, step: 1 },
                { title: 'Blind Negotiation', desc: 'Identities masked. Negotiate fair value without bias.', icon: <MessageSquare size={24} />, step: 2 },
                { title: 'Governance Fee', desc: 'Pay ₹25 to unlock seller identity & secure deal.', icon: <ShieldCheck size={24} />, step: 3 },
                { title: 'Secure Fulfillment', desc: 'Track milestones and rate your experience.', icon: <CheckCircle2 size={24} />, step: 4 },
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative"
                >
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg shadow-blue-500/30 relative z-10">
                    {step.icon}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-700 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold border-2 border-blue-600">
                      {step.step}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Governance & Trust Pillars */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Built on <span className="text-green-600">Trust</span></h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Enterprise-grade security protocols protecting every interaction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Dual-Fee Governance', desc: 'Both parties pay ₹25 to unlock identities, ensuring commitment.', icon: <IndianRupee size={24} />, color: 'text-blue-600' },
              { title: 'Blind Negotiation', desc: 'Anonymity until mutual agreement prevents price bias.', icon: <EyeOff size={24} />, color: 'text-purple-600' },
              { title: 'Admin Oversight', desc: 'Every transaction monitored for compliance and fraud prevention.', icon: <ShieldCheck size={24} />, color: 'text-green-600' },
              { title: 'Real-Time Alerts', desc: 'Instant WebSocket notifications for quotes and status updates.', icon: <Zap size={24} />, color: 'text-amber-600' },
              { title: 'Geo-Precise Matching', desc: 'Kilometer-radius filtering for hyper-local logistics.', icon: <MapPin size={24} />, color: 'text-red-600' },
              { title: 'AES-256 Encryption', desc: 'Bank-grade data protection for all sensitive information.', icon: <Lock size={24} />, color: 'text-indigo-600' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all flex gap-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Video */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-12">See the <span className="text-blue-400">Platform</span> in Action</h3>
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-700 group cursor-pointer">
            <img src="https://picsum.photos/seed/demo/1280/720" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play size={32} fill="currentColor" className="ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-left">
              <h4 className="text-xl font-bold">End-to-End Workflow Demo</h4>
              <p className="text-gray-300 text-sm">Watch how blind negotiations lead to secure transactions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-8">Ready to Unlock Your Market Potential?</h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center mb-12">
            <button onClick={() => onNavigate('buyer')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg">
              I am Buyer
            </button>
            <button onClick={() => onNavigate('seller')} className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg">
              I am Seller
            </button>
            <button onClick={() => onNavigate('store')} className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg">
              Visit Store
            </button>
          </div>
          
          <div className="max-w-md mx-auto bg-gray-50 dark:bg-slate-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 flex">
            <input type="email" placeholder="Enter your email for updates" className="flex-1 bg-transparent px-4 py-2 outline-none text-sm" />
            <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm hover:opacity-90">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600 w-6 h-6" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">YDTechPro</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
            <button onClick={() => onNavigate('privacy')} className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-blue-600 dark:hover:text-blue-400">Contact Support</button>
          </div>
          <div className="flex gap-4 text-gray-400">
            <Globe size={20} className="hover:text-blue-600 cursor-pointer" />
            <Users size={20} className="hover:text-blue-600 cursor-pointer" />
            <Briefcase size={20} className="hover:text-blue-600 cursor-pointer" />
          </div>
        </div>
        <div className="text-center mt-8 text-xs text-gray-400">
          © 2025 YDTechPro Enterprise Governance. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
