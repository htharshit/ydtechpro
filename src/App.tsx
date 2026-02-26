
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { User, UserRole } from './types';
import { storageService } from './services/storageService';
import Login from './components/Login';
import Registration from './components/Registration';
import GlobalHeader from './components/GlobalHeader';
import AdminView from './components/AdminView';
import UnifiedDashboard from './components/UnifiedDashboard';
import StoreView from './components/StoreView';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ContactSupport from './components/ContactSupport';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGlobalView, setActiveGlobalView] = useState<'buyer' | 'seller' | 'store' | 'profile' | 'login' | 'register' | 'landing' | 'privacy' | 'terms' | 'contact'>('landing');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await storageService.init();
        const isOnline = await storageService.checkHealth();
        setServerStatus(isOnline ? 'online' : 'offline');

        const savedToken = localStorage.getItem('yd_auth_token');
        if (savedToken) {
          const user = await storageService.getMe();
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (err) {
        setServerStatus('offline');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // Background Sync Effect: Refresh data when server comes back online
  useEffect(() => {
    if (serverStatus === 'online' && currentUser) {
      storageService.getUsers(); // Syncs registry in background
    }
    
    const statusInterval = setInterval(async () => {
      const isOnline = await storageService.checkHealth();
      setServerStatus(isOnline ? 'online' : 'offline');
    }, 15000);
    
    return () => clearInterval(statusInterval);
  }, [serverStatus, !!currentUser]);

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    const isAdmin = user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN) || user.email === storageService.SUPER_ADMIN_EMAIL;
    setActiveGlobalView(isAdmin ? 'buyer' : 'store'); // Admins go to dashboard, others to store
    storageService.logAction(user, 'LOGIN', 'Session Established');
  };

  const handleLogout = () => {
    if (currentUser) storageService.logAction(currentUser, 'LOGOUT', 'User ended session');
    setCurrentUser(null);
    setActiveGlobalView('landing');
    localStorage.removeItem('yd_auth_token');
  };

  const handleNavigate = (view: 'buyer' | 'seller' | 'store' | 'profile' | 'login' | 'landing' | 'register' | 'privacy' | 'terms' | 'contact') => {
    if (view === 'profile') {
      if (!currentUser) {
        setActiveGlobalView('login');
        return;
      }
    }
    setActiveGlobalView(view as any);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-6 max-w-sm px-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative">
             <div className="absolute inset-0 bg-indigo-400 rounded-[2.5rem] animate-ping opacity-20"></div>
             <ShieldCheck size={48} className="relative z-10" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">YDTechPro</h2>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Governance Protocol Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.roles?.includes(UserRole.ADMIN) || currentUser?.roles?.includes(UserRole.SUPER_ADMIN) || currentUser?.email === storageService.SUPER_ADMIN_EMAIL;
  const isLanding = activeGlobalView === 'landing';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {!isLanding && (
        <GlobalHeader 
          user={currentUser} 
          onLogout={handleLogout} 
          onNavigate={handleNavigate} 
          activeView={activeGlobalView}
          onLogin={handleLogin}
        />
      )}
      
      <main className={`flex-1 ${!isLanding ? 'pt-[75px]' : ''}`}>
        <AnimatePresence mode="wait">
          {activeGlobalView === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage 
                onNavigate={handleNavigate} 
                currentUser={currentUser}
                onLoginSuccess={handleLogin}
                onLogout={handleLogout}
              />
            </motion.div>
          )}
          {activeGlobalView === 'login' && !currentUser && (
            <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Login onLogin={handleLogin} onOpenPublicStore={() => setActiveGlobalView('store')} onOpenRegister={() => setActiveGlobalView('register')} />
            </motion.div>
          )}
          {activeGlobalView === 'register' && !currentUser && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Registration onSuccess={() => setActiveGlobalView('login')} onBackToLogin={() => setActiveGlobalView('login')} />
            </motion.div>
          )}
          {activeGlobalView === 'privacy' && (
            <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PrivacyPolicy onBack={() => setActiveGlobalView('landing')} />
            </motion.div>
          )}
          {activeGlobalView === 'terms' && (
            <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TermsOfService onBack={() => setActiveGlobalView('landing')} />
            </motion.div>
          )}
          {activeGlobalView === 'contact' && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ContactSupport onBack={() => setActiveGlobalView('landing')} />
            </motion.div>
          )}
          
          {activeGlobalView !== 'login' && activeGlobalView !== 'register' && activeGlobalView !== 'landing' && activeGlobalView !== 'privacy' && activeGlobalView !== 'terms' && activeGlobalView !== 'contact' && (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl w-full mx-auto px-6 py-10">
              {activeGlobalView === 'store' ? (
                <StoreView currentUser={currentUser || undefined} onLoginRequired={() => setActiveGlobalView('login')} onNegotiate={() => setActiveGlobalView('buyer')} />
              ) : activeGlobalView === 'buyer' || activeGlobalView === 'seller' ? (
                <UnifiedDashboard 
                  currentUser={currentUser || { id: 'guest', name: 'Guest', email: '', roles: [], isApproved: false, status: 'pending', authProvider: 'email', joinedDate: '', phone: '', profileImage: '' }} 
                  onUpdateUser={handleUpdateUser} 
                  initialView={activeGlobalView as any}
                  isGuest={!currentUser}
                  onLoginRequired={() => setActiveGlobalView('login')}
                />
              ) : currentUser ? (
                isAdmin ? (
                  <AdminView currentUser={currentUser} />
                ) : (
                  <UnifiedDashboard 
                    currentUser={currentUser} 
                    onUpdateUser={handleUpdateUser} 
                    initialView={activeGlobalView as any}
                    isGuest={false}
                    onLoginRequired={() => setActiveGlobalView('login')}
                  />
                )
              ) : (
                <Login onLogin={handleLogin} onOpenPublicStore={() => setActiveGlobalView('store')} onOpenRegister={() => setActiveGlobalView('register')} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {serverStatus === 'offline' && (
        <div className="fixed bottom-6 left-6 z-[10000] flex items-center gap-3 px-6 py-3 bg-white text-rose-600 border border-rose-100 rounded-2xl shadow-2xl animate-in slide-in-from-left duration-500">
           <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><AlertTriangle size={18} /></div>
           <div>
              <p className="text-[8px] font-black uppercase tracking-widest leading-none">Local Mode</p>
              <p className="text-[10px] font-black uppercase mt-1">Registry Offline • Using Local Persistence</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
