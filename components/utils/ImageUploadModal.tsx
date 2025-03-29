/**
 * Modal component for image uploading
 * Provides drag and drop functionality and progress tracking
 */
"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileImage, Check, AlertCircle } from "lucide-react";
import { storage } from "@/firebase/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => void;
  title: string;
  isOwnShop: boolean;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onUpload,
  title,
  isOwnShop,
}: ImageUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile || !isOwnShop) return;

    setUploading(true);
    setError(null);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${selectedFile.name}`;
      const storageRef = ref(storage, `user-images/${filename}`);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      // Monitor upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setError("Failed to upload image. Please try again.");
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onUpload(downloadURL);
            handleClose();
          } catch (error) {
            console.error("Error getting download URL:", error);
            setError("Failed to process uploaded image. Please try again.");
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload image. Please try again.");
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setProgress(0);
    setError(null);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-rubik">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-md">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-rubik">{error}</p>
            </div>
          )}

          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 
                ${
                  isDragActive
                    ? "border-black bg-gray-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <input {...getInputProps()} />
              <FileImage className="w-10 h-10 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 font-rubik">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag and drop an image, or click to browse"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Maximum file size: 5MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <FileImage className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-rubik truncate flex-1">
                  {selectedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500 text-center">
                    Uploading... {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="font-rubik"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="font-rubik bg-black hover:bg-gray-800 text-white"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Upload
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
