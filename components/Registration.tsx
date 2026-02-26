
import React, { useState } from 'react';
import { 
  Shield, User as UserIcon, Building, Phone, Mail, 
  ArrowRight, ArrowLeft, Camera, ShieldCheck, 
  CheckCircle2, UploadCloud, Gavel, MapPin, 
  CreditCard, Briefcase, ShoppingCart, RefreshCw,
  Globe, LayoutGrid, Zap, Info, Lock
} from 'lucide-react';
import { UserRole } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

const Registration: React.FC<Props> = ({ onSuccess, onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewProfile, setPreviewProfile] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roles: [UserRole.BUYER] as UserRole[],
    profileImage: '',
    companyName: '',
    gstNumber: '',
    companyLogo: '',
    // Structured Address
    house_no: '',
    street: '',
    landmark: '',
    area: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    serviceRadius: 50, // default 50km
    lat: 30.901, // Mock Punjab location
    lng: 75.8573,
    concernedPersonName: '',
    concernedPersonContact: '',
    termsAccepted: false,
    authProvider: 'email' as 'email' | 'google'
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'companyLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return setError("Image must be smaller than 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => {
        const base = reader.result as string;
        if (field === 'profileImage') setPreviewProfile(base);
        else setPreviewLogo(base);
        setFormData({ ...formData, [field]: base });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (s: number) => {
    setError(null);
    if (s === 1) {
      if (formData.roles.length === 0) return "Please select at least one role.";
      if (!formData.email || !formData.password) return "Email and password are required.";
      if (!formData.email.includes('@')) return "Invalid email address.";
      if (!otpVerified) return "Email verification required.";
    }
    if (s === 2) {
      if (!formData.name || !formData.phone) return "Personal details are required.";
      if (!formData.house_no || !formData.street || !formData.city || !formData.pincode) return "Complete address is mandatory.";
    }
    if (s === 3) {
      if (!formData.companyName || !formData.gstNumber) return "Company details are required for governance.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    
    if (step === 3) {
       handleSubmit(new Event('submit') as any);
       return;
    }
    
    setStep(step + 1);
  };

  const simulateOtp = () => {
    if (!formData.email) return setError("Email required for OTP.");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      alert("Verification Code: 123456 (Simulated)");
    }, 1500);
  };

  const verifyOtp = () => {
    if (otpValue === '123456') {
      setOtpVerified(true);
      setOtpSent(false);
    } else {
      setError("Invalid verification code.");
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted && step === 5) return setError("You must accept governance protocols.");
    
    setLoading(true);
    setError(null);
    try {
      const fullAddr = `${formData.house_no}, ${formData.street}, ${formData.area}, ${formData.city}, ${formData.pincode}`;
      const res = await storageService.register({ ...formData, address: fullAddr });
      if (res.status === 'success') {
        alert("Registration Successful! Account set to PENDING for Admin Audit.");
        onSuccess();
      } else {
        setError(res.message || "Registry broadcast failed.");
      }
    } catch (err) {
      setError("Communication failed with governance server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-20">
      <div className="w-full max-w-4xl bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in duration-500">
        <div className="bg-[#0f172a] p-16 text-white relative">
           <div className="absolute top-0 right-0 p-16 opacity-5"><Shield size={200}/></div>
           <div className="flex items-center gap-6 mb-12 relative z-10">
              <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-500/20"><Shield size={40} /></div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Identity <span className="text-indigo-400">Onboarding</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Enterprise Governance Registry</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6 relative z-10">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${step >= s ? 'bg-indigo-500 border-indigo-400 text-white shadow-xl' : 'bg-white/5 border-white/10 text-white/40'}`}>
                      {step > s ? <CheckCircle2 size={18}/> : `0${s}`}
                   </div>
                   {s < 5 && <div className={`w-12 h-1 ${step > s ? 'bg-indigo-500' : 'bg-white/5'} rounded-full`}></div>}
                </div>
              ))}
           </div>
        </div>

        <div className="p-16 space-y-12">
          {error && (
            <div className="p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest animate-in shake text-center">
               {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right duration-500">
               <div className="text-center">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Choose Your Ecosystem Role</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Roles determine your dashboard features and access keys</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <button type="button" onClick={() => setFormData({ ...formData, roles: [UserRole.BUYER] })} className={`p-12 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-8 group ${formData.roles.includes(UserRole.BUYER) ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100'}`}>
                     <div className={`p-6 rounded-[2rem] transition-colors ${formData.roles.includes(UserRole.BUYER) ? 'bg-white/10' : 'bg-indigo-50'}`}><ShoppingCart size={48} className={formData.roles.includes(UserRole.BUYER) ? 'text-white' : 'text-indigo-600'}/></div>
                     <div className="text-center">
                        <span className="text-[11px] font-black uppercase tracking-widest block mb-2">I am Buyer</span>
                        <p className={`text-[9px] font-medium uppercase tracking-tighter leading-relaxed max-w-[140px] ${formData.roles.includes(UserRole.BUYER) ? 'text-indigo-100' : 'text-slate-400'}`}>Post leads, browse store, start blind negotiations</p>
                     </div>
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, roles: [UserRole.SELLER] })} className={`p-12 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-8 group ${formData.roles.includes(UserRole.SELLER) ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-100'}`}>
                     <div className={`p-6 rounded-[2rem] transition-colors ${formData.roles.includes(UserRole.SELLER) ? 'bg-white/10' : 'bg-emerald-50'}`}><Briefcase size={48} className={formData.roles.includes(UserRole.SELLER) ? 'text-white' : 'text-emerald-600'}/></div>
                     <div className="text-center">
                        <span className="text-[11px] font-black uppercase tracking-widest block mb-2">I am Seller</span>
                        <p className={`text-[9px] font-medium uppercase tracking-tighter leading-relaxed max-w-[140px] ${formData.roles.includes(UserRole.SELLER) ? 'text-emerald-100' : 'text-slate-400'}`}>Manage inventory, submit quotes, set service radius</p>
                     </div>
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Primary Email Identity</label>
                     <div className="flex gap-3">
                       <input type="email" required placeholder="identity@registry.com" className="flex-1 px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white shadow-inner transition-all" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                       {!otpVerified && (
                         <button type="button" onClick={simulateOtp} className="px-6 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Verify</button>
                       )}
                       {otpVerified && <div className="px-6 bg-emerald-500 text-white rounded-2xl flex items-center justify-center"><CheckCircle2 size={18}/></div>}
                     </div>
                     {otpSent && (
                       <div className="flex gap-3 mt-3 animate-in slide-in-from-top-2">
                         <input type="text" placeholder="Enter OTP" className="flex-1 px-6 py-3 bg-white border border-indigo-200 rounded-xl font-bold text-sm" value={otpValue} onChange={e => setOtpValue(e.target.value)} />
                         <button type="button" onClick={verifyOtp} className="px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Submit</button>
                       </div>
                     )}
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Access Passkey</label>
                     <input type="password" required placeholder="••••••••" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white shadow-inner transition-all" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                  </div>
               </div>

               <div className="flex justify-between items-center pt-8">
                  <button type="button" onClick={onBackToLogin} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Abort Onboarding</button>
                  <button type="button" onClick={handleNext} className="px-14 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 active:scale-95 transition-all">Next Module <ArrowRight size={20}/></button>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
               <div className="text-center">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Personal Audit Details</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Physical Identification & Structured Address</p>
               </div>

               <div className="flex flex-col items-center gap-8">
                  <div className="relative group">
                     <div className={`w-44 h-44 rounded-[3.5rem] border-2 border-dashed flex items-center justify-center overflow-hidden transition-all bg-slate-50 ${previewProfile ? 'border-indigo-600 shadow-2xl' : 'border-slate-200 hover:border-indigo-400'}`}>
                        {previewProfile ? <img src={previewProfile} className="w-full h-full object-cover" /> : <Camera size={48} className="text-slate-300"/>}
                        <input type="file" accept="image/*" required onChange={e => handleImageChange(e, 'profileImage')} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                     <div className="absolute -bottom-4 right-0 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg"><UploadCloud size={16}/></div>
                     {!previewProfile && <span className="text-[9px] font-black text-slate-400 uppercase absolute -bottom-10 w-full text-center tracking-widest animate-pulse">Mandatory Identity Proof</span>}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Full Legal Name</label>
                     <input type="text" required placeholder="As per Identity Document" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm shadow-inner" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Phone Verification</label>
                     <input type="tel" required placeholder="+91 XXXXX XXXXX" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm shadow-inner" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
               </div>

               <div className="p-12 bg-slate-50 rounded-[3.5rem] border border-slate-100 space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><MapPin size={20}/></div>
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Structured Geospatial Registry</h4>
                  </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-2">House No.</label>
                        <input type="text" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-xs" value={formData.house_no} onChange={e => setFormData({...formData, house_no: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Street</label>
                        <input type="text" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-xs" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Area</label>
                        <input type="text" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-xs" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-2">City</label>
                        <input type="text" placeholder="Ludhiana" required className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-xs" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-2">State</label>
                        <input type="text" placeholder="Punjab" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-xs" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-2">PIN Code</label>
                        <input type="text" placeholder="141001" required className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-xs" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div className="flex justify-between pt-8">
                  <button type="button" onClick={prevStep} className="px-12 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all"><ArrowLeft size={20}/> Back</button>
                  <button type="button" onClick={handleNext} className="px-14 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 active:scale-95 transition-all">Next Module <ArrowRight size={20}/></button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
               <div className="text-center">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Business Compliance</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Company Registry & Service Radius Controls</p>
               </div>

               <div className="p-12 bg-slate-50 rounded-[3.5rem] border border-slate-100 space-y-10">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                     <div className="relative group">
                        <div className={`w-32 h-32 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all bg-white ${previewLogo ? 'border-indigo-600 shadow-xl' : 'border-slate-200'}`}>
                           {previewLogo ? <img src={previewLogo} className="w-full h-full object-cover" /> : <Building size={40} className="text-slate-300"/>}
                           <input type="file" accept="image/*" onChange={e => handleImageChange(e, 'companyLogo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase absolute -bottom-6 w-full text-center">Brand Logo</span>
                     </div>
                     <div className="flex-1 w-full space-y-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-5 tracking-widest">Legal Business Name</label>
                           <input type="text" placeholder="As per GST Records" className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold text-sm shadow-inner" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-5 tracking-widest">GSTIN Protocol (Verified)</label>
                           <input type="text" placeholder="27XXXXXXXXXXXXX" className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold text-sm shadow-inner" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
                        </div>
                     </div>
                  </div>

                  {formData.roles.includes(UserRole.SELLER) && (
                    <div className="pt-6 border-t border-slate-100 space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Globe size={18}/></div>
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Operational Service Radius</h4>
                          </div>
                          <span className="text-lg font-black text-emerald-600">{formData.serviceRadius} km</span>
                       </div>
                       <input type="range" min="10" max="500" step="10" className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" value={formData.serviceRadius} onChange={e => setFormData({...formData, serviceRadius: Number(e.target.value)})} />
                       <p className="text-[9px] text-slate-400 font-bold uppercase text-center">Leads will be auto-delivered within this geospatial perimeter from your City.</p>
                    </div>
                  )}
               </div>

               <div className="p-10 bg-[#0f172a] rounded-[3rem] text-white space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><Gavel size={80}/></div>
                  <div className="flex gap-6 items-start relative z-10">
                    <button type="button" onClick={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })} className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${formData.termsAccepted ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'border-white/20'}`}>
                       {formData.termsAccepted && <CheckCircle2 size={24}/>}
                    </button>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-widest leading-relaxed">Accept Governance Protocol</h4>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 leading-relaxed max-w-[400px]">I consent to platform auditing, blind negotiation integrity, and governance fee structures. Identities remain masked until dual-payment verification.</p>
                    </div>
                  </div>
               </div>

               <div className="flex justify-between pt-8">
                  <button type="button" onClick={prevStep} className="px-12 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all"><ArrowLeft size={20}/> Back</button>
                  <button type="button" onClick={handleSubmit} disabled={loading || !formData.termsAccepted} className="px-16 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest shadow-2xl flex items-center gap-5 disabled:opacity-20 active:scale-95 transition-all">
                     {loading ? <RefreshCw className="animate-spin" size={24}/> : <ShieldCheck size={24}/>} {loading ? "Syncing Registry..." : "Finalize Identity Onboarding"}
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 flex items-center gap-8 text-slate-400 font-bold uppercase text-[9px] tracking-widest opacity-60">
         <div className="flex items-center gap-2"><Lock size={12}/> Secure 256-bit Registry</div>
         <div className="flex items-center gap-2"><Globe size={12}/> National Procurement Standards</div>
         <div className="flex items-center gap-2"><Shield size={12}/> Fraud Mitigation Active</div>
      </div>
    </div>
  );
};

export default Registration;
