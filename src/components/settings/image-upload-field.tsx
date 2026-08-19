import { useRef, useState } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUploadFieldProps {
  id: string;
  label: string;
  schoolId: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}

export function ImageUploadField({ id, label, schoolId, folder, value, onChange, hint }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${schoolId}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("school-branding")
      .upload(path, file, { cacheControl: "31536000", upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data, error: signError } = await supabase.storage
      .from("school-branding")
      .createSignedUrl(path, TEN_YEARS);
    setUploading(false);
    if (signError || !data?.signedUrl) {
      toast.error(signError?.message ?? "Could not create an image link.");
      return;
    }
    onChange(data.signedUrl);
    toast.success(`${label} uploaded. Remember to save changes.`);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="size-14 shrink-0 rounded-md border border-border/70 bg-muted object-contain p-1"
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleFile(file);
              }}
            />
            <Button type="button" size="sm" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />} Upload
            </Button>
            {value ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                <X /> Remove
              </Button>
            ) : null}
          </div>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}