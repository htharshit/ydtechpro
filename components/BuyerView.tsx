import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Clock, ChevronRight, Package, ArrowLeft, Layers, MessageSquare, ShieldAlert, Edit2, Zap, ShieldCheck, IndianRupee, CreditCard } from 'lucide-react';
import { User, Lead, LeadStatus, Quote, Negotiation, NegotiationStatus, Order, OrderStatus } from '../types';
import { storageService } from '../services/storageService';
import { razorpayService } from '../services/razorpayService';
import LeadPostingForm from './LeadPostingForm';
import QuoteComparison from './QuoteComparison';
import NegotiationEngine from './NegotiationEngine';

interface Props {
  currentUser: User;
  isGuest?: boolean;
  onLoginRequired?: () => void;
}

const BuyerView: React.FC<Props> = ({ currentUser, isGuest, onLoginRequired }) => {
  const [view, setView] = useState<'leads' | 'post' | 'compare' | 'edit' | 'negotiate'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const [allLeads, allNegs] = await Promise.all([
      storageService.getLeads(),
      storageService.getNegotiations(currentUser.id)
    ]);
    setLeads(allLeads.filter(l => l.buyerId === currentUser.id));
    setNegotiations(allNegs);
    setLoading(false);
  };

  const handleStartNeg = async (lead: Lead) => {
     if (isGuest && onLoginRequired) {
       onLoginRequired();
       return;
     }
     setError(null);
     const res = await storageService.startNegotiation({
        entityId: lead.id,
        entityType: 'LEAD',
        buyerId: currentUser.id,
        sellerId: 'system_broadcast',
        currentOffer: lead.budget || 0
     });
     
     if (res.status === 'success') {
        refreshData();
     } else {
        setError("Failed to initiate negotiation protocol.");
        setTimeout(() => setError(null), 5000);
     }
  };

  const handleFinalPay = async (lead: Lead) => {
    if (isGuest && onLoginRequired) {
      onLoginRequired();
      return;
    }
    const amount = lead.budget || 0;
    if (amount <= 0) return alert("Final price must be established before payment.");

    const order: Order = {
      id: `ORD-${Date.now()}`,
      status: OrderStatus.PAYMENT_PENDING,
      serviceName: lead.requirementName,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      budget: amount,
      finalPrice: amount,
      phone: currentUser.phone,
      address: currentUser.address,
      city: currentUser.city,
      createdAt: new Date().toISOString(),
      paymentStatus: 'PENDING' as any
    };

    razorpayService.openCheckout(order, currentUser, async (paymentId) => {
      // Moves lead status to FINALIZING per instructions
      await storageService.saveLead({ ...lead, status: LeadStatus.FINALIZED });
      alert(`Payment Successful: ${paymentId}. Requirement moved to FINALIZING.`);
      refreshData();
    });
  };

  const openNegotiation = (neg: Negotiation) => {
    setSelectedNegotiation(neg);
    setView('negotiate');
  };

  return (
    <div className="space-y-10">
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 animate-in shake">
           <ShieldAlert className="text-rose-600" size={24}/>
           <p className="text-[11px] font-black text-rose-700 uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-black text-slate-900 italic">Procurement <span className="text-indigo-600">Portfolio</span></h2>
            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Active Leads & Multi-Vendor Bids</p>
         </div>
         {view === 'leads' ? (
           <button onClick={() => { if (isGuest && onLoginRequired) onLoginRequired(); else setView('post'); }} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all"><PlusCircle size={20}/> Post New Lead</button>
         ) : (
           <button onClick={() => { setView('leads'); setSelectedLead(null); refreshData(); }} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-all"><ArrowLeft size={16}/> Return to List</button>
         )}
      </div>

      {view === 'negotiate' && selectedNegotiation && (
        <NegotiationEngine 
          currentUser={currentUser} 
          negotiation={selectedNegotiation} 
          onUpdate={() => { setView('leads'); refreshData(); }} 
        />
      )}
      
      {(view === 'post' || view === 'edit') && (
        <LeadPostingForm 
          currentUser={currentUser} 
          onSuccess={() => { setView('leads'); refreshData(); }} 
          editingLead={selectedLead || undefined}
        />
      )}

      {view === 'leads' && (
        <div className="space-y-12">
          {negotiations.length > 0 && (
             <section className="space-y-6">
                <div className="flex items-center gap-3">
                   <Zap size={20} className="text-indigo-600 animate-pulse"/>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Negotiation Bucket</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {negotiations.map(neg => (
                      <div key={neg.id} onClick={() => openNegotiation(neg)} className="p-6 bg-indigo-600 text-white rounded-[2.5rem] shadow-xl cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><MessageSquare size={80}/></div>
                         <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase">{neg.status}</span>
                            <span className="text-[10px] font-bold text-indigo-200">#{neg.id.slice(0,8)}</span>
                         </div>
                         <h4 className="text-xl font-black mb-1">Negotiation with Vendor</h4>
                         <p className="text-[11px] font-bold text-indigo-100 uppercase italic">Current Bid: ₹{neg.currentOffer.toLocaleString()}</p>
                         <div className="mt-6 flex justify-end"><ChevronRight size={20}/></div>
                      </div>
                   ))}
                </div>
             </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <Layers size={20} className="text-slate-400"/>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Open Requirements</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {leads.map(lead => (
                  <div key={lead.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-indigo-200 hover:shadow-xl transition-all shadow-sm">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] border flex items-center justify-center text-slate-300 group-hover:text-indigo-400 transition-colors">
                           <Layers size={32} />
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className={`px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${lead.status === LeadStatus.OPEN ? 'bg-indigo-50 text-indigo-600' : lead.status === LeadStatus.NEGOTIATING ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{lead.status}</span>
                              <span className="text-[10px] font-black text-slate-300 uppercase">#{lead.id.slice(-6)}</span>
                           </div>
                           <h3 className="text-xl font-black text-slate-900 truncate max-w-xs">{lead.requirementName}</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-2"><Clock size={12}/> Posted: {new Date(lead.createdAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="text-right mr-6">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Budget</p>
                           <div className="text-2xl font-black text-slate-900">₹{(lead.budget || 0).toLocaleString()}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                           <button onClick={() => handleStartNeg(lead)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                              <MessageSquare size={14}/> Negotiate
                           </button>
                           <button onClick={() => handleFinalPay(lead)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                              <CreditCard size={14}/> Final & Pay
                           </button>
                        </div>
                        <button onClick={() => setView('edit')} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all"><Edit2 size={16}/></button>
                     </div>
                  </div>
               ))}
               {leads.length === 0 && (
                  <div className="py-20 text-center opacity-20 flex flex-col items-center">
                     <ShieldCheck size={64} className="mb-4" />
                     <p className="text-xs font-black uppercase tracking-widest">No requirements on record.</p>
                  </div>
               )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default BuyerView;