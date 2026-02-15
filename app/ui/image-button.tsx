"use client";
import { useState } from "react";

export default function UploadPage({imageProps}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("No file selected");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    alert(imageProps.x);
    // formData.append("x", imageProps.x)
    // formData.append("y", imageProps.y)

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
        onChange={(e) => setFile(e.target.files[0])}
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
