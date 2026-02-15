"use client"
import { useState, useEffect, useRef} from 'react';
import { Stage, Layer, Image as KonvaImage, Rect } from "react-konva";
import Konva from 'konva';
import { KonvaEventObject } from "konva/lib/Node";
import useImage from 'use-image';
import UploadPage from './ui/image-button';

// an image placement
type Placement = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
};


const URLImage = ({ src, ...rest }: {src: string; [key: string]: any}) => {
  const [image, status] = useImage(src);
  if (status === 'failed') console.error('Failed to load image:', src);
  return <KonvaImage image={image} {...rest} />;
};

function findSnapPosition(dropX: number, dropY: number, w: number, h: number, placements: Placement[]): {x: number, y: number} | null {
  if (placements.length === 0) return { x: dropX, y: dropY };

  let best: {x: number, y: number} | null = null;
  let bestDist = Infinity;

  for (const p of placements) {
    const candidates = [
      { x: p.x + p.w, y: dropY }, // right of p
      { x: p.x - w,   y: dropY }, // left of p
      { x: dropX,     y: p.y + p.h }, // below p
      { x: dropX,     y: p.y - h },   // above p
    ];

    for (const c of candidates) {
      const dist = Math.hypot(c.x - dropX, c.y - dropY);
      if (dist < bestDist && !checkImageOverlap({ x: c.x, y: c.y, w, h }, placements)) {
        best = c;
        bestDist = dist;
      }
    }
  }

  return best;
}

function isAdjacent(img: {x: number, y: number, w: number, h: number}, placements: Placement[]) {
  return placements.some((p) => {
    const touchX = img.x + img.w === p.x || p.x + p.w === img.x;
    const touchY = img.y + img.h === p.y || p.y + p.h === img.y;
    const overlapX = img.x < p.x + p.w && img.x + img.w > p.x;
    const overlapY = img.y < p.y + p.h && img.y + img.h > p.y;
    // touching on x-axis and overlapping on y-axis, or vice versa
    return (touchX && overlapY) || (touchY && overlapX);
  });
}

function checkImageOverlap(draggedImage: {x: number, y: number, w: number, h: number}, placements: Placement[]) {
  return placements.some((p) =>
    draggedImage.x < p.x + p.w &&
    draggedImage.x + draggedImage.w > p.x &&
    draggedImage.y < p.y + p.h &&
    draggedImage.y + draggedImage.h > p.y
  );
}

export default function Home() {
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    fetch("/api/placements")
      .then((res) => res.json())
      .then((data) => {
        console.log("placements:", data);
        if (Array.isArray(data)) setPlacements(data);
      })
      .catch(console.error);
    }, []);
    
  const [ghost, setGhost] = useState<{src: string; x: number; y: number; w: number; h: number} | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(0.3);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const resize = () => setSize({ w: innerWidth, h: innerHeight });
    resize();
    setPos({ x: innerWidth / 2, y: innerHeight / 2 });
    addEventListener('resize', resize);
    return () => removeEventListener('resize', resize);
  }, []);

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const ptr = stage?.getPointerPosition();
    if (!stage || !ptr) return;

    const zoom = 1.1;
    const newScale = Math.max(0.1, Math.min(10, 
      e.evt.deltaY < 0 ? scale * zoom : scale / zoom
    ));
    
    const mousePos = {
      x: (ptr.x - pos.x) / scale,
      y: (ptr.y - pos.y) / scale,
    };
    
    setScale(newScale);
    setPos({
      x: ptr.x - mousePos.x * newScale,
      y: ptr.y - mousePos.y * newScale,
    });
  };

  return (
    <>
      <UploadPage
        imageProps={ghost ?? {x: 0, y: 0, w: 0, h: 0}}
        canSubmit={ghost != null && (placements.length === 0 || isAdjacent(ghost, placements))}
        onFileSelect={(src: string | null, w: number, h: number) => {
          if (src) {
            const MAX = 900;
            if (w > MAX || h > MAX) {
              const ratio = Math.min(MAX / w, MAX / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            setGhost({ src, x: 0, y: 0, w, h });
          } else {
            setGhost(null);
          }
        }}
        onUploaded={(placement: Placement) => {
          setPlacements((prev) => [...prev, placement]);
          setGhost(null);
        }}
      />
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
      >
        <Layer>
          <Rect x={-3000} y={-3000} width={6000} height={6000} fill="white" />
          {placements.map((p) => (
            <URLImage key={p.id} src={p.url} x={p.x} y={p.y} width={p.w} height={p.h} />
          ))}
          {ghost && (
            <URLImage
              src={ghost.src}
              x={ghost.x} y={ghost.y}
              width={ghost.w} height={ghost.h}
              draggable
              onDragEnd={(e: any) => {
                const dropX = e.target.x();
                const dropY = e.target.y();
                const snap = findSnapPosition(dropX, dropY, ghost.w, ghost.h, placements);
                if (snap) {
                  setGhost({ ...ghost, x: snap.x, y: snap.y });
                  e.target.x(snap.x);
                  e.target.y(snap.y);
                } else {
                  // no valid position, revert to previous spot
                  e.target.x(ghost.x);
                  e.target.y(ghost.y);
                }
              }}
            />
          )}
        </Layer>
      </Stage>
    </>
  );
}
