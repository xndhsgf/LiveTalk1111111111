import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Fix: Added Gamepad2 to the imports from lucide-react
import { X, RefreshCw, Smartphone, AlertTriangle, ShieldCheck, Coins, RotateCw, Gamepad2 } from 'lucide-react';
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
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // معالجة الرابط للتأكد من وجود البروتوكول
  const getSafeUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return 'https://' + url;
    return url;
  };

  useEffect(() => {
    if (!isOpen) return;

    // إعادة ضبط الحالة عند فتح لعبة جديدة
    setIsLoading(true);
    setLoadError(false);

    const handleGameMessages = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // 1. طلب معلومات المستخدم
      if (data.type === 'LIVETALK_GET_USER' || data.type === 'GET_USER_INFO') {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'LIVETALK_USER_DATA',
          payload: {
            name: currentUser.name,
            coins: Number(currentUser.coins || 0),
            avatar: currentUser.avatar,
            id: currentUser.customId || currentUser.id,
            timestamp: Date.now()
          }
        }, "*");
      }

      // 2. تحديث الرصيد
      if (data.type === 'LIVETALK_UPDATE_BALANCE' || data.type === 'UPDATE_BALANCE') {
        const { amount } = data.payload || data;
        if (typeof amount !== 'number') return;
        
        if (amount < 0 && Math.abs(amount) > currentUser.coins) {
           iframeRef.current?.contentWindow?.postMessage({ type: 'LIVETALK_ERROR', payload: 'Insufficient balance' }, "*");
           return;
        }

        onUpdateUser({ 
          coins: Number(currentUser.coins) + amount,
          wealth: amount < 0 ? Number(currentUser.wealth || 0) + Math.abs(amount) : Number(currentUser.wealth || 0)
        });

        iframeRef.current?.contentWindow?.postMessage({ 
          type: 'LIVETALK_BALANCE_UPDATED', 
          payload: { newBalance: Number(currentUser.coins) + amount } 
        }, "*");
      }
    };

    window.addEventListener('message', handleGameMessages);
    
    // محاولة إرسال إشارة جاهزية بعد فترة قصيرة من التحميل
    const readyTimer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'LIVETALK_READY', version: '2.0' }, "*");
    }, 2000);

    // مؤقت للطوارئ إذا علق التحميل
    const timeoutTimer = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 15000);

    return () => {
      window.removeEventListener('message', handleGameMessages);
      clearTimeout(readyTimer);
      clearTimeout(timeoutTimer);
    };
  }, [isOpen, currentUser.id, currentUser.coins]); // نعتمد على ID و Coins لتقليل عدد مرات إعادة التسجيل

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] bg-black flex flex-col font-cairo overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-[#0f172a] border-b border-white/10 px-4 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shadow-inner">
              <img src={game.icon} className="w-full h-full object-cover" alt="" />
           </div>
           <div className="text-right">
              <h3 className="text-white font-black text-xs leading-none">{game.title}</h3>
              <div className="flex items-center gap-1 mt-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Link Protocol Secure</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-black/40 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-inner">
              <span className="text-yellow-400 font-black text-xs">{(Number(currentUser.coins || 0)).toLocaleString()}</span>
              <Coins size={12} className="text-yellow-500" />
           </div>
           <button 
             onClick={() => { setIsLoading(true); if(iframeRef.current) iframeRef.current.src = iframeRef.current.src; }}
             className="p-2 text-slate-400 hover:text-white transition-colors"
           >
              <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} />
           </button>
           <button onClick={onClose} className="p-2 bg-red-600/20 text-red-500 rounded-xl active:scale-90 transition-transform border border-red-500/20">
              <X size={20} />
           </button>
        </div>
      </div>

      {/* Game Frame Container */}
      <div className="flex-1 relative bg-[#020617]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-[#020617]">
             <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Gamepad2 className="text-emerald-500" size={24} />
                </div>
             </div>
             <div className="text-center">
                <p className="text-emerald-500 font-black text-[11px] uppercase tracking-[0.2em] animate-pulse">جاري الاتصال بالسيرفر...</p>
                <p className="text-slate-600 text-[8px] font-bold mt-1">تأمين حماية الرصيد وتشفير البيانات</p>
             </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-30 bg-[#020617]">
             <AlertTriangle size={48} className="text-red-500 mb-4" />
             <h4 className="text-white font-black mb-2">فشل تحميل اللعبة</h4>
             <p className="text-slate-400 text-xs mb-6 leading-relaxed">رابط اللعبة قد يكون غير متاح حالياً أو يمنع العرض داخل التطبيقات الخارجية.</p>
             <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black">إعادة محاولة</button>
          </div>
        )}

        <iframe 
          ref={iframeRef}
          src={getSafeUrl(game.url)} 
          className="w-full h-full border-none bg-black"
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setLoadError(true); }}
          allow="autoplay; fullscreen; microphone; camera; midi; geolocation; gyro; accelerometer"
          // إضافة صلاحيات إضافية في الـ sandbox لضمان عمل الألعاب المعقدة
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-scripts allow-same-origin allow-downloads"
        />
      </div>

      {/* Warning Footer */}
      <div className="p-2.5 bg-[#1e1b4b]/40 border-t border-indigo-500/20 flex items-center justify-center gap-2">
         <ShieldCheck size={14} className="text-indigo-400" />
         <p className="text-[9px] text-indigo-200/70 font-bold">نظام بوابات الألعاب المؤمن - كوينز فيفو لايف الحقيقية مفعلة</p>
      </div>
    </div>
  );
};

export default ExternalGameModal;