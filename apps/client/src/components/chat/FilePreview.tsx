import React, { useState, useEffect } from "react";
import { X, Image, FileText, File, Loader2 } from "lucide-react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) return;
    
    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } else {
      setLoading(false);
    }

    return () => {
      if (preview && file.type.startsWith("image/")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  // Get icon based on file type
  const getFileIcon = () => {
    if (file.type.startsWith("image/")) return <Image size={24} className="text-blue-500" />;
    if (file.type === "application/pdf") return <FileText size={24} className="text-red-500" />;
    if (file.type.startsWith("text/")) return <FileText size={24} className="text-green-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  // Get color based on file type for the border
  const getBorderColor = () => {
    if (file.type.startsWith("image/")) return "border-blue-200";
    if (file.type === "application/pdf") return "border-red-200";
    if (file.type.startsWith("text/")) return "border-green-200";
    return "border-gray-200";
  };

  return (
    <div className={`w-full p-3 rounded-lg border-2 ${getBorderColor()} bg-white shadow-sm`}>
      <div className="flex items-start">
        {/* Preview area */}
        <div className="w-12 h-12 mr-3 flex items-center justify-center rounded bg-gray-100">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : file.type.startsWith("image/") && preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover rounded" 
            />
          ) : (
            getFileIcon()
          )}
        </div>
        
        {/* File info */}
        <div className="flex-1 overflow-hidden">
          <p className="font-medium text-sm text-gray-800 truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <span>{(file.size / 1024).toFixed(0)} KB</span>
            <span className="mx-2">•</span>
            <span>{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
          </div>
        </div>
        
        {/* Remove button */}
        <button
          onClick={onRemove}
          className="ml-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          title="Remove file"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default FilePreview;