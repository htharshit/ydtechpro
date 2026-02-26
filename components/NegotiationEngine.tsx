
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, ShieldCheck, CreditCard, Lock, 
  RefreshCw, Info, Zap, User as UserIcon, 
  Building, Mail, Phone, ExternalLink, 
  ShieldAlert, CheckCircle2, ArrowRight,
  Clock, Package, FileText, AlertCircle,
  ChevronRight, Send, IndianRupee, Plus,
  Minus, X, Paperclip, Check, ChevronDown,
  ChevronUp, History, Download, Eye
} from 'lucide-react';
import { User, Negotiation, NegotiationStatus, Message, Lead, Order, OrderStatus } from '../types';
import { storageService } from '../services/storageService';
import { razorpayService } from '../services/razorpayService';
import { io, Socket } from 'socket.io-client';

interface Props {
  currentUser: User;
  negotiation: Negotiation;
  onUpdate: () => void;
}

const NegotiationEngine: React.FC<Props> = ({ currentUser, negotiation, onUpdate }) => {
  const [offer, setOffer] = useState<number>(negotiation.currentOffer);
  const [messageText, setMessageText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [identities, setIdentities] = useState<{buyer?: User, seller?: User}>({});
  const [leadDetails, setLeadDetails] = useState<Lead | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBuyer = currentUser.id === negotiation.buyerId;
  const isSeller = currentUser.id === negotiation.sellerId;
  const identitiesUnlocked = negotiation.status === NegotiationStatus.ADMIN_VERIFIED || negotiation.status === NegotiationStatus.FINALIZED;

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    productName: '',
    quantity: 1,
    quotedPrice: 0,
    discount: 0,
    visitRequired: false,
    visitCharges: 0,
    visitNotes: '',
    installationRequired: false,
    installationCharges: 0,
    installationNotes: '',
    otherCharges: 0,
    otherChargesRemark: '',
    deliveryDays: 3,
    installationTime: '2 Hours',
    termsAndConditions: 'Standard warranty applied. Subject to site readiness.',
    gstPercent: 18,
    notes: '',
    attachment: null as File | null
  });

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.emit('join_negotiation', negotiation.id);

    newSocket.on('new_message', (message: Message) => {
      onUpdate(); // Refresh data when new message arrives
    });

    return () => {
      newSocket.disconnect();
    };
  }, [negotiation.id]);

  useEffect(() => {
    if (identitiesUnlocked) {
      fetchUnlockedIdentities();
    }
    fetchLeadDetails();
  }, [identitiesUnlocked, negotiation.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [negotiation.messages]);

  useEffect(() => {
    if (leadDetails) {
      setQuoteForm(prev => ({
        ...prev,
        productName: leadDetails.requirementName,
        quantity: leadDetails.quantity || 1,
        quotedPrice: leadDetails.budget || 0
      }));
    }
  }, [leadDetails]);

  const fetchLeadDetails = async () => {
    const leads = await storageService.getLeads();
    const lead = leads.find(l => l.id === negotiation.entityId);
    if (lead) setLeadDetails(lead);
  };

  const fetchUnlockedIdentities = async () => {
    const allUsers = await storageService.getUsers();
    setIdentities({
      buyer: allUsers.find(u => u.id === negotiation.buyerId),
      seller: allUsers.find(u => u.id === negotiation.sellerId)
    });
  };

  const calculateFinalPrice = () => {
    const base = quoteForm.quotedPrice * quoteForm.quantity;
    const extras = (quoteForm.visitRequired ? quoteForm.visitCharges : 0) + 
                   (quoteForm.installationRequired ? quoteForm.installationCharges : 0) + 
                   quoteForm.otherCharges;
    const afterDiscount = (base + extras) - quoteForm.discount;
    const gst = (afterDiscount * quoteForm.gstPercent) / 100;
    return afterDiscount + gst;
  };

  const handleSendQuote = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const finalPrice = calculateFinalPrice();
    const version = negotiation.messages.filter(m => m.isQuote).length + 1;

    const newMessage: Message = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: quoteForm.notes || `Formalized Quote v${version} submitted.`,
      timestamp: new Date().toISOString(),
      isQuote: true,
      quoteDetails: {
        productName: quoteForm.productName,
        quantity: quoteForm.quantity,
        quotedPrice: quoteForm.quotedPrice,
        discount: quoteForm.discount,
        visitRequired: quoteForm.visitRequired,
        visitCharges: quoteForm.visitCharges,
        visitNotes: quoteForm.visitNotes,
        installationRequired: quoteForm.installationRequired,
        installationCharges: quoteForm.installationCharges,
        installationNotes: quoteForm.installationNotes,
        otherCharges: quoteForm.otherCharges,
        otherChargesRemark: quoteForm.otherChargesRemark,
        deliveryDays: quoteForm.deliveryDays,
        installationTime: quoteForm.installationTime,
        termsAndConditions: quoteForm.termsAndConditions,
        finalCalculatedPrice: finalPrice,
        gstPercent: quoteForm.gstPercent,
        version: version
      }
    };

    const updatedNeg = {
      ...negotiation,
      status: NegotiationStatus.COUNTER_OFFERED,
      currentOffer: finalPrice,
      messages: [...negotiation.messages, newMessage]
    };

    const res = await storageService.startNegotiation(updatedNeg);
    if (res.status === 'success') {
      socket?.emit('send_message', { negotiationId: negotiation.id, message: newMessage });
      setShowQuoteModal(false);
      onUpdate();
    }
    setIsProcessing(false);
  };

  const handleSendMessage = async () => {
    if (!messageText || isProcessing) return;
    setIsProcessing(true);

    const newMessage: Message = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: messageText,
      timestamp: new Date().toISOString()
    };

    const updatedNeg = {
      ...negotiation,
      messages: [...negotiation.messages, newMessage]
    };

    const res = await storageService.startNegotiation(updatedNeg);
    if (res.status === 'success') {
      socket?.emit('send_message', { negotiationId: negotiation.id, message: newMessage });
      setMessageText('');
      onUpdate();
    }
    setIsProcessing(false);
  };

  const handlePayGovernanceFee = async () => {
    if (isProcessing) return;
    
    const tempOrder: Order = {
      id: `GOV-${negotiation.id}-${Date.now()}`,
      status: OrderStatus.PAYMENT_PENDING,
      serviceName: `Governance Fee - ${leadDetails?.requirementName || 'Negotiation'}`,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      budget: 25,
      finalPrice: 25,
      phone: currentUser.phone || '',
      createdAt: new Date().toISOString(),
      paymentStatus: 'PENDING'
    };

    razorpayService.openCheckout(tempOrder, currentUser, async (paymentId) => {
      setIsProcessing(true);
      try {
        const newStatus = isBuyer ? NegotiationStatus.BUYER_PAYMENT_DONE : NegotiationStatus.SELLER_PAYMENT_DONE;
        
        // If the other party already paid, we might go to ADMIN_VERIFIED or just stay at PAYMENT_DONE
        // For simplicity in this demo, we'll just update the status
        const updatedNeg = {
          ...negotiation,
          status: newStatus,
          messages: [...negotiation.messages, {
            id: `MSG-PAY-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            text: `Protocol Directive: ${isBuyer ? 'Buyer' : 'Seller'} has paid the governance fee.`,
            timestamp: new Date().toISOString()
          }]
        };

        const res = await storageService.startNegotiation(updatedNeg);
        if (res.status === 'success') {
          onUpdate();
          socket?.emit('send_message', { negotiationId: negotiation.id, message: updatedNeg.messages[updatedNeg.messages.length - 1] });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    });
  };
  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const newMessage: Message = {
      id: `MSG-ACC-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: "Protocol Directive: PROPOSAL ACCEPTED. Governance fees required to unlock identities.",
      timestamp: new Date().toISOString()
    };

    const updatedNeg = {
      ...negotiation,
      status: NegotiationStatus.ACCEPTED,
      messages: [...negotiation.messages, newMessage]
    };

    const res = await storageService.startNegotiation(updatedNeg);
    if (res.status === 'success') {
      socket?.emit('send_message', { negotiationId: negotiation.id, message: newMessage });
      onUpdate();
    }
    setIsProcessing(false);
  };

  const stats = {
    rounds: negotiation.messages.filter(m => m.isQuote).length,
    bestOffer: negotiation.currentOffer,
    startTime: new Date(negotiation.createdAt).toLocaleDateString(),
    governanceStatus: negotiation.status === NegotiationStatus.ACCEPTED ? 'Awaiting Fees' : 
                     negotiation.status === NegotiationStatus.BUYER_PAYMENT_DONE ? 'Buyer Paid' :
                     negotiation.status === NegotiationStatus.SELLER_PAYMENT_DONE ? 'Seller Paid' :
                     negotiation.status === NegotiationStatus.ADMIN_VERIFIED ? 'Unlocked' : 'Negotiating'
  };

  const getPseudonym = (userId: string) => {
    if (identitiesUnlocked) {
      const user = userId === negotiation.buyerId ? identities.buyer : identities.seller;
      return user?.name || `User_${userId.slice(-4)}`;
    }
    return userId === negotiation.buyerId ? `Buyer_#${userId.slice(-4)}` : `Seller_#${userId.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl flex h-[850px] overflow-hidden animate-in zoom-in duration-700 relative">
      {/* LEFT SIDEBAR: Context Panel */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-80'} border-r border-slate-100 bg-slate-50/50 flex flex-col transition-all duration-300`}>
        <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText size={20} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest">Context</h3>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
            {sidebarCollapsed ? <ChevronRight size={20} /> : <X size={20} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fixed Details</h4>
              <div className="space-y-3">
                <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Item Name</p>
                  <p className="text-xs font-bold text-slate-900">{leadDetails?.requirementName || 'Loading...'}</p>
                </div>
                <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Quantity</p>
                  <p className="text-xs font-bold text-slate-900">{leadDetails?.quantity || 1} Units</p>
                </div>
                {isSeller && (
                  <div className="p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm">
                    <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Buyer Budget Ceiling</p>
                    <p className="text-xs font-bold text-indigo-600">₹{leadDetails?.budget?.toLocaleString() || '---'}</p>
                  </div>
                )}
                <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">GST Required</p>
                    <p className="text-xs font-bold text-slate-900">{leadDetails?.gstRequired ? 'Yes' : 'No'}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${leadDetails?.gstRequired ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={14} />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachments</h4>
              <div className="p-4 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Locked until governance</p>
              </div>
            </section>
          </div>
        )}
      </aside>

      {/* CENTRAL PANEL: Chat/Exchange Area */}
      <main className="flex-1 flex flex-col bg-white relative">
        {/* Header */}
        <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 italic">Blind <span className="text-indigo-600">Negotiation</span></h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Identities Masked • Secure Exchange
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
              identitiesUnlocked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600 animate-pulse-amber'
            }`}>
              {negotiation.status.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Messages View */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/30 custom-scrollbar">
          <div className="flex justify-center mb-8">
            <div className="px-8 py-3 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center gap-3">
              <Lock size={14} className="text-indigo-400" />
              Governance Protocol Active
            </div>
          </div>

          <AnimatePresence initial={false}>
            {negotiation.messages.map((m, idx) => {
              const isMe = m.senderId === currentUser.id;
              const isProtocol = m.text.includes('Protocol Directive');
              
              return (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {isProtocol ? (
                    <div className="w-full flex justify-center my-6">
                      <div className="px-6 py-2 bg-white border border-slate-100 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm">
                        {m.text}
                      </div>
                    </div>
                  ) : m.isQuote ? (
                    <div className={`max-w-[85%] w-full ${isMe ? 'pl-20' : 'pr-20'}`}>
                      <div className={`p-8 rounded-[3rem] border-2 shadow-2xl transition-all hover:scale-[1.01] ${
                        isMe ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-100 text-slate-900'
                      }`}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full ${isMe ? 'bg-white/10' : 'bg-indigo-50 text-indigo-600'}`}>
                              Quote v{m.quoteDetails?.version}
                            </span>
                            <h4 className="text-xl font-black mt-3">{m.quoteDetails?.productName}</h4>
                          </div>
                          <div className="text-right">
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>Final Price</p>
                            <p className="text-3xl font-black italic">₹{m.quoteDetails?.finalCalculatedPrice.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                          <div className={`p-4 rounded-2xl ${isMe ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <p className={`text-[8px] font-black uppercase mb-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>Base Price x Qty</p>
                            <p className="text-xs font-bold">₹{m.quoteDetails?.quotedPrice.toLocaleString()} x {m.quoteDetails?.quantity}</p>
                          </div>
                          <div className={`p-4 rounded-2xl ${isMe ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <p className={`text-[8px] font-black uppercase mb-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>Extras (Visit/Install/Other)</p>
                            <p className="text-xs font-bold">₹{((m.quoteDetails?.visitCharges || 0) + (m.quoteDetails?.installationCharges || 0) + (m.quoteDetails?.otherCharges || 0)).toLocaleString()}</p>
                          </div>
                          <div className={`p-4 rounded-2xl ${isMe ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <p className={`text-[8px] font-black uppercase mb-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>Discount Applied</p>
                            <p className="text-xs font-bold text-rose-400">-₹{m.quoteDetails?.discount.toLocaleString()}</p>
                          </div>
                          <div className={`p-4 rounded-2xl ${isMe ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <p className={`text-[8px] font-black uppercase mb-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>Delivery & Install Time</p>
                            <p className="text-xs font-bold">{m.quoteDetails?.deliveryDays} Days / {m.quoteDetails?.installationTime}</p>
                          </div>
                        </div>

                        {m.quoteDetails?.termsAndConditions && (
                          <div className={`p-4 rounded-2xl mb-6 text-[9px] font-bold uppercase tracking-tight ${isMe ? 'bg-white/5 text-indigo-100' : 'bg-slate-50 text-slate-500'}`}>
                            T&C: {m.quoteDetails.termsAndConditions}
                          </div>
                        )}

                        {m.text && (
                          <div className={`p-5 rounded-2xl mb-8 text-xs italic leading-relaxed ${isMe ? 'bg-white/10' : 'bg-slate-50'}`}>
                            "{m.text}"
                          </div>
                        )}

                        <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${m.quoteDetails?.visitRequired ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Visit {m.quoteDetails?.visitRequired ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${m.quoteDetails?.installationRequired ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Install {m.quoteDetails?.installationRequired ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 mt-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${isMe ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                          {getPseudonym(m.senderId).charAt(0)}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {getPseudonym(m.senderId)} • {new Date(m.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`max-w-[70%] p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm border ${
                        isMe ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' : 'bg-white border-slate-100 text-slate-700 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                      <div className="flex items-center gap-2 mt-3 px-2">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                          {getPseudonym(m.senderId)} • {new Date(m.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-slate-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setShowQuoteModal(true)}
              className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center shadow-inner hover:bg-indigo-100 transition-all active:scale-95 group"
            >
              <Plus size={20} />
              <span className="text-[8px] font-black uppercase mt-1">Quote</span>
            </button>
            <div className="flex-1 relative">
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                {!identitiesUnlocked && (
                  <div className="bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full border border-slate-100 flex items-center gap-2 shadow-sm">
                    <Lock size={10} className="text-amber-500" />
                    <span className="text-[8px] font-black uppercase text-slate-400">Pay Governance Fee to Unlock Chat</span>
                  </div>
                )}
              </div>
              <input 
                type="text" 
                placeholder={identitiesUnlocked ? "Type professional message..." : "Chat locked - Submit Quote instead"} 
                disabled={!identitiesUnlocked}
                className={`w-full pl-8 pr-20 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner ${!identitiesUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!messageText || isProcessing || !identitiesUnlocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-20 z-30"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Summary & Actions */}
      <aside className="w-80 border-l border-slate-100 bg-slate-50/50 flex flex-col">
        <div className="p-8 border-b border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Negotiation Summary</h4>
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><IndianRupee size={40}/></div>
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Current Best Offer</p>
              <p className="text-3xl font-black text-indigo-600 italic">₹{stats.bestOffer.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Rounds</p>
                <p className="text-xl font-black text-slate-900">{stats.rounds}</p>
              </div>
              <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Time</p>
                <p className="text-xl font-black text-slate-900">2h</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Actions</h4>
            
            {(negotiation.status === NegotiationStatus.STARTED || negotiation.status === NegotiationStatus.COUNTER_OFFERED) && (
              <div className="space-y-4">
                <button 
                  onClick={() => setShowQuoteModal(true)}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <Zap size={18} /> Send Counter Quote
                </button>
                <button 
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  <CheckCircle2 size={18} /> Accept Final Quote
                </button>
              </div>
            )}

            {negotiation.status === NegotiationStatus.ACCEPTED && (
              <div className="p-8 bg-indigo-600 rounded-[3rem] text-white text-center space-y-6 shadow-2xl shadow-indigo-200 animate-in zoom-in">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
                  <CreditCard size={32} />
                </div>
                <div>
                  <h5 className="text-xl font-black leading-tight">Governance Fee</h5>
                  <p className="text-[9px] font-bold text-indigo-200 uppercase mt-2">Pay ₹25 to reveal {isBuyer ? 'Seller' : 'Buyer'} details.</p>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-white w-1/2 h-full"></div>
                </div>
                <button 
                  onClick={handlePayGovernanceFee}
                  disabled={isProcessing}
                  className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
                >
                  Pay via Razorpay
                </button>
              </div>
            )}

            {identitiesUnlocked && (
              <div className="p-8 bg-slate-900 rounded-[3rem] text-white text-center space-y-6 shadow-2xl animate-in zoom-in">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
                  <ShieldCheck size={32} className="text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-xl font-black leading-tight">Identity Unlocked</h5>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Full profile access granted.</p>
                </div>
                <button className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all active:scale-95">
                  View Full Profile
                </button>
              </div>
            )}
          </section>

          <section className="pt-8 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <ShieldAlert size={16} className="text-rose-500" />
              <p className="text-[8px] font-black text-rose-600 uppercase leading-relaxed">Dispute? Request Admin Review</p>
            </div>
            <button className="w-full py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-rose-500 hover:border-rose-100 transition-all">
              Withdraw Negotiation
            </button>
          </section>
        </div>
      </aside>

      {/* QUOTE MODAL */}
      <AnimatePresence>
        {showQuoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuoteModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Submit <span className="text-indigo-200">Counter Quote</span></h3>
                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mt-1">Formalized Negotiation Card</p>
                  </div>
                </div>
                <button onClick={() => setShowQuoteModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Product/Service</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm"
                      value={quoteForm.productName}
                      onChange={e => setQuoteForm({...quoteForm, productName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Quantity</label>
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-2">
                      <button onClick={() => setQuoteForm({...quoteForm, quantity: Math.max(1, quoteForm.quantity - 1)})} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600"><Minus size={16}/></button>
                      <span className="flex-1 text-center font-black text-sm">{quoteForm.quantity}</span>
                      <button onClick={() => setQuoteForm({...quoteForm, quantity: quoteForm.quantity + 1})} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600"><Plus size={16}/></button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Quoted Price (Base)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="number" 
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm"
                        value={quoteForm.quotedPrice}
                        onChange={e => setQuoteForm({...quoteForm, quotedPrice: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Discount (INR)</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm"
                      value={quoteForm.discount}
                      onChange={e => setQuoteForm({...quoteForm, discount: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Visit Required</h5>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">On-site inspection</p>
                      </div>
                      <button 
                        onClick={() => setQuoteForm({...quoteForm, visitRequired: !quoteForm.visitRequired})}
                        className={`w-12 h-6 rounded-full transition-all relative ${quoteForm.visitRequired ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${quoteForm.visitRequired ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                    {quoteForm.visitRequired && (
                      <input 
                        type="number" 
                        placeholder="Visit Charges (INR)"
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold"
                        value={quoteForm.visitCharges}
                        onChange={e => setQuoteForm({...quoteForm, visitCharges: Number(e.target.value)})}
                      />
                    )}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Installation</h5>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Setup & Configuration</p>
                      </div>
                      <button 
                        onClick={() => setQuoteForm({...quoteForm, installationRequired: !quoteForm.installationRequired})}
                        className={`w-12 h-6 rounded-full transition-all relative ${quoteForm.installationRequired ? 'bg-emerald-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${quoteForm.installationRequired ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                    {quoteForm.installationRequired && (
                      <input 
                        type="number" 
                        placeholder="Install Charges (INR)"
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold"
                        value={quoteForm.installationCharges}
                        onChange={e => setQuoteForm({...quoteForm, installationCharges: Number(e.target.value)})}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Other Charges</label>
                      <input 
                        type="number" 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm"
                        value={quoteForm.otherCharges}
                        onChange={e => setQuoteForm({...quoteForm, otherCharges: Number(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Other Charges Remark</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Logistics, Packaging"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm"
                        value={quoteForm.otherChargesRemark}
                        onChange={e => setQuoteForm({...quoteForm, otherChargesRemark: e.target.value})}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Delivery Days</label>
                      <input 
                        type="number" 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm"
                        value={quoteForm.deliveryDays}
                        onChange={e => setQuoteForm({...quoteForm, deliveryDays: Number(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Installation Time</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 4 Hours, 1 Day"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm"
                        value={quoteForm.installationTime}
                        onChange={e => setQuoteForm({...quoteForm, installationTime: e.target.value})}
                      />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Terms & Conditions</label>
                  <textarea 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-sm outline-none focus:bg-white min-h-[80px]"
                    placeholder="Specify warranty, validity, etc..."
                    value={quoteForm.termsAndConditions}
                    onChange={e => setQuoteForm({...quoteForm, termsAndConditions: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Additional Notes</label>
                  <textarea 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-sm outline-none focus:bg-white min-h-[100px]"
                    placeholder="Specify terms, warranty, or delivery details..."
                    value={quoteForm.notes}
                    onChange={e => setQuoteForm({...quoteForm, notes: e.target.value})}
                  />
                </div>

                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex justify-between items-center">
                  <div>
                    <h5 className="text-sm font-black uppercase tracking-widest text-indigo-900">Final Calculated Price</h5>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1">Includes {quoteForm.gstPercent}% GST & Discounts</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-indigo-600 italic">₹{calculateFinalPrice().toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handleSendQuote}
                  disabled={isProcessing}
                  className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <ShieldCheck size={24}/>}
                  Broadcast Formal Quote
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NegotiationEngine;
