
import React, { useState } from 'react';
import { Search, X, Save, ShieldAlert, Ban, Key, Hash, Smartphone, Globe, Coins, Crown, ShieldCheck, Lock, Unlock, UserCog, CheckSquare, Square, ChevronLeft, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, VIPPackage } from '../../types';
import { db } from '../../services/firebase';
import { doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

interface AdminUsersProps {
  users: User[];
  vipLevels: VIPPackage[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  currentUser: User;
  isRootAdmin?: boolean;
}

const PERMISSIONS_LIST = [
  { id: 'users', label: 'إدارة الأعضاء' },
  { id: 'rooms_manage', label: 'إدارة الغرف' },
  { id: 'spec_ids', label: 'متجر الآيدي المميز' },
  { id: 'ext_games', label: 'ألعاب خارجية' },
  { id: 'banners', label: 'إدارة البنرات' },
  { id: 'defaults', label: 'صور البداية' },
  { id: 'badges', label: 'أوسمة الشرف' },
  { id: 'id_badges', label: 'أوسمة الـ ID' },
  { id: 'host_agency', label: 'وكالات المضيفين' },
  { id: 'room_bgs', label: 'خلفيات الغرف' },
  { id: 'mic_skins', label: 'أشكال المايكات' },
  { id: 'emojis', label: 'الإيموشنات' },
  { id: 'relationships', label: 'نظام الارتباط' },
  { id: 'agency', label: 'الوكالات (شحن)' },
  { id: 'games', label: 'مركز الحظ' },
  { id: 'gifts', label: 'إدارة الهدايا' },
  { id: 'store', label: 'إدارة المتجر' },
  { id: 'vip', label: 'إدارة الـ VIP' },
  { id: 'identity', label: 'هوية التطبيق' },
  { id: 'maintenance', label: 'صيانة النظام' },
];

const AdminUsers: React.FC<AdminUsersProps> = ({ users, vipLevels, onUpdateUser, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [editForm, setEditForm] = useState({
    coins: 0,
    customId: '',
    vipLevel: 0,
    loginPassword: '',
    isBanned: false,
    banDevice: false,
    banNetwork: false,
    isSystemModerator: false,
    moderatorPermissions: [] as string[]
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.customId?.toString().includes(searchQuery) ||
    u.id.includes(searchQuery)
  ).slice(0, 30);

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      coins: Number(u.coins || 0),
      customId: u.customId?.toString() || '',
      vipLevel: u.vipLevel || 0,
      loginPassword: u.loginPassword || '',
      isBanned: u.isBanned || false,
      banDevice: false,
      banNetwork: false,
      isSystemModerator: u.isSystemModerator || false,
      moderatorPermissions: u.moderatorPermissions || []
    });
  };

  const togglePermission = (permId: string) => {
    setEditForm(prev => {
      const current = prev.moderatorPermissions;
      if (current.includes(permId)) {
        return { ...prev, moderatorPermissions: current.filter(p => p !== permId) };
      } else {
        return { ...prev, moderatorPermissions: [...current, permId] };
      }
    });
  };

  // ميزة تنزيل الـ VIP الفورية
  const handleDownloadVIP = async () => {
    if (!selectedUser || isProcessing) return;
    const level = editForm.vipLevel;
    if (level === 0) return alert('الرجاء اختيار رتبة أولاً');

    const selectedVip = vipLevels.find(v => v.level === level);
    if (!selectedVip) return;

    setIsProcessing(true);
    try {
      const vipData = {
        isVip: true,
        vipLevel: level,
        frame: selectedVip.frameUrl,
        // تمديد الصلاحية لـ 30 يوم من الآن
        vipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      };
      
      await updateDoc(doc(db, 'users', selectedUser.id), vipData);
      alert(`تم تنزيل رتبة ${selectedVip.name} بنجاح ✅`);
    } catch (e) {
      alert('فشل تنزيل الـ VIP');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser || isProcessing) return;
    
    if (selectedUser.customId?.toString() === '1' && currentUser.customId?.toString() !== '1') {
      alert('لا يمكن تعديل بيانات المدير الرئيسي');
      return;
    }

    setIsProcessing(true);
    try {
      const updates: Partial<User> = {
        coins: Number(editForm.coins),
        customId: editForm.customId,
        vipLevel: editForm.vipLevel,
        isVip: editForm.vipLevel > 0,
        loginPassword: editForm.loginPassword,
        isBanned: editForm.isBanned,
        isSystemModerator: editForm.isSystemModerator,
        moderatorPermissions: editForm.moderatorPermissions
      };

      await onUpdateUser(selectedUser.id, updates);

      if (editForm.banDevice && selectedUser.deviceId) {
        await setDoc(doc(db, 'blacklist', 'dev_' + selectedUser.deviceId), {
          type: 'device', value: selectedUser.deviceId, bannedUserId: selectedUser.id, timestamp: serverTimestamp()
        });
      }

      if (editForm.banNetwork && selectedUser.lastIp) {
        const ipKey = 'ip_' + selectedUser.lastIp.replace(/\./g, '_');
        await setDoc(doc(db, 'blacklist', ipKey), {
          type: 'ip', value: selectedUser.lastIp, bannedUserId: selectedUser.id, timestamp: serverTimestamp()
        });
      }

      alert('تم حفظ التعديلات بنجاح ✅');
      setSelectedUser(null);
    } catch (e) {
      alert('فشلت عملية الحفظ');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 font-cairo text-right" dir="rtl">
      {/* Search Header */}
      <div className="bg-slate-900/60 p-4 rounded-[2rem] border border-white/10 shadow-lg">
         <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-xl"><UserCog size={20} className="text-white" /></div>
            <h3 className="text-lg font-black text-white">إدارة الأعضاء</h3>
         </div>
         <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الـ ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white text-sm outline-none focus:border-blue-500/50"
            />
         </div>
      </div>

      {/* User Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredUsers.map(u => (
          <motion.div 
            key={u.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-[2rem] border flex items-center justify-between transition-all ${u.isBanned ? 'bg-red-950/20 border-red-500/30' : 'bg-slate-900/40 border-white/5'}`}
          >
             <div className="flex items-center gap-3">
                <div className="relative">
                   <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-md" />
                   {u.isVip && <Crown size={12} className="absolute -top-1 -right-1 text-amber-500" />}
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-white text-sm truncate max-w-[120px]">{u.name}</span>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] text-blue-400 font-bold">ID: {u.customId || '---'}</span>
                      {u.isBanned && <span className="text-[8px] bg-red-600 text-white px-1.5 rounded-full font-black">محظور</span>}
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="text-left">
                   <div className="flex items-center gap-1 text-yellow-500 font-black text-xs">
                      <span>{(u.coins || 0).toLocaleString()}</span>
                      <Coins size={12} />
                   </div>
                </div>
                <button 
                  onClick={() => handleSelectUser(u)}
                  className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg active:scale-90 transition-transform"
                >
                  <UserCog size={18} />
                </button>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Full Screen Edit Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[4000] bg-black flex flex-col font-cairo">
             {/* Modal Top Bar */}
             <div className="h-16 bg-slate-950 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                   <img src={selectedUser.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                   <div className="text-right">
                      <h4 className="text-white font-black text-xs leading-none mb-1">{selectedUser.name}</h4>
                      <p className="text-[10px] text-slate-500">تعديل بيانات الحساب</p>
                   </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 rounded-full text-slate-400"><X size={24} /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 scrollbar-hide">
                
                {/* 1. ترقية VIP فوري */}
                <div className="bg-gradient-to-br from-amber-600/10 to-transparent p-6 rounded-[2.5rem] border border-amber-500/20 space-y-5">
                   <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-amber-500 uppercase flex items-center gap-2">
                        <Crown size={18} /> ترقية وتنزيل رتبة VIP
                      </h4>
                      {editForm.vipLevel > 0 && <Sparkles size={16} className="text-amber-400 animate-pulse" />}
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-500 pr-2">اختر الرتبة الملكية</label>
                         <select 
                           value={editForm.vipLevel}
                           onChange={e => setEditForm({...editForm, vipLevel: parseInt(e.target.value)})}
                           className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-amber-400 font-black text-center appearance-none outline-none focus:border-amber-500/50"
                         >
                            <option value={0}>إزالة الـ VIP (سحب)</option>
                            {vipLevels.sort((a,b)=>a.level-b.level).map(v => (
                               <option key={v.level} value={v.level}>{v.name} (Lvl {v.level})</option>
                            ))}
                         </select>
                      </div>

                      <button 
                        onClick={handleDownloadVIP}
                        disabled={isProcessing}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-2xl shadow-xl shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         <Zap size={18} fill="currentColor" /> تنزيل VIP للمستخدم فوراً
                      </button>
                   </div>
                </div>

                {/* 2. الأساسيات */}
                <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 grid grid-cols-1 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 pr-2">رصيد الكوينز</label>
                      <div className="relative">
                         <input 
                           type="number" 
                           value={editForm.coins}
                           onChange={e => setEditForm({...editForm, coins: parseInt(e.target.value) || 0})}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-yellow-500 font-black text-center" 
                         />
                         <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-600/50" size={18} />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 pr-2">الآيدي (ID)</label>
                      <div className="relative">
                         <input 
                           type="text" 
                           value={editForm.customId}
                           onChange={e => setEditForm({...editForm, customId: e.target.value})}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-blue-400 font-black text-center" 
                         />
                         <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600/50" size={18} />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 pr-2">كلمة مرور الربط</label>
                      <div className="relative">
                         <input 
                           type="text" 
                           value={editForm.loginPassword}
                           onChange={e => setEditForm({...editForm, loginPassword: e.target.value})}
                           placeholder="تعيين باسورد جديد..."
                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-emerald-400 font-black text-center outline-none" 
                         />
                         <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50" size={18} />
                      </div>
                   </div>
                </div>

                {/* 3. الإشراف */}
                <div className="bg-blue-600/5 p-6 rounded-[2.5rem] border border-blue-500/10 space-y-5">
                   <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-blue-400 uppercase flex items-center gap-2"><ShieldCheck size={16} /> رتبة إشراف النظام</h4>
                      <button 
                        onClick={() => setEditForm({...editForm, isSystemModerator: !editForm.isSystemModerator})}
                        className={`px-4 py-2 rounded-full text-[9px] font-black transition-all ${editForm.isSystemModerator ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}
                      >
                         {editForm.isSystemModerator ? 'مشرف نشط' : 'تعيين مشرف'}
                      </button>
                   </div>
                   
                   {editForm.isSystemModerator && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                         {PERMISSIONS_LIST.map(perm => (
                           <button 
                             key={perm.id} 
                             onClick={() => togglePermission(perm.id)}
                             className={`flex items-center gap-2 p-3 rounded-xl border text-[9px] font-black transition-all ${editForm.moderatorPermissions.includes(perm.id) ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-black/20 border-white/5 text-slate-500'}`}
                           >
                              {editForm.moderatorPermissions.includes(perm.id) ? <CheckSquare size={14}/> : <Square size={14}/>}
                              {perm.label}
                           </button>
                         ))}
                      </div>
                   )}
                </div>

                {/* 4. العقوبات */}
                <div className="bg-red-600/5 p-6 rounded-[2.5rem] border border-red-500/10 space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-red-500 flex items-center gap-2"><Ban size={16} /> الحظر والعقوبات</h4>
                      <button 
                        onClick={() => setEditForm({...editForm, isBanned: !editForm.isBanned})}
                        className={`px-4 py-2 rounded-full text-[9px] font-black transition-all ${editForm.isBanned ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-500'}`}
                      >
                         {editForm.isBanned ? 'الحساب محظور' : 'حظر الحساب'}
                      </button>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => setEditForm({...editForm, banDevice: !editForm.banDevice})}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${editForm.banDevice ? 'bg-red-600 border-red-400 text-white' : 'bg-black/30 border-white/5 text-slate-500'}`}
                      >
                         <div className="flex items-center gap-3">
                            <Smartphone size={20} />
                            <div className="text-right">
                               <p className="text-[10px] font-black">بندل فون (بند جهاز)</p>
                               <p className="text-[8px] opacity-60">سيتم حظر بصمة جهاز المستخدم نهائياً</p>
                            </div>
                         </div>
                         {editForm.banDevice ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <button 
                        onClick={() => setEditForm({...editForm, banNetwork: !editForm.banNetwork})}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${editForm.banNetwork ? 'bg-red-600 border-red-400 text-white' : 'bg-black/30 border-white/5 text-slate-500'}`}
                      >
                         <div className="flex items-center gap-3">
                            <Globe size={20} />
                            <div className="text-right">
                               <p className="text-[10px] font-black">بند شبكة (حظر IP)</p>
                               <p className="text-[8px] opacity-60">حظر الوصول من عنوان الإنترنت الحالي</p>
                            </div>
                         </div>
                         {editForm.banNetwork ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                   </div>
                </div>

             </div>

             {/* Fixed Footer Action */}
             <div className="p-6 bg-slate-950 border-t border-white/10 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <button 
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                   {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={20}/> اعتماد وحفظ البيانات</>}
                </button>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
