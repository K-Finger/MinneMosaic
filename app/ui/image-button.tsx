'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, LoaderCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';

import logo from '@/assets/Logo.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type Placement = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
};

type ImageProps = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type UploadPanelProps = {
  imageProps: ImageProps;
  canSubmit?: boolean;
  adminMode: boolean;
  onAdminToggle: () => void;
  onFileSelect: (src: string | null, w: number, h: number) => void;
  onUploaded: (placement: Placement) => void;
};

export default function UploadPage({
  imageProps,
  canSubmit = true,
  adminMode,
  onAdminToggle,
  onFileSelect,
  onUploaded,
}: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const clearPreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    onFileSelect(null, 0, 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);

    if (!nextFile) {
      clearPreview();
      return;
    }

    const objectUrl = URL.createObjectURL(nextFile);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = objectUrl;

    const img = new window.Image();
    img.onload = () =>
      onFileSelect(objectUrl, img.naturalWidth, img.naturalHeight);
    img.onerror = () => {
      setError('Could not read image dimensions.');
      clearPreview();
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    };
    img.src = objectUrl;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("x", String(Math.round(imageProps.x)));
    formData.append("y", String(Math.round(imageProps.y)));
    formData.append("w", String(Math.round(imageProps.w)));
    formData.append("h", String(Math.round(imageProps.h)));
    formData.append("caption", caption);

    try {
    const response = await fetch("/api/placements", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Upload failed');
        return;
      }

      setFile(null);
      clearPreview();
      onUploaded(result);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      setError('Unexpected upload error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <Card className="gap-3 border-white/25 bg-slate-900/60 text-slate-100 ring-white/20 shadow-[0_12px_36px_rgba(2,6,23,0.35)] backdrop-blur-xl">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-50">
            <Image
              src={logo}
              alt="MinneMosaic logo"
              width={16}
              height={16}
              className="h-4 w-auto"
              unoptimized
            />
            MemoryMosaic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="image-upload" className="text-xs text-slate-200">
                Upload your image
              </Label>
              <Input
                ref={inputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer border-white/20 bg-white/10 text-xs text-slate-100 file:mr-2 file:rounded-md file:border-0 file:bg-slate-200/20 file:px-2 file:py-1 file:text-xs file:text-slate-100 hover:bg-white/15"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="caption-input" className="text-xs text-slate-200">
                Caption
              </Label>
              <Input
                id="caption-input"
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                className="border-white/20 bg-white/10 text-xs text-slate-100 placeholder:text-slate-400 hover:bg-white/15"
              />
            </div>

            <Separator className="bg-white/20" />

            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              <span>X: {Math.round(imageProps.x)}</span>
              <span>Y: {Math.round(imageProps.y)}</span>
              <span>W: {Math.round(imageProps.w)}</span>
              <span>H: {Math.round(imageProps.h)}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onAdminToggle}
                className={`text-[11px] transition-colors ${adminMode ? 'text-red-400/80 hover:text-red-300' : 'text-slate-500/50 hover:text-slate-300'}`}
              >
                {adminMode ? 'exit admin' : 'admin'}
              </button>
              <Button
                type="submit"
                disabled={!file || uploading || !canSubmit}
                size="sm"
                className="bg-slate-100 text-slate-900 hover:bg-white"
              >
                {uploading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="inline-flex"
                    >
                      <LoaderCircle className="size-3.5" />
                    </motion.span>
                    Uploading
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {!canSubmit && file && !error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="rounded-md border border-amber-300/35 bg-amber-500/20 px-2 py-1.5 text-xs text-amber-100"
              >
                Move the tile adjacent to the mosaic before publishing.
              </motion.p>
            )}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="rounded-md border border-rose-300/35 bg-rose-500/20 px-2 py-1.5 text-xs text-rose-100"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
