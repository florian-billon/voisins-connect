'use client';

import { useProfileUploads } from '@/hooks';
import { useEffect, useRef } from 'react';

export function ProfileAvatarUpload() {
  const { uploads, loading, error, uploadProfileImage, setCurrentAvatar, deleteUpload, fetchUploads } = useProfileUploads();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      await uploadProfileImage(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const currentAvatar = uploads.find(u => u.is_current);

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Profile Avatar (Premium Feature)</h3>

        {/* Current Avatar */}
        {currentAvatar && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Avatar:</p>
            <img
              src={currentAvatar.file_path}
              alt="Current avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Upload New Avatar</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={loading}
            className="block w-full text-sm border border-gray-300 rounded-lg p-2"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        {/* Avatar List */}
        {uploads.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Your Avatars:</p>
            <div className="grid grid-cols-3 gap-2">
              {uploads.map(upload => (
                <div key={upload.id} className="relative group">
                  <img
                    src={upload.file_path}
                    alt="Avatar"
                    className={`w-full aspect-square rounded-lg object-cover ${
                      upload.is_current ? 'border-2 border-green-500' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                    {!upload.is_current && (
                      <button
                        onClick={() => setCurrentAvatar(upload.id)}
                        className="text-white text-xs bg-green-500 hover:bg-green-600 px-2 py-1 rounded"
                      >
                        Set as Avatar
                      </button>
                    )}
                    <button
                      onClick={() => deleteUpload(upload.id)}
                      className="text-white text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      </div>
    </div>
  );
}
