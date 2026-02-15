"use client"
import Image from "next/image";
import {useState, useEffect} from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from "react-konva";
import Konva from 'konva';
import UploadPage from "./ui/image-button.tsx";

// an image placement
type Placement = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
};

const ColoredRect = () => {
  const [color, setColor] = useState('green');
  return (
    <Rect
      x={20}
      y={20}
      width={50}
      height={50}
      fill={color}
      shadowBlur={5}
      onDragEnd={() => {
        setColor(Konva.Util.getRandomColor());
      }}
      draggable/>
  )
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
        setPlacements(data);
      })
      .catch(console.error);
  }, []);

  const width = window.innerWidth;
  const height = window.innerHeight;
  const [ghosPos, setghosPos] = useState({x:0, y:0});

  return (
      <>
    <Stage width={width} height={height}>
      <Layer>
        <Rect x={ghosPos.x} y={ghosPos.y} width={width} height={height} fill="white" onDragEnd={(e) => setghosPos({x: e.target.x(), y: e.target.y()})}/>
        <ColoredRect/>
      </Layer>
    </Stage>
        <UploadPage imageProps={ghosPos}/>
      </>
  );
}
