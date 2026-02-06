import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImagePreviewContextType {
  previewImage: (url: string, title?: string) => void;
}

const ImagePreviewContext = createContext<ImagePreviewContextType | undefined>(undefined);

export const useImagePreview = () => {
  const context = useContext(ImagePreviewContext);
  if (!context) {
    throw new Error('useImagePreview must be used within a ImagePreviewProvider');
  }
  return context;
};

export const ImagePreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  const previewImage = (url: string, t?: string) => {
    if (!url) return;
    setImageUrl(url);
    setTitle(t || '');
    setIsOpen(true);
  };

  const closePreview = () => {
    setIsOpen(false);
    setImageUrl('');
  };

  return (
    <ImagePreviewContext.Provider value={{ previewImage }}>
      {children}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closePreview}
        >
          {/* Close Button */}
          <button 
            onClick={closePreview} 
            className="absolute top-4 right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[101]"
          >
            <X size={24} />
          </button>
          
          {/* Title */}
          {title && (
            <div className="absolute top-6 left-6 z-[101]">
                <h3 className="text-white text-lg font-medium drop-shadow-md tracking-wide">{title}</h3>
            </div>
          )}

          {/* Image */}
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </ImagePreviewContext.Provider>
  );
};