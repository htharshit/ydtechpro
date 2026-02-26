import React from 'react';
import { User, Quote, Lead } from '../types';
import { CheckCircle2, ShieldCheck, IndianRupee, MessageSquare, Clock } from 'lucide-react';

interface Props {
  lead: Lead;
  quotes: Quote[];
  onAccept: (quoteId: string) => void;
  onNegotiate: (quoteId: string) => void;
}

const QuoteComparison: React.FC<Props> = ({ lead, quotes, onAccept, onNegotiate }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="text-center">
         <h2 className="text-3xl font-black text-slate-900 italic">Quotation <span className="text-indigo-600">Comparison</span></h2>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Project ID: {lead.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {quotes.map(quote => (
            <div key={quote.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-indigo-300 transition-all flex flex-col">
               <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Bid</p>
                     <h4 className="text-lg font-black text-slate-900">{quote.vendorName}</h4>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100"><ShieldCheck size={24}/></div>
               </div>

               <div className="p-10 flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Final Bid Amount</span>
                     <div className="text-3xl font-black text-slate-900">₹{quote.price.toLocaleString()}</div>
                  </div>
                  <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                     <p className="text-[10px] font-black text-indigo-600 uppercase mb-2 flex items-center gap-2"><Clock size={12}/> Proposal Terms</p>
                     <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{quote.terms}"</p>
                  </div>
               </div>

               <div className="p-8 bg-slate-900 flex flex-col gap-3">
                  <button onClick={() => onAccept(quote.id)} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                     <CheckCircle2 size={16}/> Accept Protocol
                  </button>
                  <button onClick={() => onNegotiate(quote.id)} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                     <MessageSquare size={16}/> Negotiate Bid
                  </button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default QuoteComparison;