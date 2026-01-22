
import React, { useState } from 'react';
import { Plus, Crown, Edit3, Trash2, X, Upload, Image as ImageIcon, Star, Save, ListChecks, Link as LinkIcon, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VIPPackage } from '../../types';

interface AdminVIPProps {
  vipLevels: VIPPackage[];
  onSaveVip: (vip: VIPPackage, isDelete?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminVIP: React.FC<AdminVIPProps> = ({ vipLevels, onSaveVip, handleFileUpload }) => {
  const [editingVip, setEditingVip] = useState<Partial<VIPPackage> | null>(null);
  const [newPrivilege, setNewPrivilege] = useState('');

  const handleFinalSave = async () => {
    if (!editingVip || !editingVip.name || !editingVip.frameUrl) {
      alert('يرجى إكمال البيانات ووضع رابط الإطار أو رفعه أولاً');
      return;
    }
    await onSaveVip({
      ...editingVip,
      durationDays: Number(editingVip.durationDays) || 30
    } as VIPPackage);
    setEditingVip(null);
  };

  const addPrivilege = () => {
    if (!newPrivilege.trim()) return;
    const current = editingVip?.privileges || [];
    setEditingVip({ ...editingVip, privileges: [...current, newPrivilege.trim()] });
    setNewPrivilege('');
  };

  const removePrivilege = (index: number) => {
    const current = editingVip?.privileges || [];
    setEditingVip({ ...editingVip, privileges: current.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 text-right font-cairo select-none" dir="rtl">
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5 shadow-xl gap-4">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Crown className="text-amber-500" size={32} /> إدارة مستويات الـ VIP الملكية
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-1 pr-1">قم بتصميم الرتب وتحديد الأسعار (الروابط محمية ومشفرة).</p>
        </div>
        <button 
          onClick={() => setEditingVip({ 
            level: (vipLevels.length + 1), 
            name: '', 
            cost: 5000, 
            frameUrl: '', 
            color: 'text-amber-400', 
            nameStyle: 'font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600',
            privileges: [],
            durationDays: 30
          })} 
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          <Plus size={20}/> إضافة رتبة ملكية جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vipLevels.sort((a,b)=>a.level-b.level).map(vip => (
          <motion.div 
            key={vip.level} 
            whileHover={{ y: -5 }}
            className="bg-slate-950/60 p-6 rounded-[2.5rem] border border-white/10 flex items-center gap-5 group relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20 scale-90 origin-top-left">
              <button onClick={() => setEditingVip(vip)} className="p-2 bg-blue-600 rounded-xl text-white shadow-lg"><Edit3 size={16}/></button>
              <button onClick={() => { if(confirm('حذف هذه العضوية؟')) onSaveVip(vip, true) }} className="p-2 bg-red-600 rounded-xl text-white shadow-lg"><Trash2 size={16}/></button>
            </div>
            
            <div className="relative w-24 h-24 flex-shrink-0">
               <div className="absolute inset-0 z-10"></div> {/* طبقة حماية */}
               <div className="absolute inset-3 rounded-full bg-black/40 border border-white/5"></div>
               <img src={vip.frameUrl} className="w-full h-full object-contain relative z-10 scale-[1.35] drop-shadow-2xl pointer-events-none no-drag" alt="" />
               <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-white/20 z-20">LV.{vip.level}</div>
            </div>

            <div className="text-right flex-1">
              <h4 className={`font-black text-xl leading-tight ${vip.color}`}>{vip.name}</h4>
              <div className="flex items-center gap-1.5 mt-2 bg-black/30 w-fit px-3 py-1 rounded-full border border-white/5">
                <span className="text-sm font-black text-yellow-500">{(vip.cost || 0).toLocaleString()}</span>
                <Star size={12} className="text-yellow-600 fill-current" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingVip && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f172a] border border-white/10 rounded-[3rem] w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <h3 className="text-2xl font-black text-white text-right">تعديل بيانات العضوية</h3>
                <button onClick={() => setEditingVip(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><X size={28} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 relative group shadow-inner">
                      <div className="w-40 h-40 flex items-center justify-center bg-slate-900 rounded-full border-2 border-dashed border-white/10 shadow-2xl overflow-hidden relative">
                        <div className="absolute inset-0 z-20 bg-transparent"></div>
                        {editingVip.frameUrl ? (
                          <img src={editingVip.frameUrl} className="w-full h-full object-contain scale-125 pointer-events-none" alt="" />
                        ) : (
                          <ImageIcon className="text-slate-700 opacity-30" size={64} />
                        )}
                      </div>
                      
                      <div className="w-full space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 uppercase pr-2">رابط الإطار (محمي)</label>
                           <div className="relative">
                              <input 
                                type="text" 
                                value={editingVip.frameUrl ? "**************** (Locked Link)" : ""} 
                                readOnly
                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-slate-600 text-[10px] font-bold outline-none cursor-default" 
                                dir="ltr"
                              />
                              <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50" />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <p className="text-[8px] text-blue-400 font-bold px-2">للتحديث، الصق الرابط الجديد هنا:</p>
                           <input 
                             type="text" 
                             placeholder="https://..."
                             onChange={e => setEditingVip({...editingVip, frameUrl: e.target.value})} 
                             className="w-full bg-black/40 border border-white/20 rounded-2xl p-4 text-blue-400 text-[10px] font-bold outline-none focus:border-amber-500" 
                             dir="ltr"
                           />
                        </div>

                        <label className="bg-amber-600/20 text-amber-500 border border-amber-500/30 w-full py-4 rounded-2xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all">
                          <Upload size={18} /> رفع إطار جديد
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => setEditingVip({...editingVip, frameUrl: url}), 500, 500)} />
                        </label>
                      </div>
                    </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 pr-2">الاسم</label>
                           <input type="text" value={editingVip.name} onChange={e => setEditingVip({...editingVip, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-black outline-none" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 pr-2">السعر</label>
                           <input type="number" value={editingVip.cost} onChange={e => setEditingVip({...editingVip, cost: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-yellow-500 font-black text-xs outline-none" />
                        </div>
                      </div>

                      <div className="bg-black/40 rounded-2xl border border-white/5 p-4 space-y-3">
                         <div className="flex gap-2">
                            <input type="text" placeholder="إضافة ميزة..." value={newPrivilege} onChange={e => setNewPrivilege(e.target.value)} className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none" />
                            <button onClick={addPrivilege} className="px-3 bg-emerald-600 text-white rounded-lg"><Plus size={16}/></button>
                         </div>
                         <div className="space-y-1 max-h-32 overflow-y-auto">
                            {(editingVip.privileges || []).map((p, i) => (
                              <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded text-[9px] text-slate-300">
                                <span>{p}</span>
                                <button onClick={() => removePrivilege(i)} className="text-red-500"><X size={12}/></button>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <button onClick={handleFinalSave} className="w-full py-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-black rounded-[1.5rem] shadow-xl active:scale-95 transition-all text-sm">حفظ ونشر التعديلات</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminVIP;
