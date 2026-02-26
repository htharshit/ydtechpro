
import React, { useState } from 'react';
import { 
  Package, Camera, IndianRupee, RefreshCw, 
  UploadCloud, AlertCircle, X, Plus
} from 'lucide-react';
import { User, Product, AvailabilityType } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
  editingProduct?: Product;
}

const ProductPostingForm: React.FC<Props> = ({ currentUser, onSuccess, onCancel, editingProduct }) => {
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(editingProduct?.productImage || null);
  
  const [formData, setFormData] = useState<Partial<Product>>(editingProduct || {
    name: '',
    companyName: '',
    modelNumber: '',
    price: 0,
    category: 'CCTV',
    stock: 0,
    specifications: '',
    description: '',
    availabilityType: AvailabilityType.INSTANT,
    availabilityDays: 0,
    gstPercent: 18,
    productImage: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Image must be smaller than 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setFormData({ ...formData, productImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productImage) return alert("Product Image is mandatory.");
    
    setLoading(true);
    const res = await storageService.saveProduct({
      ...formData,
      id: editingProduct?.id || `PRD-${Date.now()}`,
      vendorId: currentUser.id,
      vendorName: currentUser.name
    } as Product);

    if (res.success || res.status === 'success') {
      onSuccess();
    } else {
      alert(res.error || "Registry update failed.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl animate-in slide-in-from-bottom-10">
      <div className="flex items-center justify-between mb-10">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Package size={28}/></div>
            <div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Registry <span className="text-indigo-600 italic">Entry</span></h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Specification Standard</p>
            </div>
         </div>
         <button onClick={onCancel} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     Product Image <span className="text-rose-500">* Mandatory</span>
                  </label>
                  <div className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group ${previewImage ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}`}>
                     {previewImage ? (
                       <img src={previewImage} className="w-full h-full object-cover" />
                     ) : (
                       <>
                         <UploadCloud size={40} className="text-slate-300 group-hover:text-indigo-500 transition-colors mb-2"/>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Click to Select Visual Proof</span>
                       </>
                     )}
                     <input type="file" accept="image/*" required={!editingProduct} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                  <input required type="text" placeholder="e.g. Smart IP Dome Camera" className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand / Company</label>
                     <input required type="text" placeholder="e.g. Hikvision" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Model Number</label>
                     <input required type="text" placeholder="e.g. DS-2CD..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" value={formData.modelNumber} onChange={e => setFormData({...formData, modelNumber: e.target.value})} />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Availability Protocol</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase" value={formData.availabilityType} onChange={e => setFormData({...formData, availabilityType: e.target.value as AvailabilityType})}>
                        {Object.values(AvailabilityType).map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Days to Deliver</label>
                     <input type="number" disabled={formData.availabilityType === AvailabilityType.INSTANT} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm disabled:opacity-30" value={formData.availabilityDays} onChange={e => setFormData({...formData, availabilityDays: Number(e.target.value)})} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Price (₹)</label>
                     <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inventory Stock</label>
                     <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Specifications (Enterprise Level)</label>
                  <textarea required placeholder="Detailed specs (e.g. 4MP, PoE, 30m IR, WDR...)" className="technical-input-area w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.specifications} onChange={e => setFormData({...formData, specifications: e.target.value})} />
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
            <AlertCircle size={24} className="text-indigo-600 shrink-0"/>
            <p className="text-[10px] text-indigo-900 font-bold uppercase leading-relaxed">
               Compliance Checklist: Ensure Brand and Model match visual evidence. Mismatched registry entries will result in immediate lead suspension.
            </p>
         </div>

         <button disabled={loading} type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
            {loading ? 'Transmitting Specification...' : 'Commit Enterprise Listing'} <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
         </button>
      </form>
    </div>
  );
};

export default ProductPostingForm;
