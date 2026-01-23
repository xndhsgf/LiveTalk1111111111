
import React, { useState, useEffect } from 'react';
import { IdCard, Plus, Trash2, Save, Upload, Image as ImageIcon, Coins, Hash, Layout, X, Sparkles, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { SpecialIDItem } from '../../types';

// Added isRootAdmin?: boolean; to interface
interface AdminSpecialIDsProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
  isRootAdmin?: boolean;
}

const AdminSpecialIDs: React.FC<AdminSpecialIDsProps> = ({ handleFileUpload, isRootAdmin }) => {
  const [specialIds, setSpecialIds] = useState<SpecialIDItem[]>([]);
  const [storeBackground, setStoreBackground] = useState('');
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState(false);
  
  const [newId, setNewId] = useState<Partial<SpecialIDItem>>({
    customId: '',
    badgeUrl: '',
    price: 100000,
    isSold: false
  });

  useEffect(() => {
    const unsubIds = onSnapshot(collection(db, 'special_ids'), (snap) => {
      setSpecialIds(snap.docs.map(d => ({ id: d.id, ...d.data() } as SpecialIDItem)));
    });

    const unsubSettings = onSnapshot(doc(db, 'appSettings', 'special_id_store'), (snap) => {
      if (snap.exists()) setStoreBackground(snap.data().backgroundUrl || '');
    });

    return () => { unsubIds(); unsubSettings(); };
  }, []);

  const handleSaveID = async () => {
    if (!newId.customId || !newId.badgeUrl) {
      alert('يرجى إكمال البيانات أولاً ⚠️');
      return;
    }
    setLoading(true);
    try {
      const docId = 'spec_' + Date.now();
      await setDoc(doc(db, 'special_ids', docId), {
        ...newId,
        id: docId,
        isSold: false,
        createdAt: serverTimestamp()
      });
      setNewId({ customId: '', badgeUrl: '', price: 100000, isSold: false });
      setIsAdding(false);
      alert('تمت إضافة الآيدي بنجاح ✅');
    } catch (e) {
      alert('فشل حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const onBadgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingBadge(true);
    handleFileUpload(e, (url) => {
      setNewId(prev => ({ ...prev, badgeUrl: url }));
      setUploadingBadge(false);
    }, 400, 150);
  };

  const handleUpdateStoreBG = async (url: string) => {
    if (!url) return;
    try {
      await setDoc(doc(db, 'appSettings', 'special_id_store'), { backgroundUrl: url }, { merge: true });
      setStoreBackground(url);
      setBgUrlInput('');
      alert('تم تحديث الخلفية بنجاح ✅');
    } catch (e) {
      alert('فشل التحديث');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا الآيدي نهائياً؟')) return;
    await deleteDoc(doc(db, 'special_ids', id));
  };

  return (
    <div className="space-y-8 text-right font-cairo select-none" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <IdCard className="text-amber-500" size={32} /> متجر الآيديهات الملكية
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-2">إدارة أرقام الآيدي (الروابط محمية من النسخ).</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all z-10 ${isAdding ? 'bg-red-600 text-white' : 'bg-amber-600 text-black'}`}
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'إغلاق' : 'إضافة آيدي جديد'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0f172a] border border-amber-500/20 rounded-[3rem] p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 pr-2 flex items-center gap-2"><Hash size={14} className="text-amber-500" /> رقم الآيدي المميز</label>
                    <input type="text" value={newId.customId} onChange={e => setNewId(prev => ({ ...prev, customId: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-amber-500 font-black text-2xl outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 pr-2 flex items-center gap-2"><Coins size={14} className="text-yellow-500" /> السعر المطلوب</label>
                    <input type="number" value={newId.price} onChange={e => setNewId(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-yellow-500 font-black text-2xl outline-none" />
                  </div>
                  <button disabled={loading} onClick={handleSaveID} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black rounded-2xl text-sm shadow-xl">{loading ? 'جاري الحفظ...' : 'نشر الآيدي'}</button>
               </div>

               <div className="flex flex-col items-center justify-center bg-black/20 rounded-[2.5rem] border border-white/5 p-8">
                  <div className="relative w-full aspect-[3/1] bg-slate-900 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
                    <div className="absolute inset-0 z-20"></div>
                    {newId.badgeUrl ? <img src={newId.badgeUrl} className="h-20 object-contain pointer-events-none" /> : <div className="flex flex-col items-center text-slate-700">{uploadingBadge ? <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div> : <ImageIcon size={48} />}</div>}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-30">
                       <Upload size={32} className="text-white" />
                       <input type="file" accept="image/*" className="hidden" onChange={onBadgeUpload} />
                    </label>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
           <h4 className="text-sm font-black text-white flex items-center gap-2"><Layout size={18} className="text-blue-400" /> خلفية المتجر</h4>
           <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-black/40 group">
              <div className="absolute inset-0 z-10"></div>
              {storeBackground ? <img src={storeBackground} className="w-full h-full object-cover pointer-events-none" /> : <ImageIcon className="text-slate-700 m-auto" size={32} />}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-20">
                 <Upload size={24} className="text-white" />
                 <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, handleUpdateStoreBG, 1080, 1920)} />
              </label>
           </div>
           <div className="space-y-2">
              <input type="text" value={bgUrlInput} onChange={(e) => setBgUrlInput(e.target.value)} placeholder="رابط جديد..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-blue-400 text-[10px] outline-none" dir="ltr" />
              <button onClick={() => handleUpdateStoreBG(bgUrlInput)} className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black">تحديث</button>
           </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {specialIds.map(sid => (
              <motion.div key={sid.id} className="bg-slate-950/60 p-5 rounded-[2.2rem] border border-white/5 relative group transition-all">
                 <div className="absolute inset-0 z-10"></div>
                 <button onClick={() => handleDelete(sid.id)} className="absolute top-2 left-2 p-2 bg-red-600/20 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 z-30"><Trash2 size={14} /></button>
                 <div className="relative h-14 w-full flex items-center justify-center mb-4">
                    <img src={sid.badgeUrl} className="h-full object-contain pointer-events-none" />
                    <span className="absolute text-white font-black text-[11px] pt-1">ID: {sid.customId}</span>
                 </div>
                 <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 font-black text-sm">
                       <span>{sid.price.toLocaleString()}</span><Coins size={12} />
                    </div>
                 </div>
                 <div className="absolute bottom-2 right-2 opacity-10"><ShieldCheck size={14}/></div>
              </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSpecialIDs;
