
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Smartphone, AlertTriangle, ShieldCheck, Coins } from 'lucide-react';
import { User, ExternalGame } from '../types';

interface ExternalGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: ExternalGame;
  currentUser: User;
  onUpdateUser: (data: Partial<User>) => void;
}

const ExternalGameModal: React.FC<ExternalGameModalProps> = ({ isOpen, onClose, game, currentUser, onUpdateUser }) => {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // معالج الرسائل القادمة من اللعبة الخارجية
    const handleGameMessages = (event: MessageEvent) => {
      // يمكنك هنا إضافة فحص الـ Origin لزيادة الأمان إذا كانت اللعبة على دومين معروف
      // if (event.origin !== "https://trusted-game-site.com") return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // 1. طلب معلومات المستخدم (الرصيد)
      if (data.type === 'LIVETALK_GET_USER') {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'LIVETALK_USER_DATA',
          payload: {
            name: currentUser.name,
            coins: Number(currentUser.coins || 0),
            avatar: currentUser.avatar,
            id: currentUser.customId || currentUser.id
          }
        }, "*");
      }

      // 2. تحديث الرصيد (ربح أو خسارة)
      if (data.type === 'LIVETALK_UPDATE_BALANCE') {
        const { amount, reason } = data.payload;
        if (typeof amount !== 'number') return;
        
        // التحقق من الرصيد في حالة الخصم
        if (amount < 0 && Math.abs(amount) > currentUser.coins) {
           iframeRef.current?.contentWindow?.postMessage({ type: 'LIVETALK_ERROR', payload: 'Insufficient balance' }, "*");
           return;
        }

        // تحديث الرصيد في قاعدة البيانات والواجهة
        onUpdateUser({ 
          coins: Number(currentUser.coins) + amount,
          wealth: amount < 0 ? Number(currentUser.wealth || 0) + Math.abs(amount) : Number(currentUser.wealth || 0)
        });

        // إرسال تأكيد للعبة
        iframeRef.current?.contentWindow?.postMessage({ 
          type: 'LIVETALK_BALANCE_UPDATED', 
          payload: { newBalance: Number(currentUser.coins) + amount } 
        }, "*");
      }
    };

    window.addEventListener('message', handleGameMessages);
    return () => window.removeEventListener('message', handleGameMessages);
  }, [isOpen, currentUser, onUpdateUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] bg-black flex flex-col font-cairo overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-white/5 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
           <img src={game.icon} className="w-8 h-8 rounded-lg object-cover border border-white/10" alt="" />
           <div className="text-right">
              <h3 className="text-white font-black text-xs leading-none">{game.title}</h3>
              <div className="flex items-center gap-1 mt-1">
                 <ShieldCheck size={10} className="text-emerald-500" />
                 <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Real Coins Link Active</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-black/40 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <span className="text-yellow-400 font-black text-xs">{(Number(currentUser.coins || 0)).toLocaleString()}</span>
              <Coins size={12} className="text-yellow-500" />
           </div>
           <button onClick={onClose} className="p-2 bg-red-600/20 text-red-500 rounded-xl active:scale-90 transition-transform">
              <X size={20} />
           </button>
        </div>
      </div>

      {/* Game Frame */}
      <div className="flex-1 relative bg-[#020617]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-[#020617]">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest animate-pulse">جاري ربط الرصيد الحقيقي باللعبة...</p>
          </div>
        )}
        <iframe 
          ref={iframeRef}
          src={game.url} 
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          allow="autoplay; fullscreen; microphone"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-scripts allow-same-origin"
        />
      </div>

      {/* Warning Footer */}
      <div className="p-2 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-center gap-2">
         <AlertTriangle size={12} className="text-amber-500" />
         <p className="text-[8px] text-slate-400 font-bold">تنبيه: الكوينز في هذه اللعبة حقيقية وسيتم خصمها أو إضافتها لحسابك في التطبيق فوراً.</p>
      </div>
    </div>
  );
};

export default ExternalGameModal;
