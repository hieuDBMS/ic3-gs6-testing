import React, { useEffect, useCallback } from 'react';
import { X, ZoomIn } from 'lucide-react';

/* ── Lightbox overlay ── */
export const ImageLightbox = ({ src, alt = '', onClose }) => {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', animation: 'lbFadeIn 0.18s ease' }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
        title="Đóng (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
        style={{ animation: 'lbZoomIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
      />

      <style>{`
        @keyframes lbFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbZoomIn  { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

/* ── Zoomable image wrapper ── */
export const ZoomableImage = ({ src, alt = '', className = '' }) => {
  const [open, setOpen] = React.useState(false);
  if (!src) return null;
  return (
    <>
      <div className="relative inline-block group cursor-zoom-in" onClick={() => setOpen(true)}>
        <img src={src} alt={alt} className={className} />
        <div className="absolute inset-0 flex items-center justify-center rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 'inherit' }}>
          <ZoomIn className="w-6 h-6 text-white drop-shadow" />
        </div>
      </div>
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
};
