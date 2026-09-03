import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Image, Link, Sparkles, Check, X, User as UserIcon } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  currentAvatar?: string;
  userName?: string;
  onAvatarChange: (avatarUrl: string) => void;
  onAvatarRemove?: () => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Curated high quality diverse corporate avatar presets
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
];

/**
 * Resizes and compresses an image to max 256x256 data URL
 * to avoid exceeding browser localStorage limits while maintaining high clarity.
 */
function compressImage(file: File, maxDim = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Try webp, fallback to jpeg
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentAvatar,
  userName = 'User',
  onAvatarChange,
  onAvatarRemove,
  label = 'Profile Photo',
  description = 'Upload a square JPG, PNG, or WebP photo (auto-optimized)',
  size = 'md',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const initialLetter = (userName.trim().charAt(0) || 'U').toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image is too large (max 5MB). Please choose a smaller photo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImage(file, 256, 0.85);
      onAvatarChange(compressedDataUrl);
      setShowPresets(false);
      setShowUrlInput(false);
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('Could not process this image. Please try another photo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    try {
      new URL(customUrl.trim());
      onAvatarChange(customUrl.trim());
      setCustomUrl('');
      setShowUrlInput(false);
      setError(null);
    } catch {
      setError('Please enter a valid HTTP/HTTPS image URL.');
    }
  };

  const avatarDimensions =
    size === 'lg' ? 'w-20 h-20' : size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-700">{label}</label>
          {description && <p className="text-[11px] text-slate-400">{description}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-[#F7FAF8] p-3 rounded-xl border border-gray-200">
        {/* Avatar preview container with interactive camera icon */}
        <div className="relative group shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`${avatarDimensions} rounded-full overflow-hidden border-2 ${
              currentAvatar ? 'border-[#168A45]' : 'border-dashed border-gray-300'
            } bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs transition-all group-hover:border-[#168A45] group-hover:shadow-md`}
            title="Click to choose a new photo"
          >
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={userName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If image fails to load, fallback to initial
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-[#168A45] text-white flex items-center justify-center font-bold text-lg">
                {initialLetter}
              </div>
            )}

            {/* Hover overlay with camera icon */}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="w-5 h-5" />
            </div>
          </div>

          {/* Small status/camera badge at corner */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-white text-slate-700 p-1 rounded-full border border-gray-200 shadow-xs hover:text-[#168A45] hover:border-[#168A45] transition-colors"
            title="Upload photo"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : currentAvatar ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPresets(!showPresets);
                setShowUrlInput(false);
              }}
              className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-slate-700 text-xs font-medium rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Presets</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowUrlInput(!showUrlInput);
                setShowPresets(false);
              }}
              className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-slate-700 text-xs font-medium rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              title="Paste image URL"
            >
              <Link className="w-3 h-3 text-slate-400" />
              <span>URL</span>
            </button>

            {currentAvatar && (
              <button
                type="button"
                onClick={() => {
                  if (onAvatarRemove) {
                    onAvatarRemove();
                  } else {
                    onAvatarChange('');
                  }
                }}
                className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                title="Remove photo"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-400">
            {currentAvatar ? 'Custom photo attached. Visible in member table & active header session.' : 'No photo uploaded. Using initials placeholder.'}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Preset avatars selection */}
      {showPresets && (
        <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">Select a Preset Corporate Avatar</span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {PRESET_AVATARS.map((presetUrl, idx) => {
              const isSelected = currentAvatar === presetUrl;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onAvatarChange(presetUrl);
                    setShowPresets(false);
                  }}
                  className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-[#168A45] ring-2 ring-[#168A45]/20 scale-105' : 'border-gray-200 hover:border-[#168A45]'
                  }`}
                >
                  <img
                    src={presetUrl}
                    alt={`Preset ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#168A45]/30 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Direct URL input */}
      {showUrlInput && (
        <div className="p-2.5 bg-white border border-gray-200 rounded-xl space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">Paste Image Web Link (HTTPS)</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
