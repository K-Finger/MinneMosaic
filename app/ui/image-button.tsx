"use client";
import { useState } from "react";

export default function UploadPage({imageProps, onFileSelect, onUploaded}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("No file selected");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("x", String(Math.round(imageProps.x)));
    formData.append("y", String(Math.round(imageProps.y)));
    formData.append("w", String(Math.round(imageProps.w)));
    formData.append("h", String(Math.round(imageProps.h)));

    const response = await fetch("/api/placements", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
        alert(result.error || "Upload failed");
    }
    else {
        setFile(null);
        onFileSelect(null, 0, 0);
        onUploaded(result);
    }
    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f) {
            const img = new window.Image();
            img.src = URL.createObjectURL(f);
            img.onload = () => onFileSelect(img.src, img.naturalWidth, img.naturalHeight);
          } else {
            onFileSelect(null, 0, 0);
          }
        }}
      />

      <button
        type="submit"
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-500 text-white disabled:bg-gray-300"
      >
        {uploading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
