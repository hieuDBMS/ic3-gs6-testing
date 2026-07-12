import { useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * @param {object} props
 * @param {string} props.bucket - 'question-images' | 'answer-images'
 * @param {string|null} props.value - current image URL
 * @param {function} props.onChange - called with new URL or null
 * @param {string} [props.label] - optional label
 */
export const ImageUploader = ({ bucket, value, onChange, label }) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();
  const resolvedLabel = label ?? t('imageUploader.defaultLabel');

  const handleFile = async (file) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('imageUploader.errorFileType'));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t('imageUploader.errorFileSize', { maxSize: MAX_SIZE_MB }));
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onChange(data.publicUrl);
    } catch (err) {
      setError(t('imageUploader.uploadFailed', { message: err.message || t('imageUploader.unknownError') }));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{resolvedLabel}</span>

      {value ? (
        <div className="relative inline-block group">
          <img
            src={value}
            alt={t('imageUploader.previewAlt')}
            className="h-32 w-auto rounded-lg border border-gray-200 dark:border-slate-600 object-contain bg-gray-50 dark:bg-slate-700/50"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors min-h-[80px]"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-gray-300 dark:text-slate-600 mb-1" />
              <p className="text-xs text-gray-500 dark:text-slate-500">{t('imageUploader.dropzonePre')} <span className="text-indigo-600 dark:text-indigo-400 font-medium">{t('imageUploader.dropzoneLink')}</span></p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t('imageUploader.dropzoneFormats', { maxSize: MAX_SIZE_MB })}</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
};
