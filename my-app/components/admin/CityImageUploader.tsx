"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Check, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";

interface CityImageUploaderProps {
  cityId: string;
  cityName: string;
  currentImage?: string;
  onUploadSuccess: (imageUrl: string) => void;
}

export default function CityImageUploader({
  cityId,
  cityName,
  currentImage,
  onUploadSuccess,
}: CityImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("Preparing image...");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("cityId", cityId);
      formData.append("cityName", cityName);

      setUploadProgress("Uploading to Cloudinary...");

      const response = await fetch("/api/cities/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUploadProgress("Upload complete!");

      toast({
        title: "Success",
        description: "City image uploaded successfully to Cloudinary!",
      });

      // Call the success callback
      onUploadSuccess(data.imageUrl);

      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress("");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="image-upload">Upload New Image to Cloudinary</Label>
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Browse
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Max 5MB • JPG, PNG, WebP • Recommended: 1200x800px
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>High Quality Upload:</strong> Your original image will be stored at full quality.
            It will be automatically optimized and served via CDN for fast, crisp display on all devices.
          </p>
        </div>
      </div>

      {/* Preview Section */}
      {(previewUrl || currentImage) && (
        <div className="space-y-2">
          <Label>
            {previewUrl ? "New Image Preview" : "Current Image"}
          </Label>
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
            <Image
              src={previewUrl || currentImage || "/placeholder.svg"}
              alt={`${cityName} preview`}
              fill
              className="object-cover"
              sizes="400px"
            />
            {previewUrl && (
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {previewUrl && (
            <div className="text-sm text-gray-600">
              Selected: {selectedFile?.name} ({(selectedFile?.size! / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm text-blue-800">{uploadProgress}</span>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploadProgress && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-mediumGreen hover:bg-darkGreen text-white flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Cloudinary
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <strong>Cloudinary Benefits:</strong>
          <br />
          ✅ Automatic optimization & CDN delivery
          <br />
          ✅ Responsive images for all devices
          <br />
          ✅ Fast loading worldwide
        </p>
      </div>
    </div>
  );
}
