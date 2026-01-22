
import React from 'react';

interface RoomBackgroundProps {
  background: string;
}

const RoomBackground: React.FC<RoomBackgroundProps> = ({ background }) => {
  const isVideo = background?.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || background?.includes('video');
  const isImage = background?.includes('http') || background?.includes('data:image');

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {isVideo ? (
        <video 
          src={background} 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
        />
      ) : isImage ? (
        <img 
          src={background} 
          className="w-full h-full object-cover" 
          alt="Room Background" 
        />
      ) : (
        <div className="w-full h-full" style={{ background: background || '#020617' }}></div>
      )}
      
      {/* ضمان عدم تداخل اللمس مع الفيديو */}
      <div className="absolute inset-0 pointer-events-none bg-black/5"></div>
    </div>
  );
};

export default RoomBackground;
