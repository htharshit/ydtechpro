
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Package, Trash2, RefreshCw, X, Camera, 
  IndianRupee, TrendingUp, MessageSquare, ChevronRight, 
  Eye, EyeOff, Activity, Layers, ArrowUpRight, UploadCloud, 
  FileText, ToggleLeft, ToggleRight, MapPin, CheckCircle2,
  Tag, Box, AlertCircle, Edit2
} from 'lucide-react';
import { User, Product, AvailabilityType } from '../types';
import { storageService } from '../services/storageService';
import ProductPostingForm from './ProductPostingForm';

interface Props {
  currentUser: User;
  isGuest?: boolean;
  onLoginRequired?: () => void;
}

const ProviderView: React.FC<Props> = ({ currentUser, isGuest, onLoginRequired }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'inventory' | 'post' | 'edit'>('inventory');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    refreshData();
  }, [currentUser.id]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const p = await storageService.getProducts();
      setProducts((p || []).filter(prod => prod.vendorId === currentUser.id));
    } catch (e) {
      console.error("Failed to refresh provider inventory", e);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (img?: string) => {
    if (!img) return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400';
    return img;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">My Enterprise <span className="text-indigo-600 italic">Inventory</span></h2>
            <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Managed Stock & Logistics Registry</p>
         </div>
         {view === 'inventory' ? (
           <button onClick={() => { if (isGuest && onLoginRequired) onLoginRequired(); else setView('post'); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
              <PlusCircle size={20}/> Post New Asset
           </button>
         ) : (
           <button onClick={() => { setView('inventory'); setSelectedProduct(null); refreshData(); }} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-all">
              Return to Inventory
           </button>
         )}
      </div>

      {view === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {products.map(product => (
              <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 flex flex-col group hover:shadow-xl transition-all">
                 <div className="aspect-square bg-slate-50 rounded-3xl mb-6 overflow-hidden border border-slate-50">
                    <img src={getProductImage(product.productImage)} className="w-full h-full object-cover" />
                 </div>
                 <div className="space-y-1 mb-6">
                    <p className="text-[10px] font-black text-indigo-600 uppercase">{product.companyName}</p>
                    <h4 className="font-black text-slate-900 truncate" title={product.name}>{product.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Model: {product.modelNumber}</p>
                 </div>
                 <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xl font-black text-slate-900">₹{Number(product.price).toLocaleString()}</span>
                    <div className="flex gap-2">
                       <button onClick={() => { setSelectedProduct(product); setView('edit'); }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-colors">
                          <Edit2 size={16}/>
                       </button>
                       <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-colors">
                          <Trash2 size={16}/>
                       </button>
                    </div>
                 </div>
              </div>
           ))}
           {products.length === 0 && !loading && (
             <div className="col-span-full py-20 text-center opacity-20">
                <Package size={64} className="mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No assets registered in your warehouse.</p>
             </div>
           )}
        </div>
      )}

      {(view === 'post' || view === 'edit') && (
        <ProductPostingForm 
          currentUser={currentUser}
          onSuccess={() => { setView('inventory'); refreshData(); }}
          onCancel={() => { setView('inventory'); setSelectedProduct(null); }}
          editingProduct={selectedProduct || undefined}
        />
      )}

      {loading && view === 'inventory' && (
        <div className="py-20 flex justify-center">
           <RefreshCw className="animate-spin text-indigo-600" size={40}/>
        </div>
      )}
    </div>
  );
};

export default ProviderView;
