
import React, { useState, useEffect } from 'react';
import { Plus, Gift as GiftIcon, Edit3, Trash2, Wand2, X, Upload, Image as ImageIcon, Video, Settings2, Zap, ImagePlus, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, GiftAnimationType, GiftDisplaySize } from '../../types';
import { db } from '../../services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface AdminGiftsProps {
  gifts: Gift[];
  onSaveGift: (gift: Gift, isDelete?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
  isRootAdmin?: boolean;
}

const animationTypes: { id: GiftAnimationType; label: string }[] = [
  { id: 'none', label: 'بدون تأثير' },
  { id: 'pop', label: 'ظهور (Pop)' },
  { id: 'fly', label: 'طيران (Fly)' },
  { id: 'full-screen', label: 'ملء الشاشة' },
  { id: 'shake', label: 'اهتزاز' },
  { id: 'glow', label: 'توهج' },
  { id: 'bounce', label: 'قفز' },
  { id: 'rotate', label: 'دوران' },
  { id: 'slide-up', label: 'انزلاق للأعلى' },
];

const sizeOptions: { id: GiftDisplaySize; label: string }[] = [
  { id: 'small', label: 'صغير (25%)' },
  { id: 'medium', label: 'متوسط (50%)' },
  { id: 'large', label: 'كبير (75%)' },
  { id: 'full', label: 'ملء الشاشة (Contain)' },
  { id: 'max', label: 'شاشة فائقة (Cover Full)' },
];

const AdminGifts: React.FC<AdminGiftsProps> = ({ gifts, onSaveGift, handleFileUpload }) => {
  const [editingGift, setEditingGift] = useState<Partial<Gift> | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingAnim, setIsUploadingAnim] = useState(false);
  const [categoryLabels, setCategoryLabels] = useState({
    popular: 'شائع',
    exclusive: 'حصري',
    lucky: 'الحظ',
    trend: 'ترند'
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'appSettings', 'gift_settings'), (snap) => {
      if (snap.exists() && snap.data().categoryLabels) {
        setCategoryLabels(snap.data().categoryLabels);
      }
    });
    return () => unsub();
  }, []);

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || url.includes('video/mp4') || url.includes('data:video');
  };

  const handleFinalSave = async () => {
    if (!editingGift?.name || !editingGift?.icon) {
      alert('يرجى وضع رابط الأنميشن أو رفعه أولاً');
      return;
    }
    
    await onSaveGift({ 
      ...editingGift, 
      isLucky: editingGift.category === 'lucky',
      duration: Number(editingGift.duration) || 5,
      displaySize: editingGift.displaySize || 'medium',
      animationType: editingGift.animationType || 'pop'
    } as Gift);
    setEditingGift(null);
  };

  const renderPreview = (item: Partial<Gift>) => {
    const url = item.icon;
    if (!url) return <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-800/50 rounded-2xl border-2 border-dashed border-white/5"><ImageIcon size={32} /><span className="text-[10px] mt-2 font-bold uppercase">لا يوجد معاينة</span></div>;
    
    const sizeScale = item.displaySize === 'small' ? 'scale-50' : item.displaySize === 'large' ? 'scale-90' : item.displaySize === 'full' ? 'scale-100' : 'scale-75';

    return (
      <div className={`relative w-full h-full bg-black flex items-center justify-center transition-transform ${sizeScale}`}>
        {isVideoUrl(url) ? (
          <video src={url} autoPlay muted loop playsInline className="max-w-full max-h-full object-contain pointer-events-none" />
        ) : (
          <img src={url} className="max-w-full max-h-full object-contain pointer-events-none" alt="Preview" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 text-right font-cairo select-none" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-white">إدارة الهدايا والأنميشن</h3>
        <button onClick={() => setEditingGift({ id: 'gift_' + Date.now(), name: '', icon: '', catalogIcon: '', cost: 10, animationType: 'pop', category: 'popular', duration: 5, displaySize: 'medium' })} className="px-6 py-3 bg-pink-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all">
          <Plus size={18} /> إضافة هدية جديدة
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {gifts.map(gift => (
          <div key={gift.id} className="bg-slate-950/60 p-4 rounded-[2rem] border border-white/10 flex flex-col items-center gap-2 group relative transition-all">
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 z-20">
              <button onClick={() => setEditingGift(gift)} className="p-1.5 bg-blue-600 rounded-lg text-white shadow-lg"><Edit3 size={12}/></button>
              <button onClick={() => { if(confirm('حذف الهدية؟')) onSaveGift(gift, true) }} className="p-1.5 bg-red-600 rounded-lg text-white shadow-lg"><Trash2 size={12}/></button>
            </div>
            <div className="w-16 h-16 flex items-center justify-center mb-1 relative overflow-hidden rounded-xl bg-black/20">
               <img src={gift.catalogIcon || gift.icon} className="w-full h-full object-contain" alt="" />
            </div>
            <span className="text-xs font-black text-white truncate w-full text-center">{gift.name}</span>
            <span className="text-[10px] text-yellow-500 font-bold">🪙 {gift.cost}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingGift && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <h3 className="text-xl font-black text-white">إعدادات الهدية (MP4 / صور)</h3>
                <button onClick={() => setEditingGift(null)} className="p-2 hover:bg-white/5 rounded-full"><X size={24} className="text-slate-500" /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="aspect-square bg-slate-800 rounded-2xl border border-white/10 overflow-hidden relative shadow-inner flex items-center justify-center">
                         {renderPreview(editingGift)}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <label className={`w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 cursor-pointer ${isUploadingAnim ? 'opacity-50' : ''}`}>
                           <Video size={16} /> {isUploadingAnim ? 'جاري الرفع...' : 'رفع أنميشن (MP4/GIF)'}
                           <input type="file" accept="video/mp4,image/gif" className="hidden" onChange={(e) => { setIsUploadingAnim(true); handleFileUpload(e, (url) => { setEditingGift({...editingGift, icon: url}); setIsUploadingAnim(false); }, 1080, 1080); }} />
                        </label>
                        <label className={`w-full py-3 bg-slate-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2 cursor-pointer ${isUploadingIcon ? 'opacity-50' : ''}`}>
                           <ImagePlus size={16} /> {isUploadingIcon ? 'جاري الرفع...' : 'رفع صورة المتجر'}
                           <input type="file" accept="image/*" className="hidden" onChange={(e) => { setIsUploadingIcon(true); handleFileUpload(e, (url) => { setEditingGift({...editingGift, catalogIcon: url}); setIsUploadingIcon(false); }, 200, 200); }} />
                        </label>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500">اسم الهدية</label>
                        <input type="text" value={editingGift.name} onChange={e => setEditingGift({...editingGift, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500">رابط الأنميشن المباشر (MP4/GIF)</label>
                        <div className="relative">
                          <input type="text" value={editingGift.icon} onChange={e => setEditingGift({...editingGift, icon: e.target.value})} placeholder="https://...mp4" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-blue-400 text-[10px] outline-none pr-10" dir="ltr" />
                          <LinkIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500">رابط صورة المتجر (اختياري)</label>
                        <input type="text" value={editingGift.catalogIcon} onChange={e => setEditingGift({...editingGift, catalogIcon: e.target.value})} placeholder="https://...png" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-slate-400 text-[10px] outline-none" dir="ltr" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500">الحجم</label>
                          <select value={editingGift.displaySize || 'medium'} onChange={e => setEditingGift({...editingGift, displaySize: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-[10px] font-bold outline-none">
                            {sizeOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500">التأثير</label>
                          <select value={editingGift.animationType || 'pop'} onChange={e => setEditingGift({...editingGift, animationType: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-[10px] font-bold outline-none">
                            {animationTypes.map(anim => <option key={anim.id} value={anim.id}>{anim.label}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500">المدة (ث)</label>
                            <input type="number" value={editingGift.duration || 5} onChange={e => setEditingGift({...editingGift, duration: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none text-center" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500">السعر</label>
                            <input type="number" value={editingGift.cost} onChange={e => setEditingGift({...editingGift, cost: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-yellow-500 text-xs font-black outline-none text-center" />
                         </div>
                      </div>
                   </div>
                </div>

                <button onClick={handleFinalSave} className="w-full py-5 bg-gradient-to-r from-pink-600 to-indigo-700 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all text-sm">حفظ ونشر التعديلات</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGifts;
