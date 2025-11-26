import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface CandidatePhotoUploadProps {
  candidateId: string;
  userId: string;
  nickname: string;
  currentPhotoUrl: string | null;
  onPhotoUpdated: (url: string | null) => void;
}

export const CandidatePhotoUpload: React.FC<CandidatePhotoUploadProps> = ({
  candidateId,
  userId,
  nickname,
  currentPhotoUrl,
  onPhotoUpdated,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${candidateId}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("candidate-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("candidate-photos")
        .getPublicUrl(filePath);

      // Add cache buster to URL
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update candidate record
      const { error: updateError } = await supabase
        .from("candidates")
        .update({ photo_url: urlWithCacheBuster })
        .eq("id", candidateId);

      if (updateError) throw updateError;

      onPhotoUpdated(urlWithCacheBuster);
      toast.success("Photo updated!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl) return;

    setUploading(true);
    try {
      // Extract file path from URL
      const urlParts = currentPhotoUrl.split("/candidate-photos/");
      if (urlParts[1]) {
        const filePath = urlParts[1].split("?")[0]; // Remove cache buster
        await supabase.storage.from("candidate-photos").remove([filePath]);
      }

      // Update candidate record
      const { error } = await supabase
        .from("candidates")
        .update({ photo_url: null })
        .eq("id", candidateId);

      if (error) throw error;

      onPhotoUpdated(null);
      toast.success("Photo removed");
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="w-16 h-16 border-2 border-border">
          <AvatarImage src={currentPhotoUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {nickname.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{nickname}</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-7 px-2 text-xs"
          >
            <Camera className="w-3 h-3 mr-1" />
            {currentPhotoUrl ? "Change" : "Add Photo"}
          </Button>
          
          {currentPhotoUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            >
              <X className="w-3 h-3 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};