
import React, { useState } from 'react';
import { Smartphone, Camera, Image as ImageIcon, Edit3, Save, Link as LinkIcon } from 'lucide-react';

interface AdminIdentityProps {
  appLogo: string;
  appBanner: string;
  appName: string;
  authBackground: string;
  onUpdateAppLogo: (url: string) => void;
  onUpdateAppBanner: (url: string) => void;
  onUpdateAppName: (name: string) => void;
  onUpdateAuthBackground: (url: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminIdentity: React.FC<AdminIdentityProps> = ({ 
  appLogo, appBanner, appName, authBackground, 
  onUpdateAppLogo, onUpdateAppBanner, onUpdateAppName, onUpdateAuthBackground,
  handleFileUpload 
}) => {
  const [localAppName, setLocalAppName] = useState(appName);
  const [logoLink, setLogoLink] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bgLink, setBgLink] = useState('');

  const handleSaveName = () => {
    if (localAppName.trim()) {
      onUpdateAppName(localAppName);
      alert('تم تحديث اسم التطبيق بنجاح! ✅');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-right" dir="rtl">
      <h3 className="text-2xl font-black text-white flex items-center gap-3">
        <Smartphone className="text-emerald-500 ml-2"/> هوية التطبيق والبراند
      </h3>

      {/* اسم التطبيق */}
      <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
           <Edit3 size={20} className="text-blue-400" />
           <h4 className="text-sm font-black text-white">إعدادات اسم الموقع/التطبيق</h4>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
           <input 
             type="text" 
             value={localAppName}
             onChange={(e) => setLocalAppName(e.target.value)}
             placeholder="أدخل اسم التطبيق الجديد..."
             className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-black outline-none"
           />
           <button onClick={handleSaveName} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs active:scale-95">حفظ الاسم</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* الشعار */}
        <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <label className="text-xs font-black text-slate-500 uppercase block text-center">شعار التطبيق (Logo)</label>
          <div className="relative aspect-square w-32 mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center bg-black/40 group">
            <img src={appLogo} className="w-full h-full object-cover" />
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer bg-black/60">
              <Camera size={24} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, onUpdateAppLogo, 400, 400)} />
            </label>
          </div>
          <div className="space-y-2">
             <input type="text" value={logoLink} onChange={e => setLogoLink(e.target.value)} placeholder="رابط الشعار المباشر..." className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[9px] text-blue-400 font-bold outline-none" dir="ltr" />
             <button onClick={() => { if(logoLink) onUpdateAppLogo(logoLink); setLogoLink(''); }} className="w-full py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-300">تحديث بالرابط</button>
          </div>
        </div>

        {/* البنر */}
        <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <label className="text-xs font-black text-slate-500 uppercase block text-center">بنر الواجهة (Banner)</label>
          <div className="relative h-32 w-full rounded-2xl overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center bg-black/40 group">
            <img src={appBanner} className="w-full h-full object-cover" />
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer bg-black/60">
              <ImageIcon size={24} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, onUpdateAppBanner, 800, 300)} />
            </label>
          </div>
          <div className="space-y-2">
             <input type="text" value={bannerLink} onChange={e => setBannerLink(e.target.value)} placeholder="رابط البنر المباشر..." className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[9px] text-blue-400 font-bold outline-none" dir="ltr" />
             <button onClick={() => { if(bannerLink) onUpdateAppBanner(bannerLink); setBannerLink(''); }} className="w-full py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-300">تحديث بالرابط</button>
          </div>
        </div>

        {/* خلفية الدخول */}
        <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 space-y-6 md:col-span-2">
          <label className="text-xs font-black text-slate-500 uppercase block text-center">خلفية صفحة الدخول (Full Background)</label>
          <div className="relative h-44 w-full rounded-[2rem] overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center bg-black/40 group">
            {authBackground ? <img src={authBackground} className="w-full h-full object-cover" /> : <div className="text-slate-700 font-black text-xs">لا توجد خلفية مخصصة</div>}
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer bg-black/60">
              <Camera size={32} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, onUpdateAuthBackground, 1200, 800)} />
            </label>
          </div>
          <div className="flex gap-2">
             <input type="text" value={bgLink} onChange={e => setBgLink(e.target.value)} placeholder="رابط خلفية الدخول المباشر..." className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 text-[10px] text-blue-400 font-bold outline-none" dir="ltr" />
             <button onClick={() => { if(bgLink) onUpdateAuthBackground(bgLink); setBgLink(''); }} className="px-8 bg-blue-600 text-white rounded-xl font-black text-xs active:scale-95">تحديث</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIdentity;
