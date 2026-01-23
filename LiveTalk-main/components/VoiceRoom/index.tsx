
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, collection, addDoc, updateDoc, increment, serverTimestamp, writeBatch, onSnapshot, getDoc, query, orderBy, limit, where, Timestamp, setDoc, deleteDoc, arrayUnion, getDocs } from 'firebase/firestore';
import { Gift, Room, User, LuckyMultiplier, GameType, LuckyBag, CPPartner, ExternalGame } from '../../types';
import { EconomyEngine } from '../../services/economy';
import { agoraService } from '../../services/agora';

// استيراد المكونات
import RoomBackground from './RoomBackground';
import RoomHeader from './RoomHeader';
import GiftAnimationLayer from './GiftAnimationLayer';
import EntryAnimationLayer from './EntryAnimationLayer'; 
import Seat from './Seat';
import ComboButton from './ComboButton';
import ControlBar from './ControlBar';
import ReactionPicker from './ReactionPicker';
import GiftModal from '../GiftModal';
import RoomSettingsModal from '../RoomSettingsModal';
import RoomRankModal from '../RoomRankModal';
import RoomToolsModal from './RoomToolsModal'; 
import LuckyBagModal from '../LuckyBagModal';
import LuckyBagActive from '../LuckyBagActive';
import UserProfileSheet from '../UserProfileSheet';
import GameCenterModal from '../GameCenterModal';
import WheelGameModal from '../WheelGameModal';
import SlotsGameModal from '../SlotsGameModal';
import LionWheelGameModal from '../LionWheelGameModal';
import ExternalGameModal from '../ExternalGameModal';
import RoomMembersModal from './RoomMembersModal';
import WinStrip from '../WinStrip';
import EditProfileModal from '../EditProfileModal';
import { AnimatePresence, motion } from 'framer-motion';

// دالة الحساب الفورية للمستوى
const calculateLiveLvl = (pts: number) => {
  if (!pts || pts <= 0) return 1;
  const l = Math.floor(Math.sqrt(pts / 50000)); 
  return Math.max(1, Math.min(200, l));
};

const ChatLevelBadge: React.FC<{ level: number; type: 'wealth' | 'recharge' }> = ({ level, type }) => {
  const isWealth = type === 'wealth';
  return (
    <div className="relative h-[20px] min-w-[65px] flex items-center pr-3 group cursor-default shrink-0">
      <div className={`absolute inset-0 right-3 rounded-l-md border border-amber-500/60 shadow-lg ${
        isWealth 
          ? 'bg-gradient-to-r from-[#6a29e3] to-[#8b5cf6]' 
          : 'bg-[#121212]'
      }`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      </div>
      <div className="relative z-10 flex-1 text-center pl-1 pr-1">
        <span className="text-[11px] font-black italic tracking-tighter text-white drop-shadow-md leading-none block transform translate-y-[0.5px]">
          {level}
        </span>
      </div>
      <div className="relative z-20 w-[22px] h-[22px] flex items-center justify-center -mr-2">
        <div className={`absolute inset-0 rounded-sm transform rotate-45 border border-amber-500 shadow-md ${
          isWealth ? 'bg-[#7c3aed]' : 'bg-[#000]'
        }`}></div>
        <span className="relative z-30 text-[10px] mb-0.5 drop-shadow-md select-none">👑</span>
      </div>
    </div>
  );
};

const VoiceRoom: React.FC<any> = ({ 
  room: initialRoom, onLeave, onMinimize, currentUser, gifts, gameSettings, onUpdateRoom, 
  isMuted, onToggleMute, onUpdateUser, users, onEditProfile, onAnnouncement, onOpenPrivateChat,
  giftCategoryLabels, isMinimized, externalGames = []
}) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [showGifts, setShowGifts] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showLuckyBag, setShowLuckyBag] = useState(false);
  const [activeBags, setActiveBags] = useState<LuckyBag[]>([]);
  const [showGameCenter, setShowGameCenter] = useState(false);
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [selectedExternalGame, setSelectedExternalGame] = useState<ExternalGame | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [micSkins, setMicSkins] = useState<Record<number, string>>({});
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  
  const [isGiftActive, setIsGiftActive] = useState(false);
  const [isEntryActive, setIsEntryActive] = useState(false);
  
  const [sessionStartTime] = useState<number>(Date.now());
  const [localSpeakers, setLocalSpeakers] = useState<any[]>(initialRoom.speakers || []);
  const [localMicCount, setLocalMicCount] = useState<number>(Number(initialRoom.micCount || 8));
  const [comboState, setComboState] = useState<{gift: Gift, recipients: string[], count: number} | null>(null);
  const [luckyWinAmount, setLuckyWinAmount] = useState<number>(0); 
  
  const [activeListeners, setActiveListeners] = useState<User[]>([]);
  
  const comboExpireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSentEntryRef = useRef<boolean>(false); 
  const pendingRoomSpeakers = useRef<any[] | null>(null);
  const roomSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const giftAnimRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isHost = room.hostId === currentUser.id;
  const isHeaderVisible = true;

  // --- ربط Agora Voice مع معالجة الأخطاء والدورة الحياتية ---
  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      try {
        await agoraService.join(initialRoom.id, currentUser.id);
        if (isMounted) {
          const onMic = localSpeakers.some(s => s.id === currentUser.id);
          if (onMic) await agoraService.publishAudio();
          await agoraService.setMute(isMuted);
        }
      } catch (err) {
        // تجاهل الخطأ في الكونسول إذا كان بسبب تنقل سريع
      }
    };

    connect();

    return () => {
      isMounted = false;
      agoraService.leave();
    };
  }, [initialRoom.id, currentUser.id]);

  useEffect(() => {
    agoraService.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const onMic = localSpeakers.some(s => s.id === currentUser.id);
    if (onMic) {
      agoraService.publishAudio();
    } else {
      agoraService.unpublishAudio();
    }
  }, [localSpeakers.length]); // نعتمد على طول المصفوفة للكشف عن الصعود والنزول

  useEffect(() => {
    const listenerRef = doc(db, 'rooms', initialRoom.id, 'active_listeners', currentUser.id);
    setDoc(listenerRef, { id: currentUser.id, customId: currentUser.customId, name: currentUser.name, avatar: currentUser.avatar, wealthLevel: calculateLiveLvl(Number(currentUser.wealth || 0)), joinedAt: serverTimestamp() });
    return () => { deleteDoc(listenerRef).catch(() => {}); };
  }, [initialRoom.id, currentUser.id]);

  useEffect(() => {
    const q = query(collection(db, 'rooms', initialRoom.id, 'active_listeners'), orderBy('joinedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listeners = snapshot.docs.map(doc => doc.data() as User);
      setActiveListeners(listeners);
      if (isHost) updateDoc(doc(db, 'rooms', initialRoom.id), { listeners: listeners.length });
    });
    return () => unsubscribe();
  }, [initialRoom.id, isHost]);

  useEffect(() => {
     if (!hasSentEntryRef.current && currentUser.activeEntry && currentUser.activeEntry !== '') {
        hasSentEntryRef.current = true;
        addDoc(collection(db, 'rooms', initialRoom.id, 'entry_events'), { userId: currentUser.id, userName: currentUser.name, videoUrl: currentUser.activeEntry, timestamp: serverTimestamp() }).catch(() => { hasSentEntryRef.current = false; });
     }
  }, [initialRoom.id, currentUser.id, currentUser.activeEntry]);

  useEffect(() => {
    const unsubRoom = onSnapshot(doc(db, 'rooms', initialRoom.id), (snap) => {
      if (snap.exists()) {
        const roomData = { id: snap.id, ...snap.data() } as Room;
        setRoom(roomData);
        setLocalSpeakers(roomData.speakers || []);
        if (!roomSyncTimerRef.current) setLocalMicCount(Number(roomData.micCount || 8));
      }
    });
    return () => unsubRoom();
  }, [initialRoom.id]);

  const queueRoomSpeakersUpdate = useCallback((updatedSpeakers: any[], updatedMicCount?: number) => {
    pendingRoomSpeakers.current = (updatedSpeakers || []).map(s => ({ id: s.id || '', customId: s.customId || null, name: s.name || 'مستخدم', avatar: s.avatar || '', seatIndex: Number(s.seatIndex) ?? 0, isMuted: !!s.isMuted, charm: Number(s.charm || 0), activeEmoji: s.activeEmoji || null, frame: s.frame || null }));
    const mCount = updatedMicCount || localMicCount;
    if (roomSyncTimerRef.current) clearTimeout(roomSyncTimerRef.current);
    roomSyncTimerRef.current = setTimeout(async () => {
      if (pendingRoomSpeakers.current) {
        try { await updateDoc(doc(db, 'rooms', initialRoom.id), { speakers: pendingRoomSpeakers.current, micCount: mCount }); } catch (e) {}
        pendingRoomSpeakers.current = null;
      }
      roomSyncTimerRef.current = null;
    }, 2500); 
  }, [initialRoom.id, localMicCount]);

  useEffect(() => {
    const q = query(collection(db, 'lucky_bags'), where('roomId', '==', initialRoom.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const bags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LuckyBag)).filter(bag => (bag.expiresAt?.toMillis ? bag.expiresAt.toMillis() : 0) > now);
      setActiveBags(bags);
    });
    return () => unsub();
  }, [initialRoom.id]);

  useEffect(() => {
    const messagesRef = collection(db, 'rooms', initialRoom.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((msg: any) => (msg.timestamp?.toMillis ? msg.timestamp.toMillis() : Date.now()) >= sessionStartTime);
      setMessages(msgs.reverse());
      setTimeout(() => { if (messagesEndRef.current && chatContainerRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, 100);
    });
    return () => unsubscribe();
  }, [initialRoom.id, sessionStartTime]);

  const handleSendGift = (gift: Gift, quantity: number) => {
    if (selectedRecipientIds.length === 0) return alert('اختر مستلماً أولاً');
    setShowGifts(false);
    const totalCost = gift.cost * quantity * selectedRecipientIds.length;
    if (Number(currentUser.coins || 0) < totalCost) return alert('رصيدك لا يكفي!');
    
    if (giftAnimRef.current) {
      giftAnimRef.current.trigger({ id: 'local-' + Date.now(), giftId: gift.id, giftName: gift.name, giftIcon: gift.icon, giftAnimation: gift.animationType || 'pop', senderId: currentUser.id, senderName: currentUser.name, senderAvatar: currentUser.avatar, recipientIds: selectedRecipientIds, quantity, duration: gift.duration || 5, displaySize: gift.displaySize || 'medium', timestamp: Timestamp.now() });
    }

    let winAmount = 0;
    if (gift.category === 'lucky') {
      const isWin = (Math.random() * 100) < (gameSettings.luckyGiftWinRate || 30);
      if (isWin && gameSettings.luckyMultipliers?.length > 0) {
        const totalChance = gameSettings.luckyMultipliers.reduce((s, m) => s + m.chance, 0);
        let r = Math.random() * totalChance;
        let picked = gameSettings.luckyMultipliers[0];
        for (const m of gameSettings.luckyMultipliers) { if (r < m.chance) { picked = m; break; } r -= m.chance; }
        winAmount = gift.cost * quantity * picked.value;
      }
    }
    
    onUpdateUser({ coins: Number(currentUser.coins) - totalCost + winAmount, wealth: Number(currentUser.wealth || 0) + totalCost });
    const updatedSpeakers = localSpeakers.map((s: any) => selectedRecipientIds.includes(s.id) ? { ...s, charm: (Number(s.charm) || 0) + (gift.cost * quantity) } : s);
    setLocalSpeakers(updatedSpeakers);
    if (winAmount > 0) { setLuckyWinAmount(winAmount); setTimeout(() => setLuckyWinAmount(0), 6000); }
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', currentUser.id), { coins: increment(-totalCost + winAmount), wealth: increment(totalCost) });
    selectedRecipientIds.forEach(rid => {
      const val = gift.cost * quantity;
      batch.update(doc(db, 'users', rid), { charm: increment(val), diamonds: increment(val * 0.7) });
      batch.set(doc(db, 'rooms', initialRoom.id, 'contributors', currentUser.id), { userId: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, amount: increment(val) }, { merge: true });
    });
    batch.set(doc(collection(db, 'rooms', initialRoom.id, 'gift_events')), { giftId: gift.id, giftName: gift.name, giftIcon: gift.icon, giftAnimation: gift.animationType || 'pop', senderId: currentUser.id, senderName: currentUser.name, recipientIds: selectedRecipientIds, quantity, duration: gift.duration || 5, displaySize: gift.displaySize || 'medium', timestamp: serverTimestamp() });
    batch.set(doc(collection(db, 'rooms', initialRoom.id, 'messages')), { userId: currentUser.id, userName: currentUser.name, userWealthLevel: calculateLiveLvl(Number(currentUser.wealth || 0) + totalCost), userRechargeLevel: calculateLiveLvl(Number(currentUser.rechargePoints || 0)), content: winAmount > 0 ? `أرسل ${gift.name} x${quantity} وفاز بـ ${winAmount.toLocaleString()} 🪙!` : `أرسل ${gift.name} x${quantity} 🎁`, type: 'gift', isLuckyWin: winAmount > 0, timestamp: serverTimestamp() });
    batch.commit();
    queueRoomSpeakersUpdate(updatedSpeakers);
    setComboState({ gift, recipients: [...selectedRecipientIds], count: quantity });
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    addDoc(collection(db, 'rooms', initialRoom.id, 'messages'), { userId: currentUser.id, userName: currentUser.name, userWealthLevel: calculateLiveLvl(Number(currentUser.wealth || 0)), userRechargeLevel: calculateLiveLvl(Number(currentUser.rechargePoints || 0)), userAchievements: currentUser.achievements || [], userBubble: currentUser.activeBubble || null, userVip: currentUser.isVip || false, content: text, type: 'text', timestamp: serverTimestamp() });
  };

  const handleSeatClick = (index: number) => {
    const s = localSpeakers.find(s => s.seatIndex === index);
    if (s) { setSelectedUserForProfile(s); setShowProfileSheet(true); }
    else {
      const updated = [...localSpeakers.filter(s => s.id !== currentUser.id), { id: currentUser.id, customId: currentUser.customId, name: currentUser.name, avatar: currentUser.avatar, seatIndex: index, isMuted, charm: (localSpeakers.find(s => s.id === currentUser.id)?.charm || 0), activeEmoji: null, frame: currentUser.frame || null }];
      setLocalSpeakers(updated);
      queueRoomSpeakersUpdate(updated);
    }
  };

  const handleToolAction = (action: string) => {
    setShowTools(false);
    switch (action) {
      case 'settings': setShowSettings(true); break;
      case 'rank': setShowRank(true); break;
      case 'luckybag': setShowLuckyBag(true); break;
      case 'mic_layout':
        const nextCount = localMicCount === 8 ? 10 : localMicCount === 10 ? 15 : localMicCount === 15 ? 20 : 8;
        setLocalMicCount(nextCount);
        queueRoomSpeakersUpdate(localSpeakers, nextCount);
        break;
      case 'reset_charm':
        if (confirm('هل تريد تصفير كاريزما الجميع؟')) {
          const updated = localSpeakers.map(s => ({ ...s, charm: 0 }));
          setLocalSpeakers(updated);
          queueRoomSpeakersUpdate(updated);
        }
        break;
      case 'clear_chat':
        setMessages([]);
        break;
    }
  };

  const handleSendLuckyBag = async (amount: number, recipients: number) => {
    if (currentUser.coins < amount) return alert('رصيدك لا يكفي');
    const bagId = 'bag_' + Date.now();
    const expiresAt = new Date(Date.now() + 5 * 60000);
    await setDoc(doc(db, 'lucky_bags', bagId), { id: bagId, senderId: currentUser.id, senderName: currentUser.name, senderAvatar: currentUser.avatar, roomId: initialRoom.id, roomTitle: room.title, totalAmount: amount, remainingAmount: amount, recipientsLimit: recipients, claimedBy: [], createdAt: serverTimestamp(), expiresAt: Timestamp.fromDate(expiresAt) });
    onUpdateUser({ coins: currentUser.coins - amount, wealth: (currentUser.wealth || 0) + amount });
  };

  const handleLeaveMic = () => {
    const updated = localSpeakers.filter(s => s.id !== currentUser.id);
    setLocalSpeakers(updated);
    queueRoomSpeakersUpdate(updated);
  };

  const renderSeatsLayout = () => {
    const sz = localMicCount === 20 ? 'w-11 h-11' : localMicCount === 15 ? 'w-[52px] h-[52px]' : 'w-[72px] h-[72px]';
    return (
      <div className={`grid ${localMicCount === 10 ? 'grid-cols-4' : localMicCount >= 15 ? 'grid-cols-5' : 'grid-cols-4'} gap-x-4 gap-y-12 w-full max-w-sm mx-auto justify-items-center items-center overflow-visible`}>
        {Array.from({ length: localMicCount }).map((_, i) => (<Seat key={i} index={i} speaker={localSpeakers.find(s => s.seatIndex === i) || null} isHost={localSpeakers.find(s => s.seatIndex === i)?.id === room.hostId} currentUser={currentUser} sizeClass={sz} customSkin={micSkins[localMicCount]} onClick={() => handleSeatClick(i)} />))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-slate-950 font-cairo overflow-hidden text-right">
      <RoomBackground background={room.background} />
      <GiftAnimationLayer ref={giftAnimRef} roomId={initialRoom.id} speakers={localSpeakers} currentUserId={currentUser.id} onActiveChange={setIsGiftActive} />
      <EntryAnimationLayer roomId={initialRoom.id} currentUserId={currentUser.id} onActiveChange={setIsEntryActive} />
      <RoomHeader room={room} onLeave={onLeave} onMinimize={onMinimize} onShowMembers={() => setShowMembers(true)} isVisible={isHeaderVisible} listenerCount={activeListeners.length} />
      <AnimatePresence>
        {luckyWinAmount > 0 && <WinStrip amount={luckyWinAmount} />}
        {activeBags.map(bag => (<LuckyBagActive key={bag.id} bag={bag as any} isClaimed={bag.claimedBy.includes(currentUser.id)} onClaim={() => {
           const share = Math.floor(bag.totalAmount / bag.recipientsLimit);
           onUpdateUser({ coins: currentUser.coins + share });
           setLuckyWinAmount(share); setTimeout(() => setLuckyWinAmount(0), 4000);
           updateDoc(doc(db, 'lucky_bags', bag.id), { remainingAmount: increment(-share), claimedBy: arrayUnion(currentUser.id) });
        }} />))}
      </AnimatePresence>
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-4 overflow-visible">{renderSeatsLayout()}</div>
        <div className="h-64 px-4 mb-4 overflow-hidden relative z-[60]" dir="rtl">
           <div ref={chatContainerRef} className="h-full overflow-y-auto scrollbar-hide space-y-4 flex flex-col pb-4 pointer-events-auto touch-pan-y">
              <div className="flex-1" />
              {messages.map((msg) => (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className="flex items-start gap-2">
                   <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                         <ChatLevelBadge level={msg.userWealthLevel || 1} type="wealth" />
                         <ChatLevelBadge level={msg.userRechargeLevel || 1} type="recharge" />
                         <span className={`text-[12px] font-black drop-shadow-lg shrink-0 ${msg.userVip ? 'text-amber-400' : 'text-blue-300'}`}>{msg.userName}</span>
                         <div className="flex items-center gap-1 mr-1">{msg.userAchievements?.slice(0, 5).map((medal: string, idx: number) => (<img key={idx} src={medal} className="w-8 h-8 object-contain filter drop-shadow-md brightness-110" alt="medal" />))}</div>
                      </div>
                      <div className={`relative min-h-[42px] w-fit max-w-[260px] px-7 py-3 flex items-center justify-center text-center shadow-2xl transition-all ${msg.isLuckyWin ? 'bg-gradient-to-r from-amber-600/40 to-yellow-500/40 border border-amber-500/50 rounded-2xl' : !msg.userBubble ? 'bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl rounded-tr-none' : ''}`} style={msg.userBubble ? { backgroundImage: `url(${msg.userBubble})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', minWidth: '95px' } : {}}>
                         <p className={`text-[13px] font-black text-white leading-relaxed break-words drop-shadow-0_1px_3px_rgba(0,0,0,0.8) ${msg.isLuckyWin ? 'text-yellow-200' : ''}`}>{msg.content}</p>
                      </div>
                   </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
           </div>
        </div>
        <AnimatePresence>{comboState && <ComboButton gift={comboState.gift} count={comboState.count} onHit={() => { setComboState(p => p ? { ...p, count: p.count + 1 } : null); const giftValue = comboState.gift.cost; onUpdateUser({ coins: Number(currentUser.coins) - giftValue, wealth: Number(currentUser.wealth || 0) + giftValue }); setLocalSpeakers(localSpeakers.map(s => comboState.recipients.includes(s.id) ? { ...s, charm: (Number(s.charm) || 0) + giftValue } : s)); }} duration={5000} />}</AnimatePresence>
        <ControlBar isMuted={isMuted} onToggleMute={onToggleMute} onShowGifts={() => setShowGifts(true)} onShowGames={() => setShowGameCenter(true)} onShowRoomTools={() => setShowTools(true)} onSendMessage={handleSendMessage} onShowEmojis={() => setShowEmojis(true)} userCoins={Number(currentUser.coins)} />
      </div>
      <ReactionPicker isOpen={showEmojis} emojis={gameSettings.availableEmojis} onSelect={(emoji) => {
         const onMic = localSpeakers.find((s: any) => s.id === currentUser.id);
         if (!onMic) return;
         if (emojiTimerRef.current) clearTimeout(emojiTimerRef.current);
         const updated = localSpeakers.map((s: any) => s.id === currentUser.id ? { ...s, activeEmoji: emoji } : s);
         setLocalSpeakers(updated); queueRoomSpeakersUpdate(updated);
         emojiTimerRef.current = setTimeout(() => {
           const cleared = localSpeakers.map((s: any) => s.id === currentUser.id ? { ...s, activeEmoji: null } : s);
           setLocalSpeakers(cleared); queueRoomSpeakersUpdate(cleared);
           emojiTimerRef.current = null;
         }, (gameSettings.emojiDuration || 4) * 1000);
         setShowEmojis(false);
      }} onClose={() => setShowEmojis(false)} />
      <GiftModal isOpen={showGifts} onClose={() => setShowGifts(false)} gifts={gifts} userCoins={Number(currentUser.coins)} speakers={localSpeakers} selectedRecipientIds={selectedRecipientIds} onSelectRecipient={setSelectedRecipientIds} onSend={handleSendGift} categoryLabels={giftCategoryLabels} />
      <RoomToolsModal isOpen={showTools} onClose={() => setShowTools(false)} isHost={isHost} onAction={handleToolAction} />
      {showSettings && <RoomSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} room={room} onUpdate={onUpdateRoom} />}
      {showRank && <RoomRankModal isOpen={showRank} onClose={() => setShowRank(false)} roomId={initialRoom.id} roomTitle={room.title} />}
      {showMembers && <RoomMembersModal isOpen={showMembers} onClose={() => setShowMembers(false)} room={room} speakers={localSpeakers} listeners={activeListeners} onSelectUser={(u) => { setSelectedUserForProfile(u); setShowProfileSheet(true); }} />}
      {showLuckyBag && <LuckyBagModal isOpen={showLuckyBag} onClose={() => setShowLuckyBag(false)} userCoins={Number(currentUser.coins)} onSend={handleSendLuckyBag} />}
      <GameCenterModal isOpen={showGameCenter} onClose={() => setShowGameCenter(false)} onSelectGame={(game) => { setActiveGame(game); setShowGameCenter(false); }} externalGames={externalGames} onSelectExternalGame={(game) => { setSelectedExternalGame(game); setShowGameCenter(false); }} />
      {activeGame === 'wheel' && <WheelGameModal isOpen={activeGame === 'wheel'} onClose={() => setActiveGame(null)} userCoins={Number(currentUser.coins)} onUpdateCoins={(c) => onUpdateUser({ coins: c })} winRate={gameSettings.wheelWinRate} gameSettings={gameSettings} />}
      {activeGame === 'slots' && <SlotsGameModal isOpen={activeGame === 'slots'} onClose={() => setActiveGame(null)} userCoins={Number(currentUser.coins)} onUpdateCoins={(c) => onUpdateUser({ coins: c })} winRate={gameSettings.slotsWinRate} gameSettings={gameSettings} />}
      {activeGame === 'lion' && <LionWheelGameModal isOpen={activeGame === 'lion'} onClose={() => setActiveGame(null)} userCoins={Number(currentUser.coins)} onUpdateCoins={(c) => onUpdateUser({ coins: c })} gameSettings={gameSettings} />}
      {selectedExternalGame && <ExternalGameModal isOpen={!!selectedExternalGame} onClose={() => setSelectedExternalGame(null)} game={selectedExternalGame} currentUser={currentUser} onUpdateUser={onUpdateUser} />}
      <AnimatePresence>{showProfileSheet && selectedUserForProfile && (<UserProfileSheet user={selectedUserForProfile} onClose={() => setShowProfileSheet(false)} isCurrentUser={selectedUserForProfile.id === currentUser.id} onAction={(action) => { if (action === 'gift') setShowGifts(true); if (action === 'message') onOpenPrivateChat(selectedUserForProfile); if (action === 'edit') setShowEditProfileModal(true); if (action === 'leaveMic') handleLeaveMic(); }} currentUser={currentUser} allUsers={users} currentRoom={room} />)}</AnimatePresence>
      <AnimatePresence>{showEditProfileModal && <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} currentUser={currentUser} onSave={onUpdateUser} />}</AnimatePresence>
    </div>
  );
};
export default VoiceRoom;
