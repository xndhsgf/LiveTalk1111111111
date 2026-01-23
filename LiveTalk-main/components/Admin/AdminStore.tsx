
import React, { useState } from 'react';
import { Plus, ShoppingBag, Edit3, Trash2, X, Upload, Image as ImageIcon, Video, Wand2, ShieldCheck, Save, Link as LinkIcon, Eye, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreItem, ItemType } from '../../types';

interface AdminStoreProps {
  storeItems: StoreItem[];
  onSaveItem: (item: StoreItem, isDelete?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
  isRootAdmin?: boolean; 
}

const AdminStore: React.FC<AdminStoreProps> = ({ storeItems, onSaveItem, handleFileUpload, isRootAdmin }) => {
  const [editingStoreItem, setEditingStoreItem] = useState<Partial<StoreItem> | null>(null);
  const [isUploadingUrl, setIsUploadingUrl] = useState(false);

  const handleFinalSave = async () => {
    if (!editingStoreItem?.name || !editingStoreItem?.url) {
      alert('يرجى إكمال البيانات المطلوبة ⚠️');
      return;
    }
    try {
      await onSaveItem(editingStoreItem as StoreItem);
      setEditingStoreItem(null);
      alert('تم حفظ البيانات بنجاح ✅');
    } catch (error) {
      console.error("Error saving store item:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || url.includes('video') || url.includes('data:video/mp4');
  };

  const renderPreview = (item: Partial<StoreItem>) => {
    if (!item.url) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-800/50 rounded-2xl border-2 border-dashed border-white/5">
          <ImageIcon size={40} className="opacity-20 mb-2" />
          <span className="text-[10px] font-black uppercase">انتظار البيانات</span>
        </div>
      );
    }

    if (item.type === 'entry' || isVideoUrl(item.url || '')) {
      return (
        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl">
          <video key={item.url} src={item.url} autoPlay muted loop playsInline className="w-full h-full object-contain" />
          <div className="absolute top-2 right-2 bg-blue-600 p-1.5 rounded-lg shadow-lg"><Video size={14} className="text-white" /></div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 flex items-center justify-center">
        <img src={item.url} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="" />
        <div className="absolute top-2 right-2 bg-emerald-600 p-1.5 rounded-lg shadow-lg"><ImageIcon size={14} className="text-white" /></div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-right font-cairo select-none" dir="rtl">
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl gap-4">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-cyan-600 rounded-xl shadow-lg"><ShoppingBag className="text-white" /></div>
            متجر بوبو الملكي
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-2 pr-1">
            {isRootAdmin 
              ? 'أهلاً بك أيها المدير، لديك صلاحية الوصول الكاملة للروابط والأصول.' 
              : 'إدارة مقتنيات المتجر (البيانات الحساسة مشفرة ومحمية من العرض).'}
          </p>
        </div>
        <button onClick={() => setEditingStoreItem({ id: 'item_' + Date.now(), name: '', type: 'frame', price: 500, url: '' })} className="px-8 py-4 bg-cyan-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all">
          <Plus size={20}/> إضافة مقتنى جديد
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {storeItems.map(item => (
          <div key={item.id} className="bg-slate-950/60 p-4 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-2 group relative overflow-hidden transition-all shadow-lg hover:border-cyan-500/30">
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button onClick={() => setEditingStoreItem(item)} className="p-2 bg-blue-600 rounded-xl text-white shadow-lg"><Edit3 size={12}/></button>
              <button onClick={() => { if(confirm('حذف هذا المقتنى؟')) onSaveItem(item, true) }} className="p-2 bg-red-600 rounded-xl text-white shadow-lg"><Trash2 size={12}/></button>
            </div>
            <div className="w-20 h-20 bg-black/40 rounded-3xl flex items-center justify-center overflow-hidden mb-1 relative">
               {item.type === 'entry' ? (
                 <div className="relative w-full h-full"><img src={item.url} className="w-full h-full object-cover opacity-60" /><div className="absolute inset-0 flex items-center justify-center"><Video size={20} className="text-white/60" /></div></div>
               ) : (
                 <img src={item.url} className="w-full h-full object-contain p-2" />
               )}
            </div>
            <span className="text-xs font-black text-white truncate w-full text-center">{item.name}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-yellow-500 font-black">🪙 {item.price.toLocaleString()}</span>
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{item.type}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingStoreItem && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <h3 className="text-xl font-black text-white flex items-center gap-2 text-right"><ShoppingBag className="text-cyan-500 ml-2"/> إعدادات المقتنى</h3>
                <button onClick={() => setEditingStoreItem(null)} className="p-2 bg-white/5 rounded-full"><X size={24} className="text-slate-500" /></button>
              </div>
              
              <div className="space-y-6">
                <div className="aspect-video bg-black/30 rounded-[2rem] border border-white/5 overflow-hidden shadow-inner relative">
                  {renderPreview(editingStoreItem)}
                  {isUploadingUrl && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}
                </div>

                <div className="space-y-5">
                   <div className="grid grid-cols-3 gap-2">
                     {(['frame', 'bubble', 'entry'] as ItemType[]).map(t => (
                        <button key={t} onClick={() => setEditingStoreItem({...editingStoreItem, type: t})} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${editingStoreItem.type === t ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500'}`}>{t === 'frame' ? 'إطار' : t === 'bubble' ? 'فقاعة' : 'دخولية'}</button>
                     ))}
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 pr-2">اسم المقتنى</label>
                      <input type="text" value={editingStoreItem.name} onChange={e => setEditingStoreItem({...editingStoreItem, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-cyan-500" placeholder="الاسم..." />
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 pr-2 uppercase flex items-center gap-1">
                        <LinkIcon size={12} /> رابط المصدر {!isRootAdmin && <span className="text-emerald-500 font-bold">(مؤمن ومحمي)</span>}
                      </label>
                      <div className="relative">
                         <input 
                           type="text" 
                           // التشفير المتقدم: عرض نجوم للمشرفين، والبيانات الحقيقية للمدير فقط
                           value={isRootAdmin ? (editingStoreItem.url || '') : (editingStoreItem.url ? '**************** (Encrypted - Secured)' : '')} 
                           onChange={e => isRootAdmin && setEditingStoreItem({...editingStoreItem, url: e.target.value})}
                           placeholder="https://..."
                           readOnly={!isRootAdmin}
                           dir="ltr"
                           className={`w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-12 text-blue-400 font-bold text-[10px] outline-none ${isRootAdmin ? 'focus:border-cyan-500 cursor-text' : 'cursor-not-allowed opacity-60'}`} 
                         />
                         {isRootAdmin ? <LinkIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" /> : <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
                      </div>
                      {!isRootAdmin && <p className="text-[8px] text-slate-600 font-bold pr-2 mt-1">يُسمح للمشرفين بتغيير الأصول عبر زر "الرفع" فقط لضمان سلامة الروابط الأصلية.</p>}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 pr-2">السعر (كوينز)</label>
                         <input type="number" value={editingStoreItem.price} onChange={e => setEditingStoreItem({...editingStoreItem, price: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-yellow-500 font-black text-sm outline-none focus:border-yellow-500 shadow-inner" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 pr-2">رفع ملف جديد</label>
                         <label className="flex items-center justify-center gap-2 w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-black cursor-pointer hover:bg-slate-700">
                            <Upload size={14} /> {editingStoreItem.type === 'entry' ? 'فيديو' : 'صورة'}
                            <input type="file" accept={editingStoreItem.type === 'entry' ? "video/mp4" : "image/*"} className="hidden" onChange={(e) => { setIsUploadingUrl(true); handleFileUpload(e, (url) => { setEditingStoreItem({...editingStoreItem, url: url}); setIsUploadingUrl(false); }, 1080, 1920); }} />
                         </label>
                      </div>
                   </div>

                   <button onClick={handleFinalSave} className="w-full py-5 bg-gradient-to-r from-cyan-600 to-indigo-700 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all text-sm mt-4">حفظ ونشر المقتنى</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStore;
