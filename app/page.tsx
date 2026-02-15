"use client"
import Image from "next/image";
import {useState} from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from "react-konva";
import Konva from 'konva';

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

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill="white" />
        <ColoredRect/>
      </Layer>
    </Stage>
  );
}
