
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LogIn, ShieldCheck, CreditCard, Globe, Info, ArrowRight, X, RefreshCw, UserPlus, Mail, Lock, AlertCircle, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  onLogin: (user: User) => void;
  onOpenPublicStore: () => void;
  onOpenRegister: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onOpenPublicStore, onOpenRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const checkEmail = async (val: string) => {
    if (!val || !val.includes('@')) {
      setEmailExists(null);
      return;
    }
    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/v1/auth/check-email?email=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        setEmailExists(data.exists);
      } else {
        // If API fails, assume email exists so user can try to login
        setEmailExists(true);
      }
    } catch (e) {
      console.error(e);
      // Fallback for offline mode
      setEmailExists(true);
    } finally {
      setCheckingEmail(false);
    }
  };

  const [dbStatus, setDbStatus] = useState<{status: string, db: boolean}>({status: 'loading', db: false});

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/v1/system/health');
        if (res.ok) {
          const data = await res.json();
          setDbStatus(data);
        }
      } catch (e) {
        setDbStatus({status: 'offline', db: false});
      }
    };
    checkHealth();
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => checkEmail(val), 600);
  };

  const handleEmailBlur = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    checkEmail(email);
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/v1/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      setError('Google Login failed to initialize.');
    }
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          localStorage.setItem('yd_auth_token', token);
          onLogin(user);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await storageService.login(email, password);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        let msg = res.message || "Invalid Email or Password";
        if (msg.includes("integrity error")) {
          msg += ". You can try visiting /api/v1/dev/reset-db in your browser to fix the database.";
        }
        setError(msg);
      }
    } catch (err) {
      setError("Connection refused. Verify registry server is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotSuccess(null);
    try {
      const res = await storageService.forgotPassword(forgotEmail);
      if (res.status === 'success') {
        setForgotSuccess(res.message || "Password reset protocol initiated. Check your registered inbox.");
      } else {
        setError(res.message || "Email identity not found in registry.");
      }
    } catch (err) {
      setError("Communication bridge failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-700">
      <div className="flex-1 bg-[#0f172a] text-white p-12 md:p-20 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-emerald-600/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-4 mb-16 cursor-pointer group" onClick={onOpenPublicStore}>
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform"><Shield size={32} /></div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">YDTechPro <span className="text-indigo-500 italic">Governance</span></h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-12 leading-tight tracking-tighter">Identity <span className="text-indigo-500 italic">&</span> Procurement <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">Standardized.</span></h2>
          
          <div className="space-y-10">
            {[
              { icon: <ShieldCheck size={20}/>, title: "Verified Identity", desc: "Enterprise-grade authentication linked directly to our national procurement registry." },
              { icon: <CreditCard size={20}/>, title: "Governance Payments", desc: "Integrated Razorpay environment for secure transaction locking and PII disclosure." },
              { icon: <Globe size={20}/>, title: "Geospatial Matching", desc: "Ultra-efficient radius-based seller discovery using ST_Distance_Sphere technology." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 shadow-lg">{item.icon}</div>
                <div>
                  <h4 className="font-bold text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-10 border-t border-white/10 flex items-center gap-12 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
             <div className="flex flex-col">
                <span className="text-white text-2xl font-black mb-1">75K+</span>
                Active Leads
             </div>
             <div className="flex flex-col">
                <span className="text-white text-2xl font-black mb-1">1.2M+</span>
                Product Specs
             </div>
             <div className="flex flex-col">
                <span className="text-white text-2xl font-black mb-1">500+</span>
                Cities Covered
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-sm space-y-10 animate-in slide-in-from-right duration-700">
          <div className="text-center">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Portal Access</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus.db ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {dbStatus.db ? 'MySQL Connected' : 'JSON Fallback Active'}
              </p>
            </div>
            <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-[0.4em] font-black">Authorized Personnel Only</p>
          </div>

          {error && !showForgot && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in shake text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
            >
               <img src="https://www.google.com/favicon.ico" className="w-4 h-4" /> Continue with Google Identity
            </button>
            
            <div className="relative flex items-center">
               <div className="flex-grow border-t border-slate-100"></div>
               <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Or Registry Credentials</span>
               <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-5 tracking-widest">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="identity@ydtechpro.com" 
                    required 
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" 
                    value={email} 
                    onChange={handleEmailChange} 
                    onBlur={handleEmailBlur}
                  />
                  {checkingEmail && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <RefreshCw className="animate-spin text-indigo-500" size={16} />
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {emailExists === true && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-5 tracking-widest">Secure Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          required 
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <div className="px-5 pt-2">
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                password.length < 6 ? 'w-1/4 bg-rose-500' : 
                                password.length < 10 ? 'w-2/4 bg-amber-500' : 
                                password.length < 14 ? 'w-3/4 bg-blue-500' : 'w-full bg-emerald-500'
                              }`}
                            />
                          </div>
                          <p className="text-[7px] font-black uppercase tracking-widest mt-1 text-slate-400">
                            Strength: {
                              password.length < 6 ? 'Weak' : 
                              password.length < 10 ? 'Medium' : 
                              password.length < 14 ? 'Strong' : 'Enterprise'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <button type="button" onClick={() => { setShowForgot(true); setError(null); }} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:underline hover:text-indigo-600">Recovery Protocol</button>
                      <button type="button" onClick={onOpenRegister} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 flex items-center gap-1"><UserPlus size={12}/> Join Ecosystem</button>
                    </div>
                    <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                      {loading ? <RefreshCw className="animate-spin" size={20}/> : <LogIn size={20}/>} Verify & Access Dashboard
                    </button>
                  </motion.div>
                )}

                {emailExists === false && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 overflow-hidden pt-4"
                  >
                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                      <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-relaxed">
                        Identity not found in our registry. Would you like to initiate the registration wizard?
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={onOpenRegister}
                      className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 active:scale-95"
                    >
                      <UserPlus size={20}/> Register Free
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex gap-4 items-start group hover:border-indigo-200 transition-colors">
            <Info size={20} className="text-indigo-400 shrink-0 mt-1 group-hover:scale-125 transition-transform"/>
            <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">System is running in High Governance mode. Metadata is logged for auditing.</p>
          </div>

          <div className="pt-10 text-center space-y-4">
            <button onClick={onOpenPublicStore} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors flex items-center gap-2 mx-auto">
              Preview Marketplace Registry <ArrowRight size={14}/>
            </button>
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Default Admin Access</p>
              <p className="text-[9px] font-bold text-slate-600 mt-1">htharshit@gmail.com / admin123</p>
            </div>
          </div>
        </div>
      </div>

      {showForgot && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-12 w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => { setShowForgot(false); setForgotSuccess(null); setError(null); }} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors"><X size={28}/></button>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Registry Recovery</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Password Reset Request</p>
            
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest mb-6 animate-in shake">
                {error}
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="p-6 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  {forgotSuccess}
                </div>
                <button onClick={() => { setShowForgot(false); setForgotSuccess(null); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Back to Portal</button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-5 tracking-widest">Verify Email Identity</label>
                  <input type="email" placeholder="registered@domain.com" required className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-indigo-600 transition-all shadow-inner" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                  {loading ? <RefreshCw className="animate-spin" size={20}/> : "Initiate Recovery Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
