import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';

/* ── Lightbox overlay ── */
export const ImageLightbox = ({ src, alt = '', onClose }) => {
  const [isZoomed, setIsZoomed] = React.useState(false);

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

  const lightboxContent = (
    <div
      className={`fixed inset-0 z-[9999] ${isZoomed ? 'overflow-auto items-start' : 'overflow-hidden items-center'} flex justify-center p-4`}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', animation: 'lbFadeIn 0.18s ease' }}
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-[10000]"
        title="Đóng (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      <div className={`relative ${isZoomed ? 'm-auto' : 'w-full h-full flex items-center justify-center'}`} style={{ transition: 'all 0.3s' }}>
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
          className={`object-contain transition-all duration-300 shadow-2xl ${
            isZoomed
              ? 'cursor-zoom-out rounded-sm w-auto h-auto'
              : 'cursor-zoom-in w-full h-full max-h-[90vh] rounded-2xl'
          }`}
          style={{
            animation: 'lbZoomIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            width: isZoomed ? '250vw' : undefined,
            maxWidth: isZoomed ? 'none' : undefined,
          }}
        />
      </div>

      <style>{`
        @keyframes lbFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbZoomIn  { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );

  // Gắn lightbox vào phần tử fullscreen nếu có, ngược lại gắn vào body
  const container = document.fullscreenElement || document.body;
  return createPortal(lightboxContent, container);
};

/* ── Zoomable image wrapper ── */
export const ZoomableImage = ({ src, alt = '', className = '', wrapperClassName = 'relative inline-block group cursor-zoom-in' }) => {
  const [open, setOpen] = React.useState(false);
  if (!src) return null;
  return (
    <>
      <div className={wrapperClassName} onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}>
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
