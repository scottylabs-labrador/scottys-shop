import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (storageId: string) => Promise<void>;
  title: string;
  isOwnShop: boolean;
  maxSizeMB?: number;
}

const ImageUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  title,
  isOwnShop,
  maxSizeMB = 5,
}: ImageUploadModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { user, isSignedIn } = useUser();

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const validateFile = (file: File): string | null => {
    if (!isSignedIn || !isOwnShop || !user) {
      return "Unauthorized";
    }
    if (!file.type.startsWith("image/")) {
      return "Please upload an image file";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Image must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadUrl = await generateUploadUrl({
        userId: user!.id,
        contentType: file.type,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const storageId = await uploadResponse.text();
      await onUpload(storageId);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isUploading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "relative w-full h-40 border-2 border-dashed rounded-lg transition-colors",
              dragActive
                ? "border-primary bg-primary/10"
                : "border-gray-300 hover:border-gray-400",
              isUploading && "pointer-events-none opacity-60"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <UploadingState />
              ) : (
                <UploadPrompt dragActive={dragActive} />
              )}
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UploadingState = () => (
  <div className="flex flex-col items-center">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
    <span className="mt-2 text-sm text-gray-500">Uploading...</span>
  </div>
);

const UploadPrompt = ({ dragActive }: { dragActive: boolean }) => (
  <div className="flex flex-col items-center">
    <Upload className="w-6 h-6 text-gray-500" />
    <span className="mt-2 text-sm text-gray-500">
      {dragActive ? "Drop image here" : "Drag and drop or click to upload"}
    </span>
    <span className="mt-1 text-xs text-gray-400">Maximum file size: 5MB</span>
  </div>
);

export default ImageUploadModal;
