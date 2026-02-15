"use client"
import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from "react-konva";
import Konva from 'konva';
import { KonvaEventObject } from "konva/lib/Node";
import useImage from 'use-image';
import { snapPosition, snapSize, isAdjacent } from '@/lib/snap';
import FloatingUploadPanel from './ui/floating-upload-panel';
import MosaicStatus from './ui/mosaic-status';
import CanvasControls from './ui/canvas-controls';

// an image
type Placement = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
  caption?: string;
};


const hoverSound = typeof window !== 'undefined' ? new Audio('/hover.wav') : null;
if (hoverSound) hoverSound.volume = 0.15;

const snapSound = typeof window !== 'undefined' ? new Audio('/bubble.wav') : null;
if (snapSound) snapSound.volume = 0.15;


const URLImage = forwardRef<Konva.Image, {src: string; [key: string]: any}>(({ src, image: _ignored, ...rest }, ref) => {
  const [img, status] = useImage(src);
  if (status === 'failed') console.error('Failed to load image:', src);
  return <KonvaImage ref={ref} {...(rest as Konva.ImageConfig)} image={img ?? undefined} />;
});

const PlacedImage = ({ src, x, y, w, h, caption, onHover, onClick }: {
  src: string; x: number; y: number; w: number; h: number;
  caption?: string;
  onHover: (info: {x: number; y: number; h: number; caption: string} | null) => void;
  onClick?: () => void;
}) => {
  const [image] = useImage(src);
  const imgRef = useRef<Konva.Image>(null);
  const SHRINK = 0.95;

  return (
    <KonvaImage
      ref={imgRef}
      image={image}
      x={x} y={y}
      width={w} height={h}
      offsetX={0} offsetY={0}
      onMouseEnter={() => {
        if (hoverSound) { hoverSound.currentTime = 0; hoverSound.play().catch(() => {}); }
        if (caption) onHover({ x: x + w, y, h, caption });
        const node = imgRef.current;
        if (!node) return;
        node.to({
          scaleX: SHRINK, scaleY: SHRINK,
          offsetX: -(w * (1 - SHRINK)) / 2,
          offsetY: -(h * (1 - SHRINK)) / 2,
          duration: 0.08,
          easing: Konva.Easings.EaseOut,
        });
      }}
      onMouseLeave={() => {
        onHover(null);
        const node = imgRef.current;
        if (!node) return;
        node.to({
          scaleX: 1, scaleY: 1,
          offsetX: 0, offsetY: 0,
          duration: 0.08,
          easing: Konva.Easings.EaseInOut,
        });
      }}
      onClick={onClick}
    />
  );
};

const DotGridBackground = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
  const [pattern] = useImage('/dot-grid.webp');
  return (
    <Rect
      x={x} y={y} width={w} height={h}
      fillPatternImage={pattern}
      fillPatternRepeat="repeat"
    />
  );
};

export default function Home() {
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    const fetchPlacements = () =>
      fetch("/api/placements")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPlacements(data);
        })
        .catch(console.error);
    fetchPlacements();
    const interval = setInterval(fetchPlacements, 5000); // auto refresh ever 5000 ms. move to websockets
    return () => clearInterval(interval);
  }, []);
    
  const [tooltip, setTooltip] = useState<{x: number; y: number; h: number; caption: string} | null>(null);
  const [ghost, setGhost] = useState<{src: string; x: number; y: number; w: number; h: number} | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const ghostRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [scale, setScale] = useState(0.3);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 800, h: 600 });
  const BUFFER = 2000;
  const viewLeft = -pos.x / scale - BUFFER;
  const viewTop = -pos.y / scale - BUFFER;
  const viewW = size.w / scale + BUFFER * 2;
  const viewH = size.h / scale + BUFFER * 2;

  useEffect(() => {
    const resize = () => setSize({ w: innerWidth, h: innerHeight });
    resize();
    setPos({ x: innerWidth / 2, y: innerHeight / 2 });
    addEventListener('resize', resize);
    return () => removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (ghost && ghostRef.current && trRef.current) {
      trRef.current.nodes([ghostRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [ghost]);

  const clampScale = (value: number) => Math.max(0.05, Math.min(5, value));

  const zoomAtPoint = useCallback((nextScale: number, pointer: { x: number; y: number }) => {
    const clamped = clampScale(nextScale);
    const mousePos = {
      x: (pointer.x - pos.x) / scale,
      y: (pointer.y - pos.y) / scale,
    };

    setScale(clamped);
    setPos({
      x: pointer.x - mousePos.x * clamped,
      y: pointer.y - mousePos.y * clamped,
    });
  }, [pos.x, pos.y, scale]);

  const zoomBy = (factor: number) => {
    zoomAtPoint(scale * factor, { x: size.w / 2, y: size.h / 2 });
  };

  const resetView = () => {
    if (placements.length > 0) { fitCanvas(); return; }
    setScale(1);
    setPos({ x: size.w / 2, y: size.h / 2 });
  };

  const fitCanvas = () => {
    if (placements.length === 0) { resetView(); return; }
    const PAD = 200;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of placements) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    }
    const bw = maxX - minX + PAD * 2;
    const bh = maxY - minY + PAD * 2;
    const fittedScale = clampScale(Math.min(size.w / bw, size.h / bh));
    setScale(fittedScale);
    setPos({
      x: (size.w - bw * fittedScale) / 2 - (minX - PAD) * fittedScale,
      y: (size.h - bh * fittedScale) / 2 - (minY - PAD) * fittedScale,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/placements/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        setPlacements((prev) => prev.filter((p) => p.id !== id));
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const ptr = stage?.getPointerPosition();
    if (!stage || !ptr) return;

    const zoom = 1.1;
    zoomAtPoint(e.evt.deltaY < 0 ? scale * zoom : scale / zoom, ptr);
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-950">
      <Stage
        ref={stageRef}
        width={size.w} height={size.h}
        scaleX={scale} scaleY={scale}
        x={pos.x} y={pos.y}
        draggable
        onWheel={onWheel}
        onDragEnd={e => {
          if (e.target === stageRef.current) {
            setPos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        className="absolute inset-0"
      >
        <Layer>
          <DotGridBackground x={viewLeft} y={viewTop} w={viewW} h={viewH} />
          {placements.map((p) => (
            <PlacedImage key={p.id} src={p.url} x={p.x} y={p.y} w={p.w} h={p.h} caption={p.caption} onHover={setTooltip}
              onClick={() => adminMode && setSelectedId(selectedId === p.id ? null : p.id)}
            />
          ))}
          {adminMode && selectedId && (() => {
            const sel = placements.find((p) => p.id === selectedId);
            if (!sel) return null;
            return (
              <Rect
                x={sel.x} y={sel.y} width={sel.w} height={sel.h}
                stroke="#ef4444" strokeWidth={4 / scale} dash={[10 / scale, 6 / scale]}
                listening={false}
              />
            );
          })()}
          {ghost && (
            <>
              <URLImage
                ref={ghostRef}
                src={ghost.src}
                x={ghost.x} y={ghost.y}
                width={ghost.w} height={ghost.h}
                draggable
                onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                  const dropX = e.target.x();
                  const dropY = e.target.y();
                  const snap = snapPosition(dropX, dropY, ghost.w, ghost.h, placements);
                  if (snap.x !== dropX || snap.y !== dropY) {
                    if (snapSound) { snapSound.currentTime = 0; snapSound.play().catch(() => {}); }
                  }
                  setGhost({ ...ghost, x: snap.x, y: snap.y });
                  e.target.x(snap.x);
                  e.target.y(snap.y);
                }}
                onTransformEnd={() => {
                  const node = ghostRef.current;
                  if (!node) return;
                  const sx = node.scaleX();
                  const sy = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  let rawW = Math.round(node.width() * sx);
                  let rawH = Math.round(node.height() * sy);
                  const MAX = 900;
                  if (rawW > MAX || rawH > MAX) {
                    const ratio = Math.min(MAX / rawW, MAX / rawH);
                    rawW = Math.round(rawW * ratio);
                    rawH = Math.round(rawH * ratio);
                  }
                  const snapped = snapSize(node.x(), node.y(), rawW, rawH, placements);
                  setGhost({
                    ...ghost,
                    x: node.x(),
                    y: node.y(),
                    w: snapped.w,
                    h: snapped.h,
                  });
                }}
              />
              <Transformer
                ref={trRef}
                keepRatio
                rotateEnabled={false}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                boundBoxFunc={(_, newBox) => {
                  const min = 50;
                  if (newBox.width < min || newBox.height < min) return _;
                  return newBox;
                }}
              />
            </>
          )}
        </Layer>
      </Stage>
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x * scale + pos.x + 8,
            top: (tooltip.y + tooltip.h / 2) * scale + pos.y,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 14,
            pointerEvents: 'none',
            maxWidth: 250,
            zIndex: 100,
          }}
        >
          {tooltip.caption}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(14,116,144,0.28),_transparent_45%)]" />

        <section className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-4 md:inset-x-6 md:top-6">
          <FloatingUploadPanel
            ghost={ghost}
            placementsCount={placements.length}
            isGhostAdjacent={ghost != null && isAdjacent(ghost, placements)}
            adminMode={adminMode}
            onAdminToggle={() => {
              if (adminMode) {
                setAdminMode(false);
                setAdminKey('');
                setSelectedId(null);
              } else {
                const key = prompt('Enter admin key:');
                if (key) { setAdminKey(key); setAdminMode(true); }
              }
            }}
            onFileSelect={(src: string | null, w: number, h: number) => {
              if (!src) {
                setGhost(null);
                return;
              }

              const MAX = 900;
              if (w > MAX || h > MAX) {
                const ratio = Math.min(MAX / w, MAX / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
              }
              const centerX = (size.w / 2 - pos.x) / scale - w / 2;
              const centerY = (size.h / 2 - pos.y) / scale - h / 2;
              setGhost({ src, x: centerX, y: centerY, w, h });
            }}
            onUploaded={(placement: Placement) => {
              setPlacements((prev) => [...prev, placement]);
              setGhost(null);
            }}
          />

          <MosaicStatus placementsCount={placements.length} scale={scale} />
        </section>

        <CanvasControls
          onZoomIn={() => zoomBy(1.15)}
          onZoomOut={() => zoomBy(1 / 1.15)}
          onFitCanvas={fitCanvas}
          onResetView={resetView}
        />

        {adminMode && selectedId && (() => {
          const sel = placements.find((p) => p.id === selectedId);
          if (!sel) return null;
          const btnX = (sel.x + sel.w) * scale + pos.x + 8;
          const btnY = sel.y * scale + pos.y;
          return (
            <button
              onClick={() => handleDelete(selectedId)}
              style={{ position: 'fixed', left: btnX, top: btnY, zIndex: 200 }}
              className="pointer-events-auto rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-red-500"
            >
              Delete
            </button>
          );
        })()}
      </div>
    </main>
  );
}
