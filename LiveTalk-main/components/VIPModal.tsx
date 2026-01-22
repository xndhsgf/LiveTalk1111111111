
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, ArrowUpCircle, Coins, Sparkles, Star, ChevronLeft, Clock } from 'lucide-react';
import { VIPPackage, User } from '../types';

interface VIPModalProps {
  user: User;
  vipLevels: VIPPackage[];
  onClose: () => void;
  onBuy: (vip: VIPPackage) => void;
}

const VIPModal: React.FC<VIPModalProps> = ({ user, vipLevels, onClose, onBuy }) => {
  const [selectedVip, setSelectedVip] = useState<VIPPackage | null>(null);

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm bg-gradient-to-br from-[#0a0a0c] via-[#1a1f35] to-[#0a0a0c] rounded-[3rem] border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col h-[85vh] font-cairo"
        dir="rtl"
      >
        {/* Animated Background Lights */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ repeat: Infinity, duration: 5 }}
          className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500 blur-[100px] rounded-full pointer-events-none"
        />

        {/* Header Section */}
        <div className="relative p-8 text-center flex-shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/30 hover:text-white transition-all active:scale-90 bg-white/5 rounded-full">
             <X size={24} />
          </button>
          
          <motion.div 
            animate={{ rotateY: 360 }} 
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="inline-block p-5 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-600 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-white/20"
          >
             <Crown size={40} className="text-white drop-shadow-lg" fill="currentColor" />
          </motion.div>
          
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 uppercase tracking-tighter">
             العضويات الملكية
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Royal VIP Memberships</p>
          
          <div className="mt-6 bg-black/40 rounded-3xl p-3 flex items-center justify-between px-6 border border-white/5 shadow-inner">
             <div className="flex flex-col items-start">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">رصيدك المتاح</span>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-black text-yellow-400 text-lg tracking-tighter">
                    {(user.coins ?? 0).toLocaleString()}
                  </span>
                  <Coins size={14} className="text-yellow-500" />
               </div>
             </div>
             <div className="h-8 w-[1px] bg-white/5"></div>
             <div className="flex flex-col items-end">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">المستوى الحالي</span>
               <span className="text-xs font-black text-amber-500 mt-0.5">LV.{user.vipLevel || 0}</span>
             </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pb-24">
           {vipLevels.length === 0 ? (
             <div className="text-center py-20 text-slate-500 text-xs font-bold flex flex-col items-center gap-4 opacity-50">
                <Star size={40} />
                لا توجد مستويات VIP متاحة حالياً
             </div>
           ) : (
             vipLevels.sort((a,b) => a.level - b.level).map((vip) => {
               const isCurrentLevel = user.isVip && user.vipLevel === vip.level;
               const canAfford = Number(user.coins || 0) >= vip.cost;
               const isSelected = selectedVip?.level === vip.level;

               return (
                 <motion.div 
                   key={vip.level} 
                   layout
                   onClick={() => setSelectedVip(isSelected ? null : vip)}
                   className={`relative rounded-[2.5rem] p-5 border transition-all duration-500 cursor-pointer overflow-hidden group ${
                     isSelected 
                       ? 'bg-amber-950/20 border-amber-500/60 shadow-2xl ring-1 ring-amber-500/20' 
                       : isCurrentLevel
                         ? 'bg-emerald-950/10 border-emerald-500/40'
                         : 'bg-white/5 border-white/5 hover:bg-white/10'
                   }`}
                 >
                   <div className="flex items-center gap-5 relative z-10">
                      <div className="relative w-20 h-20 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                         <div className="absolute inset-1 rounded-full border border-white/5 bg-black/40 overflow-hidden">
                            <img src={user.avatar} className="w-full h-full object-cover opacity-20 grayscale" alt="" />
                         </div>
                         <img src={vip.frameUrl} className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl scale-[1.3]" alt="" />
                         <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white text-[8px] px-2 py-0.5 rounded-full border border-white/20 font-black shadow-lg">
                            LV.{vip.level}
                         </div>
                      </div>

                      <div className="flex-1 text-right">
                         <div className="flex items-center gap-2 justify-end mb-1">
                            {isCurrentLevel && <div className="bg-emerald-500 p-0.5 rounded-full"><Check size={8} className="text-white" strokeWidth={4} /></div>}
                            <h3 className={`font-black text-xl ${vip.color}`}>{vip.name}</h3>
                         </div>
                         <div className="flex items-center gap-3 justify-end">
                            <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg">
                               <span className="text-emerald-400 font-black text-[10px]">{vip.durationDays || 30} يوم</span>
                               <Clock size={10} className="text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-1">
                               <span className="text-yellow-500 font-black text-sm tracking-tighter">{vip.cost.toLocaleString()}</span>
                               <Coins size={10} className="text-yellow-600" />
                            </div>
                         </div>
                      </div>

                      <div className="shrink-0">
                         <motion.div 
                           animate={{ rotate: isSelected ? 180 : 0 }}
                           className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500"
                         >
                            <ChevronLeft size={20} />
                         </motion.div>
                      </div>
                   </div>

                   <AnimatePresence>
                     {isSelected && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="mt-6 pt-5 border-t border-white/10 overflow-hidden"
                       >
                          <h4 className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Sparkles size={12} /> مميزات الرتبة:
                          </h4>
                          <div className="grid gap-2 mb-6">
                             {(vip.privileges || ['إطار خاص للملف الشخصي', 'ظهور مميز في قائمة الغرفة']).map((perk, i) => (
                               <div key={i} className="flex items-center gap-2 text-right">
                                  <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></div>
                                  <span className="text-xs text-slate-300 font-bold">{perk}</span>
                               </div>
                             ))}
                             <div className="flex items-center gap-2 text-right">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></div>
                                <span className="text-xs text-emerald-400 font-bold">مدة التفعيل: {vip.durationDays || 30} يوم</span>
                             </div>
                          </div>

                          <button 
                             disabled={!canAfford}
                             onClick={(e) => {
                                 e.stopPropagation();
                                 if(confirm(`تفعيل رتبة ${vip.name} مقابل ${vip.cost.toLocaleString()} كوينز لمدة ${vip.durationDays || 30} يوم؟`)) {
                                     onBuy(vip);
                                 }
                             }}
                             className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 ${
                                canAfford 
                                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black border border-white/20' 
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 opacity-50'
                             }`}
                          >
                             {isCurrentLevel ? 'تجديد الاشتراك الملكي' : 'تفعيل العضوية الآن'}
                             <ArrowUpCircle size={18} />
                          </button>
                          {!canAfford && <p className="text-[9px] text-red-400 font-black text-center mt-3 animate-pulse">رصيدك لا يكفي لتفعيل هذا المستوى ❌</p>}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </motion.div>
               );
             })
           )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-black/80 border-t border-white/5 text-center flex-shrink-0 relative z-20">
           <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
             <div className="w-1 h-1 rounded-full bg-slate-800"></div>
             Vivo Official Royal Ranking System
             <div className="w-1 h-1 rounded-full bg-slate-800"></div>
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VIPModal;
