"use client"
import Image from "next/image";
import {useState} from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from "react-konva";
import Konva from 'konva';
import UploadPage from "./ui/image-button.tsx";

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
