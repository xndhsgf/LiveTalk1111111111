
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { User } from '../../types';

interface SeatProps {
  index: number;
  speaker: User | null;
  onClick: (index: number) => void;
  currentUser: User;
  sizeClass: string;
  customSkin?: string;
  isHost?: boolean;
}

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || url.includes('video') || url.startsWith('data:video');
};

const Seat: React.FC<SeatProps> = ({ index, speaker, onClick, currentUser, sizeClass, customSkin, isHost }) => {
  const isUrlEmoji = speaker?.activeEmoji?.startsWith('http') || speaker?.activeEmoji?.startsWith('data:');

  return (
    <div className={`relative flex items-center justify-center ${sizeClass} shrink-0 overflow-visible`}>
      <button 
        onClick={() => onClick(index)} 
        className="w-full h-full relative group transition-transform active:scale-90 flex items-center justify-center overflow-visible"
      >
        {speaker ? (
          <div className="relative w-full h-full p-0.5 flex flex-col items-center justify-center overflow-visible">
            
            {/* مؤشر التحدث (هالة ضوئية) */}
            {!speaker.isMuted && (
              <motion.div 
                animate={{ 
                  scale: [1, 1.25, 1], 
                  opacity: [0.3, 0.6, 0.3],
                  boxShadow: [
                    "0 0 0px rgba(59,130,246,0)",
                    "0 0 20px rgba(59,130,246,0.6)",
                    "0 0 0px rgba(59,130,246,0)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 z-0 rounded-full bg-blue-500/20"
              />
            )}

            {/* صورة العضو */}
            <div className={`relative z-10 w-[88%] h-[88%] rounded-full overflow-hidden border-2 bg-slate-900 shadow-2xl flex items-center justify-center ${isHost ? 'border-amber-500/80 shadow-amber-500/20' : 'border-white/20'}`}>
              {isVideoUrl(speaker.avatar) ? (
                 <video src={speaker.avatar} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                 <img src={speaker.avatar} className="w-full h-full object-cover" alt={speaker.name} />
              )}
            </div>

            {/* إطار الـ VIP */}
            {speaker.frame && (
              <img 
                src={speaker.frame} 
                className="absolute inset-0 w-full h-full object-contain z-[120] scale-[1.28] pointer-events-none drop-shadow-lg" 
                alt="VIP Frame"
              />
            )}

            {/* التفاعلات (Emojis) */}
            <AnimatePresence mode="wait">
              {speaker.activeEmoji && (
                <motion.div
                  key={`${speaker.id}-${speaker.activeEmoji}`}
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{ opacity: 1, scale: 1.2, y: -5 }}
                  exit={{ opacity: 0, scale: 0.5, filter: 'blur(5px)' }}
                  className="absolute inset-0 z-[130] flex items-center justify-center pointer-events-none"
                >
                  {isUrlEmoji ? (
                     <img src={speaker.activeEmoji} className="w-[100%] h-[100%] object-contain drop-shadow-2xl" alt="" />
                  ) : (
                     <span className="text-4xl drop-shadow-2xl">{speaker.activeEmoji}</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* الاسم والكاريزما */}
            <div className="absolute -bottom-8 left-0 right-0 flex flex-col items-center gap-0.5 pointer-events-none z-[140]">
               <span className={`text-[7px] font-black truncate drop-shadow-md px-2 py-0.5 rounded-full max-w-[60px] border leading-none shadow-lg ${isHost ? 'bg-amber-500 text-black border-amber-600' : 'bg-black/80 text-white border-white/10'}`}>
                  {speaker.name}
               </span>
               <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/5 rounded-full shadow-xl">
                  <span className="text-yellow-400 font-black text-[6px] leading-none">
                     {(Number(speaker.charm || 0)).toLocaleString()}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse"></div>
               </div>
            </div>
          </div>
        ) : (
          /* مقعد فارغ */
          <div className="w-full h-full relative flex items-center justify-center overflow-visible">
            {customSkin ? (
               <div className="relative w-full h-full flex items-center justify-center">
                  <img src={customSkin} className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform" alt="Mic Skin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="p-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10 opacity-30 group-hover:opacity-60 transition-opacity">
                        <Mic size={10} className="text-white" />
                     </div>
                  </div>
               </div>
            ) : (
              /* الشكل الافتراضي للمقعد */
              <div className="w-[85%] h-[85%] rounded-full bg-white/5 backdrop-blur-sm border-2 border-white/10 flex items-center justify-center shadow-inner group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                 <Mic size={18} className="text-white/20" />
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default Seat;
