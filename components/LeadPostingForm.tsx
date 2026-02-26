
import React, { useState, useEffect } from 'react';
import { 
  Package, MapPin, IndianRupee, Camera, Plus, Trash2, 
  Send, Info, Save, Building, User, HelpCircle, 
  ToggleLeft, ToggleRight, ShieldCheck, UploadCloud, AlertCircle
} from 'lucide-react';
import { User as UserType, Lead, LeadStatus, Category, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  currentUser: UserType;
  onSuccess: () => void;
  editingLead?: Lead;
}

const LeadPostingForm: React.FC<Props> = ({ currentUser, onSuccess, editingLead }) => {
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [lead, setLead] = useState<Partial<Lead>>({
    requirementName: '',
    description: '',
    quantity: 1,
    budget: 0,
    category: 'Technical',
    type: 'INDIVIDUAL',
    address: currentUser.address,
    city: currentUser.city,
    gstRequired: false,
    negotiationAllowed: true,
    leadImage: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base = reader.result as string;
        setPreviewImage(base);
        setLead({ ...lead, leadImage: base });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.leadImage) return alert("Lead visual proof (image) is required to prevent fake listings.");
    
    setLoading(true);
    const finalLead: Lead = {
      ...lead,
      id: `LEAD-${Date.now()}`,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      status: LeadStatus.OPEN,
      createdAt: new Date().toISOString()
    } as Lead;

    const res = await storageService.saveLead(finalLead);
    if (res.status === 'success') onSuccess();
    else alert(res.error || "Broadcast failure.");
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl animate-in slide-in-from-bottom-10">
      <div className="flex items-center gap-4 mb-10">
         <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Plus size={28}/></div>
         <div>
            <h2 className="text-2xl font-black text-slate-900 italic">Broadcast <span className="text-indigo-600">Requirement</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Procurement Registry</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Visual Requirement <span className="text-rose-500">* Mandatory</span></label>
                  <div className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group ${previewImage ? 'border-indigo-600' : 'border-slate-200 bg-slate-50'}`}>
                     {previewImage ? (
                        <img src={previewImage} className="w-full h-full object-cover" />
                     ) : (
                        <div className="text-center p-6">
                           <UploadCloud size={40} className="text-slate-300 mx-auto mb-2"/>
                           <p className="text-[9px] font-black text-slate-400 uppercase">Upload Reference/Sample Image</p>
                        </div>
                     )}
                     <input type="file" required accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requirement Title</label>
                  <input required type="text" placeholder="e.g. 50 Units Bulk IP Cameras" className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={lead.requirementName} onChange={e => setLead({...lead, requirementName: e.target.value})} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Budget (₹)</label>
                     <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm" value={lead.budget || ''} onChange={e => setLead({...lead, budget: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                     <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={lead.quantity} onChange={e => setLead({...lead, quantity: Number(e.target.value)})} />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Technical Requirement</label>
                  <textarea required className="technical-input-area w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" placeholder="Provide full specs to get accurate vendor bids..." value={lead.description} onChange={e => setLead({...lead, description: e.target.value})} />
               </div>

               <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">GST Billing Protocol</span>
                     <button type="button" onClick={() => setLead({...lead, gstRequired: !lead.gstRequired})}>
                        {lead.gstRequired ? <ToggleRight size={28} className="text-indigo-400"/> : <ToggleLeft size={28} className="text-slate-600"/>}
                     </button>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Negotiation Protocol</span>
                     <button type="button" onClick={() => setLead({...lead, negotiationAllowed: !lead.negotiationAllowed})}>
                        {lead.negotiationAllowed ? <ToggleRight size={28} className="text-indigo-400"/> : <ToggleLeft size={28} className="text-slate-600"/>}
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4">
            <AlertCircle size={24} className="text-rose-500 shrink-0"/>
            <p className="text-[10px] text-rose-800 font-bold uppercase leading-relaxed">
               Governance Check: Requirements missing clear visual evidence or technical details will be automatically hidden from the Store Registry after 24 hours.
            </p>
         </div>

         <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
            {loading ? 'Transmitting Registry...' : 'Commit Lead Broadcast'}
         </button>
      </form>
    </div>
  );
};

export default LeadPostingForm;
