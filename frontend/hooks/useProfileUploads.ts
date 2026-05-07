import { useState, useCallback } from 'react';

export interface ProfileUpload {
  id: string;
  user_id: string;
  file_path: string;
  content_type?: string;
  file_size?: number;
  is_current: boolean;
  created_at: string;
}

export function useProfileUploads() {
  const [uploads, setUploads] = useState<ProfileUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadProfileImage = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, you would:
      // 1. Create a FormData with the file
      // 2. Upload to a file storage service (S3, etc)
      // 3. Get back a file_path URL
      // 4. Call the API with the file_path
      
      const formData = new FormData();
      formData.append('file', file);
      
      // This is a placeholder - adjust based on your actual file upload service
      const fileResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!fileResponse.ok) throw new Error('Failed to upload file');
      const fileData = await fileResponse.json();
      
      const response = await fetch('/api/profile/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: fileData.path,
          content_type: file.type,
          file_size: file.size,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create upload record');
      const upload = await response.json();
      setUploads([...uploads, upload]);
      return upload;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uploads]);

  const setCurrentAvatar = useCallback(async (uploadId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile/uploads/set-current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_upload_id: uploadId }),
      });
      
      if (!response.ok) throw new Error('Failed to set avatar');
      const updated = await response.json();
      setUploads(uploads.map(u => ({
        ...u,
        is_current: u.id === uploadId ? true : false,
      })));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uploads]);

  const deleteUpload = useCallback(async (uploadId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/profile/uploads/${uploadId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete upload');
      setUploads(uploads.filter(u => u.id !== uploadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uploads]);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile/uploads');
      if (!response.ok) throw new Error('Failed to fetch uploads');
      const data = await response.json();
      setUploads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploads,
    loading,
    error,
    uploadProfileImage,
    setCurrentAvatar,
    deleteUpload,
    fetchUploads,
  };
}
