
import React, { useState } from 'react';
import { User as UserIcon, Camera, Save, ShieldCheck, Building, Phone, Mail, MapPin, CheckCircle2, UserCheck, RefreshCw, Zap, Briefcase } from 'lucide-react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

const ProfileSettings: React.FC<Props> = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState<User>({ ...currentUser });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestingRole, setRequestingRole] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await storageService.adminUpdateUser(currentUser.id, formData.id, formData);
    if (res.status === 'success' && res.user) {
      setSuccess(true);
      onUpdateUser(res.user);
      setFormData(res.user);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Profile sync failed. Registry may be offline.");
    }
    setSaving(false);
  };

  const handleRoleRequest = async (role: UserRole) => {
    setRequestingRole(true);
    const res = await storageService.adminUpdateUser(currentUser.id, currentUser.id, { pendingRole: role });
    if (res.status === 'success') {
      alert(`Role change request for ${role} submitted to Governance Admin.`);
      onUpdateUser({ ...currentUser, pendingRole: role });
    }
    setRequestingRole(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="h-48 bg-slate-900 relative flex items-end px-12 pb-10">
           <div className="absolute -bottom-16 left-12 p-1 bg-white rounded-[2.5rem] shadow-2xl border-2 border-white">
              <div className="w-36 h-36 bg-slate-100 rounded-[2rem] overflow-hidden flex items-center justify-center group cursor-pointer relative shadow-inner">
                 {formData.profileImage ? (
                   <img src={formData.profileImage} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                     <UserIcon size={56} />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white"><Camera size={32}/></div>
              </div>
           </div>
           <div className="ml-48">
              <h2 className="text-3xl font-black text-white italic tracking-tight">{formData.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${formData.isVerified ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-white/10 border-white/10 text-slate-400'}`}>
                    {formData.isVerified ? 'VERIFIED IDENTITY' : 'PENDING AUDIT'}
                 </span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {formData.id}</span>
              </div>
           </div>
        </div>

        <form onSubmit={handleSave} className="pt-24 p-12 space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner"><Building size={20}/></div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Corporate Protocol</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">Company Identity</label>
                       <input type="text" placeholder="Registered Company Name" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-600 outline-none transition-all" value={formData.companyName || ''} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">GST Ledger ID</label>
                       <input type="text" placeholder="27XXXXXXXXXXXXX" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-600 outline-none transition-all" value={formData.gstNumber || ''} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-inner"><UserCheck size={20}/></div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Concerned Liaison</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">Primary Contact Name</label>
                       <input required type="text" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-600 outline-none transition-all" value={formData.concernedPersonName || ''} onChange={e => setFormData({...formData, concernedPersonName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">Direct Contact Ledger</label>
                       <input required type="tel" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-600 outline-none transition-all" value={formData.concernedPersonContact || ''} onChange={e => setFormData({...formData, concernedPersonContact: e.target.value})} />
                    </div>
                 </div>
              </div>

              {/* STUCTURED ADDRESS BLOCK */}
              <div className="col-span-1 md:col-span-2 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shadow-inner"><MapPin size={20}/></div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Structured Geospatial Registry</h3>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">House / Office No.</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.house_no || ''} onChange={e => setFormData({...formData, house_no: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">Street / Road</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">Landmark</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.landmark || ''} onChange={e => setFormData({...formData, landmark: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">Area / Sector</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.area || ''} onChange={e => setFormData({...formData, area: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">City</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">State / Province</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">Country</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-4 tracking-widest">PIN Code</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.pincode || ''} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                    </div>
                 </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                       <h4 className="text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><Briefcase size={20}/> Role Protocol Migration</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Request an additional governance role</p>
                    </div>
                    {currentUser.pendingRole && (
                      <div className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse border border-amber-200">
                         Audit Pending for {currentUser.pendingRole}
                      </div>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[UserRole.BUYER, UserRole.SELLER, UserRole.TECHNICIAN, UserRole.CLIENT].map(role => {
                       const hasRole = currentUser.roles.includes(role);
                       return (
                         <button 
                           key={role} 
                           type="button" 
                           onClick={() => handleRoleRequest(role)}
                           disabled={hasRole || requestingRole || !!currentUser.pendingRole}
                           className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${hasRole ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl grayscale' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 active:scale-95'}`}
                         >
                            <Zap size={24} className={hasRole ? 'text-white' : 'text-slate-300'}/>
                            <span className="text-[9px] font-black uppercase tracking-widest">{role}</span>
                         </button>
                       );
                    })}
                 </div>
              </div>
           </div>

           <div className="pt-10 border-t border-slate-100 flex items-center justify-end">
              <button disabled={saving} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                 {saving ? <RefreshCw className="animate-spin" size={18}/> : success ? 'Identity Synced!' : 'Synchronize MySQL Profile'} <Save size={18}/>
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
