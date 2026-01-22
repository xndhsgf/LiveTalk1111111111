
import React, { useState, useEffect } from 'react';
import { Gamepad2, Plus, Globe, Trash2, Edit3, Save, X, Upload, Link as LinkIcon, Smartphone, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ExternalGame } from '../../types';

interface AdminExternalGamesProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminExternalGames: React.FC<AdminExternalGamesProps> = ({ handleFileUpload }) => {
  const [games, setGames] = useState<ExternalGame[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<ExternalGame>>({ title: '', url: '', icon: '', description: '', isActive: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'external_games'), (snap) => {
      setGames(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExternalGame)));
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!editingGame.title || !editingGame.url || !editingGame.icon) return alert('الرجاء إكمال البيانات (الاسم، الرابط، الأيقونة)');
    setLoading(true);
    try {
      const id = editingGame.id || 'ext_game_' + Date.now();
      await setDoc(doc(db, 'external_games', id), {
        ...editingGame,
        id,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setEditingGame({ title: '', url: '', icon: '', description: '', isActive: true });
      setIsEditing(false);
      alert('تمت العملية بنجاح ✅');
    } catch (e) {
      alert('فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه اللعبة نهائياً؟')) return;
    await deleteDoc(doc(db, 'external_games', id));
  };

  return (
    <div className="space-y-8 text-right font-cairo select-none" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Gamepad2 className="text-emerald-500" size={32} /> مركز ربط الألعاب الخارجية
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-2 pr-1">ارفع ألعاب HTML5 واربطها بالرصيد الحقيقي للمنصة (مشفر وآمن).</p>
        </div>
        <button 
          onClick={() => { setEditingGame({ title: '', url: '', icon: '', description: '', isActive: true }); setIsEditing(true); }}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all"
        >
          <Plus size={18} /> إضافة لعبة جديدة
        </button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0f172a] border border-emerald-500/30 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
               <h4 className="text-white font-black text-lg">إعدادات اللعبة الخارجية</h4>
               <button onClick={() => setIsEditing(false)} className="p-2 text-slate-500 hover:text-white"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 pr-2">اسم اللعبة</label>
                    <input type="text" value={editingGame.title} onChange={e => setEditingGame({...editingGame, title: e.target.value})} placeholder="مثلاً: بوبو لودو" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 pr-2 uppercase">رابط اللعبة (محمي)</label>
                    <div className="relative">
                       <input 
                         type="text" 
                         value={editingGame.url && !isEditing ? "**************** (Protected)" : editingGame.url} 
                         onChange={e => setEditingGame({...editingGame, url: e.target.value})}
                         placeholder="الصق رابط اللعبة هنا..."
                         dir="ltr"
                         className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-blue-400 text-[10px] font-bold outline-none"
                       />
                       <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50" />
                    </div>
                  </div>
                  <button disabled={loading} onClick={handleSave} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl text-sm shadow-xl">
                    {loading ? 'جاري الحفظ...' : 'نشر اللعبة في مركز النشاطات'}
                  </button>
               </div>

               <div className="flex flex-col items-center justify-center bg-black/20 rounded-[2.5rem] border border-white/5 p-8">
                  <div className="w-32 h-32 bg-slate-900 rounded-[2rem] border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center relative group">
                    <div className="absolute inset-0 z-10 bg-transparent"></div>
                    {editingGame.icon ? (
                       <img src={editingGame.icon} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                       <Plus size={40} className="text-slate-700" />
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-20">
                       <Upload size={28} className="text-white" />
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => setEditingGame({...editingGame, icon: url}), 400, 400)} />
                    </label>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold mt-4 uppercase">رفع أيقونة اللعبة</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {games.map(game => (
          <div key={game.id} className="bg-slate-950/60 border border-white/5 rounded-[2.5rem] overflow-hidden group relative p-5 flex flex-col items-center gap-4 transition-all hover:border-emerald-500/30">
            <div className="absolute inset-0 z-10 bg-transparent"></div>
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 z-20">
               <button onClick={() => { setEditingGame(game); setIsEditing(true); }} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><Edit3 size={14} /></button>
               <button onClick={() => handleDelete(game.id)} className="p-2 bg-red-600 text-white rounded-xl shadow-lg"><Trash2 size={14} /></button>
            </div>
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl relative">
               <img src={game.icon} className="w-full h-full object-cover pointer-events-none" />
            </div>
            <div className="text-center w-full">
               <h4 className="text-white font-black text-xs truncate">{game.title}</h4>
               <div className="flex items-center justify-center gap-1 mt-1">
                  <ShieldCheck size={10} className="text-emerald-500" />
                  <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Protected API</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminExternalGames;
