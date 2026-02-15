"use client"
import { useState, useEffect, useRef} from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from "react-konva";
import Konva from 'konva';
import { KonvaEventObject } from "konva/lib/Node";
import useImage from 'use-image';
import UploadPage from './ui/image-button';

const CANVAS_SIZE = 6000;

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
      draggable
      />
  )
};

const CanvasBackground = () => {
  return ( 
  <Rect 
    x={-CANVAS_SIZE/2} y={-CANVAS_SIZE/2} 
    width={CANVAS_SIZE} height={CANVAS_SIZE} 
    fill="white" 
  />
  )
}

const URLImage = ({ src, ...rest }: {src: string}) => {
  const [image] = useImage(src, 'anonymous');
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

function checkImageOverlap(draggedImage: {x: number, y: number, w: number, h: number}, placements: Placement[]) {
  return placements.some((p) =>
    draggedImage.x < p.x + p.w &&
    draggedImage.x + draggedImage.w > p.x &&
    draggedImage.y < p.y + p.h &&
    draggedImage.y + draggedImage.h > p.y
  );
}

//       <Rect x={ghosPos.x} y={ghosPos.y} width={width} height={height} fill="white" onDragEnd={(e) => setghosPos({x: e.target.x(), y: e.target.y()})}/>
//         <ColoredRect/>
//       </Layer>
//     </Stage>
//         <UploadPage imageProps={ghosPos}/>

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
    
  const [ghosPos, setghosPos] = useState({x:0, y:0});
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const resize = () => setSize({ w: innerWidth, h: innerHeight });
    resize();
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
      <UploadPage/>
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
          <CanvasBackground/>
          <ColoredRect/>
        </Layer>
      </Stage>
    </>
  );
}
