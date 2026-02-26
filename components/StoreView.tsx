
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Search, ChevronRight, X, Zap, Layers, Clock, 
  ArrowRight, Filter, MessageSquare, ShieldAlert, Trash2, Plus, 
  Minus, CheckCircle2, Box, Info, Tag, Calendar, MapPin, SlidersHorizontal,
  Star, LayoutGrid, List, RefreshCw, Users
} from 'lucide-react';
import { Product, User, AvailabilityType, Order, OrderStatus, Lead, UserRole, Service } from '../types';
import { storageService } from '../services/storageService';
import { razorpayService } from '../services/razorpayService';

interface Props {
  currentUser?: User;
  onLoginRequired: () => void;
  onNegotiate: (item: any) => void;
}

const StoreView: React.FC<Props> = ({ currentUser, onLoginRequired, onNegotiate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'leads' | 'products' | 'services' | 'vendors'>('leads');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [radius, setRadius] = useState<number>(50);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [vendors, setVendors] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const categories = ['CCTV', 'Networking', 'IT Support', 'Security', 'Hardware', 'Digital'];

  useEffect(() => {
    fetchData();
  }, [activeTab, radius]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const lat = currentUser?.lat || 30.901;
      const lng = currentUser?.lng || 75.8573;
      
      if (activeTab === 'products') {
        const p = await storageService.getProducts();
        setProducts(p || []);
      } else if (activeTab === 'leads') {
        const l = await storageService.getLeads(lat, lng, radius);
        setLeads((l || []).filter(item => item.status === 'OPEN'));
      } else if (activeTab === 'services') {
        const s = await storageService.getServices();
        setServices(s || []);
      } else if (activeTab === 'vendors') {
        const u = await storageService.getUsers();
        setVendors((u || []).filter(user => user.roles.includes(UserRole.SELLER)));
      }
    } catch (e) {
      console.error("Registry fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectBuy = (item: any) => {
    if (!currentUser) return onLoginRequired();
    
    const tempOrder: Order = {
      id: `DIR-${Date.now()}`,
      status: OrderStatus.PAYMENT_PENDING,
      serviceName: item.name || item.requirementName,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      budget: 25,
      finalPrice: 25,
      phone: currentUser.phone || '',
      createdAt: new Date().toISOString(),
      paymentStatus: 'PENDING'
    };

    razorpayService.openCheckout(tempOrder, currentUser, (paymentId) => {
      alert(`Governance Locked! Payment ${paymentId} received. Verification pending by Admin.`);
    });
  };

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (p.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getProductImage = (img?: string) => {
    if (!img) return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400';
    if (img.startsWith('/')) return img; // Use relative path
    return img;
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      {/* Search and Filters Shell */}
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col gap-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-1">
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Market <span className="text-indigo-600 italic">Registry</span></h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Enterprise Faceted Procurement Catalog</p>
            </div>
            <div className="flex items-center gap-4 p-2 bg-slate-50 rounded-3xl border border-slate-100 overflow-x-auto max-w-full no-scrollbar">
               {[
                 { id: 'leads', label: 'Leads', icon: <Zap size={14}/> },
                 { id: 'products', label: 'Products', icon: <Box size={14}/> },
                 { id: 'services', label: 'Services', icon: <RefreshCw size={14}/> },
                 { id: 'vendors', label: 'Vendors', icon: <Users size={14}/> }
               ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
               <input 
                 type="text" 
                 placeholder="Search Brands, Technical Specifications, Model Numbers..." 
                 className="pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold shadow-inner outline-none focus:border-indigo-600 focus:bg-white transition-all w-full" 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
               />
            </div>
            <div className="lg:col-span-6 flex flex-wrap md:flex-nowrap items-center gap-4">
               <div className="flex-1 flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-[2rem] border border-slate-100">
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
               <select 
                 className="flex-1 p-5.5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-[10px] uppercase tracking-widest outline-none focus:border-indigo-600 shadow-sm"
                 value={selectedCategory}
                 onChange={e => setSelectedCategory(e.target.value)}
               >
                 <option value="all">Categories</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-300'}`}><LayoutGrid size={18}/></button>
                  <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-300'}`}><List size={18}/></button>
               </div>
            </div>
         </div>
      </div>

      {activeTab === 'products' && (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-6 md:gap-10`}>
           {filteredProducts.map(product => (
              <div key={product.id} onClick={() => handleOpenDetail(product)} className={`${viewMode === 'grid' ? 'flex-col' : 'flex-col md:flex-row items-center'} bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex group relative cursor-pointer`}>
                 <div className="absolute top-6 right-6 z-10">
                    <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-xl ${
                      product.availabilityType === AvailabilityType.INSTANT ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      {product.availabilityType === AvailabilityType.INSTANT ? <Zap size={10} fill="currentColor" className="animate-pulse"/> : <Clock size={10}/>}
                      {product.availabilityType}
                    </span>
                 </div>

                 <div className={`${viewMode === 'grid' ? 'w-full aspect-[4/3]' : 'w-80 h-60'} overflow-hidden bg-slate-100 relative shrink-0`}>
                    <img src={getProductImage(product.productImage)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={product.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 </div>

                 <div className="p-6 md:p-10 flex-1 flex flex-col space-y-6">
                    <div>
                       <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{product.companyName}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-[9px] font-black text-slate-400 uppercase">{product.category}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Asset SKU: {product.modelNumber}</p>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>
                       <div className="flex flex-wrap gap-2">
                          {product.specifications.split(',').slice(0,3).map((s,i) => (
                             <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-400">{s.trim()}</span>
                          ))}
                       </div>
                    </div>

                    <div className="pt-6 mt-auto border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
                       <div className="flex flex-col min-w-[120px]">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Standardized Price</span>
                          <div className="flex items-baseline gap-1">
                             <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">₹{Number(product.price).toLocaleString()}</span>
                             <span className="text-[9px] font-black text-slate-400 uppercase">incl. GST</span>
                          </div>
                       </div>
                       <div className="flex gap-2 md:gap-3 shrink-0">
                          <button onClick={() => handleDirectBuy(product)} className="p-4 md:p-5 bg-slate-900 text-white rounded-2xl md:rounded-[1.5rem] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-90" title="Governance Direct Buy">
                             <ShoppingCart size={18}/>
                          </button>
                          <button onClick={() => { if(!currentUser) onLoginRequired(); else onNegotiate(product); }} className="p-4 md:p-5 bg-white border border-slate-100 text-slate-400 rounded-2xl md:rounded-[1.5rem] hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-90" title="Initiate Terminal Negotiation">
                             <MessageSquare size={18}/>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {activeTab === 'leads' && (
         <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-5">
            {leads.map(lead => (
               <div key={lead.id} onClick={() => handleOpenDetail(lead)} className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 group hover:border-indigo-200 hover:shadow-2xl transition-all duration-500 cursor-pointer">
                  <div className="flex items-center gap-10">
                     <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        {lead.leadImage ? <img src={lead.leadImage} className="w-full h-full object-cover" /> : <Zap size={40} className="text-slate-200"/>}
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-3">
                           <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">{lead.category}</span>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Broadcast ID: #{lead.id.slice(-6)}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{lead.requirementName}</h3>
                        <div className="flex flex-wrap gap-6 mt-4">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><Clock size={14}/> Posted {new Date(lead.createdAt).toLocaleDateString()}</div>
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><Box size={14}/> Units: {lead.quantity}</div>
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><MapPin size={14}/> {lead.city || 'National'}</div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-12 shrink-0 w-full md:w-auto justify-between md:justify-end">
                     <div className="text-center md:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Procurement Budget</p>
                        <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">₹{lead.budget.toLocaleString()}</p>
                     </div>
                     <button onClick={() => { if(!currentUser) onLoginRequired(); else onNegotiate(lead); }} className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-6 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all active:scale-95">
                        Submit Quote <ArrowRight size={18}/>
                     </button>
                  </div>
               </div>
            ))}
         </div>
      )}

      {activeTab === 'services' && (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {services.map(service => (
               <div key={service.id} onClick={() => handleOpenDetail(service)} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                        <RefreshCw size={24} />
                     </div>
                     <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">{service.category}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{service.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-6">{service.description}</p>
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Base Rate</p>
                        <p className="text-2xl font-black text-slate-900">₹{service.price.toLocaleString()}<span className="text-xs text-slate-400 font-bold">/{service.unit}</span></p>
                     </div>
                     <button onClick={() => { if(!currentUser) onLoginRequired(); else onNegotiate(service); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all">
                        Book Now
                     </button>
                  </div>
               </div>
            ))}
         </div>
      )}

      {activeTab === 'vendors' && (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {vendors.map(vendor => (
               <div key={vendor.id} onClick={() => handleOpenDetail(vendor)} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all text-center group cursor-pointer">
                  <div className="relative inline-block mb-6">
                     <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden mx-auto group-hover:border-indigo-100 transition-all">
                        <img src={vendor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${vendor.name}`} className="w-full h-full object-cover" />
                     </div>
                     <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-full border-4 border-white">
                        <CheckCircle2 size={12} />
                     </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">{vendor.companyName || vendor.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{vendor.city || 'Verified Vendor'}</p>
                  <div className="flex justify-center gap-1 mb-6">
                     {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); /* View Profile */ }} className="flex-1 py-4 bg-slate-50 text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                       View Portfolio
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); /* Follow */ }} className="px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                       Follow
                    </button>
                  </div>
               </div>
            ))}
         </div>
      )}

      {loading && (
        <div className="py-40 flex flex-col items-center gap-8 text-center opacity-30">
           <RefreshCw size={60} className="animate-spin text-indigo-600"/>
           <p className="text-xl font-black uppercase tracking-[0.4em]">Querying Global Registry...</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/20"
            >
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-8 right-8 p-4 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all z-20"
              >
                <X size={24} />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  {/* Left: Images */}
                  <div className="space-y-8">
                    <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-100 shadow-inner">
                      <img 
                        src={selectedItem.productImage || selectedItem.leadImage || selectedItem.profileImage || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800'} 
                        className="w-full h-full object-cover"
                        alt="Detail View"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all">
                          <img src={`https://picsum.photos/seed/${selectedItem.id}${i}/200/200`} className="w-full h-full object-cover opacity-60 hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="flex flex-col">
                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                          {selectedItem.category || 'Verified Listing'}
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: #{selectedItem.id?.slice(-8)}</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                        {selectedItem.name || selectedItem.requirementName || selectedItem.companyName}
                      </h2>
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest"><MapPin size={16} className="text-indigo-500"/> {selectedItem.city || 'National'}</div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest"><Clock size={16} className="text-indigo-500"/> {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : 'Active Now'}</div>
                      </div>
                    </div>

                    <div className="space-y-10 flex-1">
                      <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Technical Description</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          {selectedItem.description || selectedItem.specifications || 'Enterprise grade solution with full compliance and verified technical standards. Optimized for industrial performance and long-term reliability in diverse environments.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Quantity/Volume</p>
                          <p className="text-xl font-black text-slate-900">{selectedItem.quantity || selectedItem.stock || '1'} Units</p>
                        </div>
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Delivery Timeline</p>
                          <p className="text-xl font-black text-slate-900">{selectedItem.availabilityDays || selectedItem.deliveryDays || 3} Days</p>
                        </div>
                      </div>

                      {/* Visit & Installation Charges */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Visit Charges</p>
                          <p className="text-lg font-black text-slate-900">₹{selectedItem.visitCharges || 0}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{selectedItem.visitRequired ? 'Mandatory' : 'Optional'}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Installation</p>
                          <p className="text-lg font-black text-slate-900">₹{selectedItem.installationCost || 0}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{selectedItem.installationTime || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Terms & Conditions */}
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                         <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Conditions</h4>
                         <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                            {selectedItem.termsAndConditions || 'Standard enterprise terms apply. 100% governed payment via YDTechPro protocol. Dual-unlock fee applicable for PII disclosure.'}
                         </p>
                      </div>

                      <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Commercial Value</p>
                          <p className="text-4xl font-black tracking-tighter">₹{(selectedItem.price || selectedItem.budget || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">GST Status</p>
                          <p className="text-lg font-black italic">18% Included</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                      <button 
                        onClick={() => { if(!currentUser) onLoginRequired(); else onNegotiate(selectedItem); }}
                        className="flex-1 py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3"
                      >
                        <MessageSquare size={18} /> Start Negotiation
                      </button>
                      <button 
                        onClick={() => handleDirectBuy(selectedItem)}
                        className="px-10 py-6 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-3"
                      >
                        <Zap size={18} fill="currentColor" /> Direct Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreView;
