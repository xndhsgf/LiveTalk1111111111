
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IdCard, Coins, CheckCircle2, Sparkles, ShoppingBag, Hash } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { SpecialIDItem, User } from '../types';

interface SpecialIDShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onBuy: (item: SpecialIDItem) => void;
}

const SpecialIDShopModal: React.FC<SpecialIDShopModalProps> = ({ isOpen, onClose, currentUser, onBuy }) => {
  const [specialIds, setSpecialIds] = useState<SpecialIDItem[]>([]);
  const [background, setBackground] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const unsubIds = onSnapshot(collection(db, 'special_ids'), (snap) => {
      setSpecialIds(snap.docs.map(d => ({ id: d.id, ...d.data() } as SpecialIDItem)));
      setLoading(false);
    });

    const unsubSettings = onSnapshot(doc(db, 'appSettings', 'special_id_store'), (snap) => {
      if (snap.exists()) setBackground(snap.data().backgroundUrl || '');
    });

    return () => { unsubIds(); unsubSettings(); };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm h-[85vh] bg-[#020617] rounded-[3rem] border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col font-cairo"
        dir="rtl"
      >
        {/* Custom Store Background */}
        <div className="absolute inset-0 z-0">
          {background ? (
            <img src={background} className="w-full h-full object-cover opacity-40" alt="" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-900/20 via-[#020617] to-black"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-black/40"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 text-center shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-white/50"><X size={22}/></button>
          <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-lg">
             <IdCard size={32} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 uppercase tracking-tighter italic">متجر الآيديهات الملكية</h2>
          
          <div className="mt-4 bg-black/60 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between px-6 border border-white/5">
             <div className="flex flex-col items-start">
               <span className="text-[8px] font-black text-slate-500 uppercase">رصيدك الحالي</span>
               <div className="flex items-center gap-1">
                  <span className="font-black text-yellow-400 text-sm">{(Number(currentUser.coins || 0)).toLocaleString()}</span>
                  <Coins size={12} className="text-yellow-500" />
               </div>
             </div>
             <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                <ShoppingBag size={16} />
             </div>
          </div>
        </div>

        {/* Special IDs Grid (Two Columns) */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 scrollbar-hide pb-20">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">تحميل القائمة الملكية...</span>
             </div>
           ) : specialIds.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                 <Hash size={48} className="mx-auto mb-4" />
                 <p className="font-black text-sm">لا توجد آيديهات متاحة حالياً</p>
              </div>
           ) : (
             <div className="grid grid-cols-2 gap-3">
                {specialIds.filter(sid => !sid.isSold).map(sid => (
                   <motion.div 
                     whileHover={{ y: -5 }}
                     key={sid.id}
                     className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-4 flex flex-col items-center gap-4 group hover:border-amber-500/40 transition-all shadow-xl"
                   >
                      <div className="relative h-12 w-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                         <img src={sid.badgeUrl} className="h-full object-contain filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]" alt="" />
                         <span className="absolute text-white font-black text-[10px] tracking-tight pt-1">ID: {sid.customId}</span>
                      </div>
                      
                      <div className="w-full space-y-3">
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase mb-1">السعر المطلوب</span>
                            <div className="flex items-center gap-1 text-yellow-400 font-black text-[11px]">
                               <span>{sid.price.toLocaleString()}</span>
                               <Coins size={10} className="text-yellow-600" />
                            </div>
                         </div>
                         
                         <button 
                           onClick={() => onBuy(sid)}
                           className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-[10px] rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                         >
                            شراء فوراً <Sparkles size={12} />
                         </button>
                      </div>
                   </motion.div>
                ))}
             </div>
           )}
        </div>

        <div className="absolute bottom-4 left-0 right-0 z-20 px-6 pointer-events-none">
           <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <p className="text-[8px] text-slate-400 font-bold">عند الشراء سيتم تحديث الآيدي الخاص بك فوراً ومنحك الوسام الملكي.</p>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpecialIDShopModal;
