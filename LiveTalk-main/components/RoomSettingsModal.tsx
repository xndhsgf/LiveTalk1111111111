
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Upload, Layout, Save, Edit3, Lock, Unlock, Video, Sparkles, Check } from 'lucide-react';
import { Room } from '../types';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onUpdate: (roomId: string, data: Partial<Room>) => void;
}

const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({ isOpen, onClose, room, onUpdate }) => {
  const [title, setTitle] = useState(room.title);
  const [thumbnail, setThumbnail] = useState(room.thumbnail);
  const [background, setBackground] = useState(room.background);
  const [isLocked, setIsLocked] = useState(room.isLocked || false);
  const [password, setPassword] = useState(room.password || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [officialBackgrounds, setOfficialBackgrounds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchOfficialBgs = async () => {
        try {
          const snap = await getDoc(doc(db, 'appSettings', 'official_backgrounds'));
          if (snap.exists()) setOfficialBackgrounds(snap.data().list || []);
        } catch (e) {
          console.error("Error fetching backgrounds:", e);
        }
      };
      fetchOfficialBgs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVideoUrl = (url: string) => {
    return url?.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || url?.includes('video');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('حجم الملف كبير جداً');
        return;
      }
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const raw = event.target.result as string;
          if (file.type.startsWith('video/')) {
             if (type === 'background') setBackground(raw);
             else alert('يرجى اختيار صورة للغلاف وليس فيديو');
          } else {
            const compressed = type === 'thumbnail' 
              ? await compressImage(raw, 400, 400, 0.7)
              : await compressImage(raw, 1080, 1920, 0.85);
            
            if (type === 'thumbnail') setThumbnail(compressed);
            else setBackground(compressed);
          }
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
     if (isProcessing) return;
     if (isLocked && password.length < 4) return alert('يرجى إدخال رمز من 4 أرقام');

     onUpdate(room.id, {
        title,
        thumbnail,
        background,
        isLocked,
        password: isLocked ? password : ''
     });
     onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#10141f] rounded-t-[30px] p-6 pb-8 border-t border-white/10 pointer-events-auto shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-white flex items-center gap-2"><Edit3 className="text-blue-500" /> إعدادات الغرفة</h2>
           <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="space-y-6">
           <div>
             <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">اسم الغرفة</label>
             <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-xs font-bold focus:border-blue-500 outline-none" />
           </div>

           <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isLocked ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-500'}`}>
                       {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </div>
                    <div>
                       <h4 className="text-xs font-bold text-white">حماية الغرفة</h4>
                       <p className="text-[9px] text-slate-500">قفل الغرفة بكلمة مرور</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsLocked(!isLocked)}
                   className={`w-12 h-6 rounded-full transition-all relative ${isLocked ? 'bg-amber-500' : 'bg-slate-700'}`}
                 >
                    <motion.div 
                      animate={{ x: isLocked ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                 </button>
              </div>

              {isLocked && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <input 
                      type="password" 
                      maxLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                      placeholder="رمز سري جديد..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-center text-lg font-black text-amber-500 tracking-widest outline-none"
                    />
                 </motion.div>
              )}
           </div>

           {/* اختيار الخلفيات الرسمية - الميزة المطلوبة */}
           {officialBackgrounds.length > 0 && (
             <div className="space-y-3">
               <div className="flex items-center justify-between pr-1">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500" /> خلفيات رسمية</label>
                 <span className="text-[8px] text-slate-600 font-bold">تغيير فوري</span>
               </div>
               <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {officialBackgrounds.map((bgUrl, i) => (
                    <button 
                      key={i} 
                      onClick={() => setBackground(bgUrl)}
                      className={`relative w-16 h-24 rounded-xl border-2 shrink-0 overflow-hidden transition-all ${background === bgUrl ? 'border-amber-500 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-white/5 opacity-70 hover:opacity-100'}`}
                    >
                      {isVideoUrl(bgUrl) ? (
                         <video src={bgUrl} muted className="w-full h-full object-cover" />
                      ) : (
                         <img src={bgUrl} className="w-full h-full object-cover" alt="" />
                      )}
                      {isVideoUrl(bgUrl) && <Video size={10} className="absolute top-1 right-1 text-white opacity-60" />}
                      {background === bgUrl && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <div className="bg-amber-500 rounded-full p-0.5 shadow-lg"><Check size={12} className="text-black" /></div>
                        </div>
                      )}
                    </button>
                  ))}
               </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 pr-1 uppercase tracking-widest">غلاف الغرفة</label>
                 <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer relative overflow-hidden bg-slate-900 group">
                    {isProcessing ? (<div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>) : (<><img src={thumbnail} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Thumbnail" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={20} className="text-white" /></div></>)}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'thumbnail')} className="hidden" />
                 </label>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 pr-1 uppercase tracking-widest">رفع خلفية مخصصة</label>
                 <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer relative overflow-hidden bg-slate-900 group">
                    {isProcessing ? (<div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>) : (<>
                       {isVideoUrl(background) ? (
                          <video src={background} muted className="w-full h-full object-cover" />
                       ) : (
                          background?.includes('data:') || background?.includes('http') ? <img src={background} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: background || '#0f172a' }}></div>
                       )}
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Layout size={20} className="text-white" /></div>
                    </>)}
                    <input type="file" accept="image/*,video/mp4" onChange={(e) => handleImageUpload(e, 'background')} className="hidden" />
                 </label>
              </div>
           </div>
           
           <button onClick={handleSave} disabled={isProcessing} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform disabled:opacity-50 text-xs">
              {isProcessing ? 'جاري معالجة الملفات...' : <><Save size={18} /> حفظ جميع الإعدادات</>}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoomSettingsModal;
