
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { User, GiftDisplaySize, GiftAnimationType } from '../../types';

interface GiftEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  giftAnimation: GiftAnimationType;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientIds: string[];
  quantity: number;
  duration?: number;
  displaySize?: GiftDisplaySize;
  timestamp: any;
}

const SmartVideoPlayer = ({ src, objectFit }: { src: string, objectFit: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().then(() => {
        setTimeout(() => { if (video) { video.muted = false; video.volume = 0.5; } }, 150);
      }).catch(() => {});
    }
  }, [src]);

  return (
    <video ref={videoRef} key={src} src={src} autoPlay playsInline webkit-playsinline="true" className={`w-full h-full ${objectFit}`} style={{ pointerEvents: 'none' }} />
  );
};

export const GiftAnimationLayer = forwardRef((props: any, ref) => {
  const { roomId, currentUserId, onActiveChange } = props;
  const [activeAnimations, setActiveAnimations] = useState<GiftEvent[]>([]);
  const playedIds = useRef(new Set<string>());

  useEffect(() => {
    if (onActiveChange) onActiveChange(activeAnimations.length > 0);
  }, [activeAnimations.length, onActiveChange]);

  const triggerAnimation = (event: GiftEvent) => {
    if (playedIds.current.has(event.id)) return;
    playedIds.current.add(event.id);
    setActiveAnimations(prev => [...prev, event]);
    setTimeout(() => {
      setActiveAnimations(prev => prev.filter(a => a.id !== event.id));
      setTimeout(() => playedIds.current.delete(event.id), 5000);
    }, (event.duration || 5) * 1000);
  };

  useImperativeHandle(ref, () => ({ trigger: triggerAnimation }));

  useEffect(() => {
    const q = query(collection(db, 'rooms', roomId, 'gift_events'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const event = { id: change.doc.id, ...data } as GiftEvent;
          if (event.senderId === currentUserId) return;
          const now = Date.now();
          const eventTime = data.timestamp?.toMillis ? data.timestamp.toMillis() : now;
          if (now - eventTime < 10000) triggerAnimation(event);
        }
      });
    });
    return () => unsubscribe();
  }, [roomId, currentUserId]);

  const getAnimationVariants = (type: GiftAnimationType) => {
    switch (type) {
      case 'shake': return { animate: { x: [-10, 10, -10, 10, 0], transition: { repeat: Infinity, duration: 0.4 } } };
      case 'glow': return { animate: { filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'], scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1 } } };
      case 'bounce': return { animate: { y: [0, -40, 0], transition: { repeat: Infinity, duration: 0.6 } } };
      case 'rotate': return { animate: { rotate: 360, transition: { repeat: Infinity, duration: 2, ease: "linear" } } };
      case 'slide-up': return { initial: { y: 200, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.8 } };
      case 'fly': return { initial: { x: -300, y: 100, rotate: -20 }, animate: { x: 300, y: -100, rotate: 20 }, transition: { duration: 3, ease: "linear" } };
      default: return { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.5, opacity: 0 } };
    }
  };

  return (
    <div className="absolute inset-0 z-[800] pointer-events-none overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {activeAnimations.map((event) => {
          const isFull = event.displaySize === 'full' || event.displaySize === 'max' || event.giftAnimation === 'full-screen';
          const sizeClass = event.displaySize === 'small' ? 'w-32 h-32' : event.displaySize === 'large' ? 'w-96 h-96' : isFull ? 'w-full h-full' : 'w-64 h-64';
          const variants = getAnimationVariants(event.giftAnimation);

          return (
            <motion.div 
              key={event.id}
              {...variants}
              className={`absolute flex flex-col items-center justify-center ${isFull ? 'inset-0 z-[1000]' : 'z-[800]'}`}
            >
              <div className={`${sizeClass} relative`}>
                 {event.giftIcon.includes('mp4') || event.giftIcon.includes('video') ? (
                    <SmartVideoPlayer src={event.giftIcon} objectFit={isFull ? "object-cover" : "object-contain"} />
                 ) : (
                    <img src={event.giftIcon} className={`w-full h-full ${isFull ? 'object-cover' : 'object-contain'}`} alt="" />
                 )}
                 {!isFull && event.quantity > 1 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} className="absolute -top-10 -right-10 bg-amber-500 text-white font-black text-4xl px-4 py-1 rounded-2xl shadow-xl italic border-2 border-white">X{event.quantity}</motion.div>
                 )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

export default GiftAnimationLayer;
