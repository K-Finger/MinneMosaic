"use client"
import Image from "next/image";
import {useState} from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from "react-konva";
import Konva from 'konva';

const ColoredRect = () => {
  const [color, setColor] = useState('green');
  const handleClick = () => {
    setColor(Konva.Util.getRandomColor());
  }
  return <Rect x={20} y={20} width={50} height={50} fill={color} shadowBlur={5} onClick={handleClick} />
}

export default function Home() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Text text="Try click on rect"/>
        <ColoredRect/>
      </Layer>
    </Stage>
  );
}
