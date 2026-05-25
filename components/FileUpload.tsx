'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  uploadPath?: string; // e.g., 'products', 'profiles'
  label?: string;
  className?: string;
}

export default function FileUpload({
  onUploadComplete,
  currentImageUrl,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  uploadPath = 'uploads',
  label = 'Upload Image',
  className = '',
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentImageUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImageUrl prop changes
  useEffect(() => {
    setPreview(currentImageUrl);
  }, [currentImageUrl]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Delete old image from blob if replacing
      const oldImageUrl = preview;

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', uploadPath);

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Delete old image after successful upload
      if (oldImageUrl && oldImageUrl !== currentImageUrl) {
        try {
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: oldImageUrl }),
          });
        } catch (err) {
          console.error('Failed to delete old image:', err);
          // Continue anyway - new image is uploaded successfully
        }
      }
      
      // Set preview and notify parent
      setPreview(data.url);
      onUploadComplete(data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      setPreview(undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleRemove = async () => {
    // Delete from blob storage if there's a current image
    if (preview) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: preview }),
        });
      } catch (err) {
        console.error('Failed to delete image from storage:', err);
        // Continue anyway - UI cleanup is more important
      }
    }

    setPreview(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('');
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Upload Area */}
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-[var(--rust)] bg-[var(--rust)]/5' 
              : 'border-gray-300 hover:border-[var(--rust)] hover:bg-gray-50'
            }
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-12 w-12 text-[var(--rust)] animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drop your image here, or <span className="text-[var(--rust)]">browse</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} up to {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview Area */
        <div className="relative group">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-64 object-cover"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
