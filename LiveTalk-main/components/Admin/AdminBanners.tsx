
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Plus, Link as LinkIcon, Save, Globe, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Banner } from '../../types';

interface AdminBannersProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminBanners: React.FC<AdminBannersProps> = ({ handleFileUpload }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({ imageUrl: '', link: '', title: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'banners'), (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!newBanner.imageUrl) return alert('الرجاء رفع صورة للبنر');
    setLoading(true);
    try {
      const id = 'banner_' + Date.now();
      await setDoc(doc(db, 'banners', id), {
        ...newBanner,
        createdAt: serverTimestamp()
      });
      setNewBanner({ imageUrl: '', link: '', title: '' });
      setIsAdding(false);
    } catch (e) {
      alert('فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا البنر نهائياً؟')) return;
    await deleteDoc(doc(db, 'banners', id));
  };

  return (
    <div className="space-y-8 text-right font-cairo select-none" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <ImageIcon className="text-blue-500" size={32} /> مركز رفع بنرات الواجهة
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-2">قم بإضافة بنرات إعلانية متحركة (الروابط محمية من الاستخراج).</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all ${isAdding ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'إلغاء' : 'إضافة بنر جديد'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#0f172a] border border-blue-500/30 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 pr-2">عنوان البنر</label>
                    <input 
                      type="text" 
                      value={newBanner.title}
                      onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                      placeholder="عنوان للإعلان..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 pr-2 uppercase">رابط التوجيه (محمي)</label>
                    <div className="relative">
                       <input 
                         type="text" 
                         value={newBanner.link}
                         onChange={e => setNewBanner({...newBanner, link: e.target.value})}
                         placeholder="الصق الرابط هنا (سيتم تشفيره تلقائياً)"
                         dir="ltr"
                         className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-blue-400 text-[10px] font-bold outline-none"
                       />
                       <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50" />
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    onClick={handleSave}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl text-sm shadow-xl"
                  >
                    {loading ? 'جاري الحفظ...' : 'اعتماد البنر ونشره'}
                  </button>
               </div>

               <div className="flex flex-col items-center justify-center bg-black/20 rounded-3xl p-6 border border-white/5">
                  <div className="w-full h-40 bg-slate-900 rounded-2xl border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center relative group">
                    <div className="absolute inset-0 z-10 bg-transparent"></div>
                    {newBanner.imageUrl ? (
                       <img src={newBanner.imageUrl} className="w-full h-full object-cover pointer-events-none" alt="" />
                    ) : (
                       <div className="flex flex-col items-center text-slate-700">
                          <ImageIcon size={48} />
                          <span className="text-[10px] font-black mt-2 uppercase tracking-widest">رفع صورة البنر</span>
                       </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-20">
                       <Upload size={32} className="text-white" />
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         onChange={(e) => handleFileUpload(e, (url) => setNewBanner({...newBanner, imageUrl: url}), 800, 300)} 
                       />
                    </label>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <motion.div key={banner.id} className="bg-slate-950/60 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl group relative">
            <div className="absolute inset-0 z-10 bg-transparent"></div>
            <div className="h-40 relative">
               <img src={banner.imageUrl} className="w-full h-full object-cover pointer-events-none" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
               <button onClick={() => handleDelete(banner.id)} className="absolute top-4 left-4 p-3 bg-red-600 text-white rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90 z-20"><Trash2 size={18} /></button>
            </div>
            <div className="p-5 flex items-center justify-between">
               <div className="flex-1 min-w-0">
                  <h4 className="text-white font-black text-sm truncate">{banner.title || 'إعلان نشط'}</h4>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-500">
                     <ShieldCheck size={12} />
                     <span className="text-[8px] font-black uppercase tracking-widest">Link Encrypted</span>
                  </div>
               </div>
               <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20"><Globe size={18} className="text-blue-500" /></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminBanners;
