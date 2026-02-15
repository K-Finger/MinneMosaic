"use client"
import { useState, useEffect, useRef} from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from "react-konva";
import Konva from 'konva';
import { KonvaEventObject } from "konva/lib/Node";
import UploadPage from './ui/image-button';

const CANVAS_SIZE = 5000;

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

export default function Home() {
  const [placements, setPlacements] = useState([]);

  useEffect(() => {
    fetch("/api/placements")
      .then((res) => res.json())
      .then((data) => {
        setPlacements(data);
      })
      .catch(console.error);
  }, []);

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
          <Rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill="white" />
          <ColoredRect/>
        </Layer>
      </Stage>
    </>
  );
}
