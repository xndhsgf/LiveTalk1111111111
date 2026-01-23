
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Plus, Layout, Sparkles, Link as LinkIcon, Video, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';

// Added isRootAdmin?: boolean; to interface
interface AdminBackgroundsProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
  isRootAdmin?: boolean;
}

// Added isRootAdmin to component destructuring
const AdminBackgrounds: React.FC<AdminBackgroundsProps> = ({ handleFileUpload, isRootAdmin }) => {
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newBgUrl, setNewBgUrl] = useState('');

  useEffect(() => {
    const fetchBackgrounds = async () => {
      const docRef = doc(db, 'appSettings', 'official_backgrounds');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setBackgrounds(snap.data().list || []);
      }
    };
    fetchBackgrounds();
  }, []);

  const isVideoUrl = (url: string) => {
    return url?.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || url?.includes('video');
  };

  const handleAddUrlBg = async () => {
    if (!newBgUrl.trim() || !newBgUrl.startsWith('http')) {
      alert('يرجى إدخال رابط صحيح يبدأ بـ http');
      return;
    }
    try {
      const docRef = doc(db, 'appSettings', 'official_backgrounds');
      await setDoc(docRef, { list: arrayUnion(newBgUrl.trim()) }, { merge: true });
      setBackgrounds(prev => [...prev, newBgUrl.trim()]);
      setNewBgUrl('');
      alert('تم إضافة الخلفية عبر الرابط بنجاح ✅');
    } catch (err) {
      alert('فشل إضافة الرابط');
    }
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    handleFileUpload(e, async (url) => {
      try {
        const docRef = doc(db, 'appSettings', 'official_backgrounds');
        await setDoc(docRef, { list: arrayUnion(url) }, { merge: true });
        setBackgrounds(prev => [...prev, url]);
        alert('تمت إضافة الخلفية للمكتبة الرسمية ✅');
      } catch (err) {
        alert('فشل حفظ الخلفية');
      } finally {
        setIsUploading(false);
      }
    }, 800, 1200);
  };

  const removeBg = async (url: string) => {
    if (!confirm('هل تريد حذف هذه الخلفية من المكتبة الرسمية؟')) return;
    try {
      const docRef = doc(db, 'appSettings', 'official_backgrounds');
      await updateDoc(docRef, { list: arrayRemove(url) });
      setBackgrounds(prev => prev.filter(b => b !== url));
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  return (
    <div className="space-y-8 text-right font-cairo select-none" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Layout className="text-indigo-500" /> مكتبة خلفيات الغرف
            </h3>
            <p className="text-slate-500 text-xs font-bold mt-2 pr-1">ارفع ملفات (صورة/فيديو) أو أضف روابط مباشرة للخلفيات.</p>
          </div>
          <div className="flex gap-2">
            <label className={`flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black cursor-pointer shadow-xl active:scale-95 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={16} />}
              رفع من الجهاز
              <input type="file" accept="image/*,video/mp4" className="hidden" onChange={onUpload} />
            </label>
          </div>
        </div>

        <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-3">
           <div className="flex-1 relative">
              <input 
                type="text" 
                value={newBgUrl}
                onChange={(e) => setNewBgUrl(e.target.value)}
                placeholder="الصق رابط الصورة أو الفيديو (MP4) المباشر هنا لإضافته..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-blue-400 font-bold text-[10px] outline-none focus:border-blue-500/50"
                dir="ltr"
              />
              <LinkIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
           </div>
           <button 
             onClick={handleAddUrlBg}
             className="px-8 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-xs hover:bg-white/20 transition-all active:scale-95"
           >
              إضافة الرابط
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {backgrounds.map((bg, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.02 }}
            className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 group bg-slate-900 shadow-xl"
          >
            {/* طبقة حماية شفافة فوق الخلفية */}
            <div className="absolute inset-0 z-10 bg-transparent"></div>
            
            {isVideoUrl(bg) ? (
              <video src={bg} autoPlay muted loop playsInline className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <img src={bg} className="w-full h-full object-cover pointer-events-none" alt="" />
            )}
            
            {isVideoUrl(bg) && (
              <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white z-20">
                <Video size={12} />
              </div>
            )}

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-30">
              <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                 <ShieldCheck size={14} className="text-emerald-500" />
                 <span className="text-[8px] text-white font-black uppercase">Protected URL</span>
              </div>
              <button onClick={() => removeBg(bg)} className="p-3 bg-red-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform">
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminBackgrounds;
