import { useId, useRef, useState } from "react";
import { Image as ImageIcon, LoaderCircle, UploadCloud, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/adminFetch";

interface AdminImageUploadProps {
  value: string;
  onChange: (value: string) => void;
}

export function AdminImageUpload({ value, onChange }: AdminImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Images must be smaller than 10 MB.");
      return;
    }

    setError("");
    setIsUploading(true);
    try {
      const response = await adminFetch("/api/storage/uploads/request-url", {
        method: "POST",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });
      const uploadData = await response.json().catch(() => ({}));
      if (!response.ok || !uploadData.uploadURL || !uploadData.objectPath) {
        throw new Error(uploadData.error || "Could not prepare the image upload.");
      }

      const uploadResponse = await fetch(uploadData.uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok) throw new Error("Could not upload the image.");

      onChange(`/api/storage${uploadData.objectPath}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload the image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-28 cursor-pointer items-center gap-4 rounded-lg border border-dashed p-3 transition-colors ${
          isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
        }`}
      >
        {value ? (
          <img src={value} alt="Selected upload preview" className="h-20 w-20 rounded-md object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium">
            {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isUploading ? "Uploading image…" : "Drag an image here or click to upload"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, GIF, or WebP up to 10 MB</p>
        </div>
        {value && !isUploading && (
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
            }}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
            event.target.value = "";
          }}
        />
      </div>
      <Input
        value={value}
        placeholder="Or paste an image URL"
        onChange={(event) => onChange(event.target.value)}
        aria-label="Image URL"
      />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}