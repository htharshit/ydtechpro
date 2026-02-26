
import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, IndianRupee, Clock, ArrowRight, 
  ChevronRight, ShieldCheck, MapPin, Zap, Info, 
  Plus, Edit2, ClipboardList, Package, RefreshCw
} from 'lucide-react';
import { User, Lead, Quote } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  currentUser: User;
  onQuoteSubmitted: () => void;
}

const LeadsPool: React.FC<Props> = ({ currentUser, onQuoteSubmitted }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [radius, setRadius] = useState<number>(50);
  
  // Quote Form State
  const [quoteData, setQuoteData] = useState({
    price: 0,
    gstAmount: 0,
    discount: 0,
    visitRequired: false,
    visitCharges: 0,
    installationRequired: false,
    installationCost: 0,
    otherCharges: 0,
    otherChargesRemark: '',
    deliveryDays: 3,
    installationTime: '2 Hours',
    terms: ''
  });

  useEffect(() => {
    fetchLeads();
  }, [radius]);

  const fetchLeads = async () => {
    setLoading(true);
    // Use user's lat/lng if available, otherwise mock
    const lat = currentUser.lat || 30.901;
    const lng = currentUser.lng || 75.8573;
    const all = await storageService.getLeads(lat, lng, radius);
    setLeads(all.filter(l => l.status === 'OPEN' && l.buyerId !== currentUser.id));
    setLoading(false);
  };

  const handleOpenQuoteForm = (lead: Lead) => {
    setSelectedLead(lead);
    setShowQuoteForm(true);
    setQuoteData({ ...quoteData, price: lead.budget });
  };

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    
    setLoading(true);
    const finalPrice = Number(quoteData.price) + Number(quoteData.gstAmount) + 
                       (quoteData.visitRequired ? Number(quoteData.visitCharges) : 0) + 
                       (quoteData.installationRequired ? Number(quoteData.installationCost) : 0) + 
                       Number(quoteData.otherCharges) - Number(quoteData.discount);
    
    const res = await storageService.submitQuote({
      ...quoteData,
      finalPrice,
      leadId: selectedLead.id,
      vendorName: currentUser.name,
      quoteDetails: {
        productName: selectedLead.requirementName,
        quantity: selectedLead.quantity,
        quotedPrice: quoteData.price,
        discount: quoteData.discount,
        visitRequired: quoteData.visitRequired,
        visitCharges: quoteData.visitCharges,
        installationRequired: quoteData.installationRequired,
        installationCharges: quoteData.installationCost,
        otherCharges: quoteData.otherCharges,
        otherChargesRemark: quoteData.otherChargesRemark,
        deliveryDays: quoteData.deliveryDays,
        installationTime: quoteData.installationTime,
        termsAndConditions: quoteData.terms,
        finalCalculatedPrice: finalPrice,
        gstPercent: 18,
        version: 1
      }
    });

    if (res.status === 'success') {
      alert("Quotation broadcasted successfully.");
      setShowQuoteForm(false);
      onQuoteSubmitted();
    } else {
      alert("Quotation rejected by registry.");
    }
    setLoading(false);
  };

  const filteredLeads = leads.filter(l => 
    l.requirementName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
         <div>
            <h2 className="text-3xl font-black text-slate-900 italic">Open <span className="text-indigo-600">Leads Pool</span></h2>
            <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Global Requirement Registry</p>
         </div>
         
         <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 w-full md:w-64">
               <MapPin size={18} className="text-indigo-500" />
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Radius</span>
                    <span className="text-[10px] font-black text-indigo-600">{radius}km</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="1000" 
                    step="10" 
                    className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600" 
                    value={radius} 
                    onChange={e => setRadius(Number(e.target.value))} 
                  />
               </div>
            </div>

            <div className="relative group w-full md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input type="text" placeholder="Search Requirement, Category..." className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold w-full shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {filteredLeads.map(lead => (
            <div key={lead.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-indigo-200 hover:shadow-xl transition-all shadow-sm">
               <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] border flex items-center justify-center overflow-hidden">
                     {lead.leadImage ? <img src={lead.leadImage} className="w-full h-full object-cover"/> : <Layers size={32} className="text-slate-200"/>}
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{lead.category}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase">#{lead.id.slice(-6)}</span>
                     </div>
                     <h3 className="text-xl font-black text-slate-900 truncate max-w-sm">{lead.requirementName}</h3>
                     <div className="flex gap-4 mt-3">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase"><Clock size={12}/> {new Date(lead.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase"><Package size={12}/> Qty: {lead.quantity}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-8">
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Budget</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{lead.budget.toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleOpenQuoteForm(lead)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                     Submit Quote <ArrowRight size={16}/>
                  </button>
               </div>
            </div>
         ))}

         {filteredLeads.length === 0 && !loading && (
           <div className="py-24 text-center opacity-30 flex flex-col items-center">
              <ClipboardList size={64} className="mb-4" />
              <p className="text-[11px] font-black uppercase tracking-widest">No active leads currently broadcasting</p>
           </div>
         )}
      </div>

      {showQuoteForm && selectedLead && (
         <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
            <div className="w-full max-w-2xl bg-white rounded-[3.5rem] p-12 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
               <button onClick={() => setShowQuoteForm(false)} className="absolute top-10 right-10 text-slate-400 hover:text-rose-500 transition-colors"><Plus size={32} className="rotate-45"/></button>
               
               <h3 className="text-2xl font-black text-slate-900 italic mb-10">Generate <span className="text-indigo-600">Quotation</span></h3>
               
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requirement</p>
                  <p className="text-lg font-black">{selectedLead.requirementName}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mt-2">Target Budget: ₹{selectedLead.budget.toLocaleString()}</p>
               </div>

               <form onSubmit={submitQuote} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Base Item Price</label>
                        <input type="number" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm" value={quoteData.price} onChange={e => setQuoteData({...quoteData, price: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">GST (18%)</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm" value={quoteData.gstAmount} onChange={e => setQuoteData({...quoteData, gstAmount: Number(e.target.value)})} />
                     </div>
                     
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase text-slate-400">Visit Req.</span>
                         <button type="button" onClick={() => setQuoteData({...quoteData, visitRequired: !quoteData.visitRequired})} className={`w-10 h-5 rounded-full relative transition-all ${quoteData.visitRequired ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${quoteData.visitRequired ? 'left-6' : 'left-1'}`}></div>
                         </button>
                       </div>
                       {quoteData.visitRequired && (
                         <input type="number" placeholder="Visit Fee" className="w-full p-2 bg-white border border-slate-100 rounded-lg text-[10px] font-bold" value={quoteData.visitCharges} onChange={e => setQuoteData({...quoteData, visitCharges: Number(e.target.value)})} />
                       )}
                     </div>

                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase text-slate-400">Install Req.</span>
                         <button type="button" onClick={() => setQuoteData({...quoteData, installationRequired: !quoteData.installationRequired})} className={`w-10 h-5 rounded-full relative transition-all ${quoteData.installationRequired ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${quoteData.installationRequired ? 'left-6' : 'left-1'}`}></div>
                         </button>
                       </div>
                       {quoteData.installationRequired && (
                         <input type="number" placeholder="Install Fee" className="w-full p-2 bg-white border border-slate-100 rounded-lg text-[10px] font-bold" value={quoteData.installationCost} onChange={e => setQuoteData({...quoteData, installationCost: Number(e.target.value)})} />
                       )}
                     </div>

                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Other Charges</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm" value={quoteData.otherCharges} onChange={e => setQuoteData({...quoteData, otherCharges: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Discount (₹)</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm" value={quoteData.discount} onChange={e => setQuoteData({...quoteData, discount: Number(e.target.value)})} />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Delivery Days</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm" value={quoteData.deliveryDays} onChange={e => setQuoteData({...quoteData, deliveryDays: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Installation Time</label>
                        <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={quoteData.installationTime} onChange={e => setQuoteData({...quoteData, installationTime: e.target.value})} />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Terms & Delivery Conditions</label>
                     <textarea required className="technical-input-area w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" placeholder="Valid for 7 days, 2 year onsite warranty..." value={quoteData.terms} onChange={e => setQuoteData({...quoteData, terms: e.target.value})} />
                  </div>

                  <div className="pt-6 border-t flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quotation Value</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{(Number(quoteData.price) + Number(quoteData.gstAmount) + (quoteData.visitRequired ? Number(quoteData.visitCharges) : 0) + (quoteData.installationRequired ? Number(quoteData.installationCost) : 0) + Number(quoteData.otherCharges) - Number(quoteData.discount)).toLocaleString()}</p>
                     </div>
                     <button type="submit" disabled={loading} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3">
                        {loading ? <RefreshCw className="animate-spin" size={18}/> : <Zap size={18}/>} Commit Bid
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default LeadsPool;
