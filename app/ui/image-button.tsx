"use client";

export default function UploadPage() {
  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/images", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log(result);
  };

  return <input type="file" onChange={uploadFile} />;
}
