"use client";
import { useState } from "react";

export default function UploadPage({imageProps}) {
  const [file, setFile] = useState<File | null>(null);
  const [imgSize, setImgSize] = useState({w: 0, h: 0});
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("No file selected");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("x", String(imageProps.x));
    formData.append("y", String(imageProps.y));
    formData.append("w", String(imgSize.w));
    formData.append("h", String(imgSize.h));

    const response = await fetch("/api/placements", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    if (result['status'] != 201) {
        alert("Upload failed");
    }
    else {
        alert("Uploaded successfully!");
    }
    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="file"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f) {
            const img = new window.Image();
            img.src = URL.createObjectURL(f);
            img.onload = () => setImgSize({w: img.naturalWidth, h: img.naturalHeight});
          }
        }}
      />

      <button
        type="submit"
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {uploading ? "Uploading" : "Upload"}
      </button>
    </form>
  );
}
