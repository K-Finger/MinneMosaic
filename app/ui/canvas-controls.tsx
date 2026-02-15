'use client';

import { Button } from '@/components/ui/button';
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

type CanvasControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitCanvas: () => void;
  onResetView: () => void;
};

const CanvasControls = ({
  onZoomIn,
  onZoomOut,
  onFitCanvas,
  onResetView,
}: CanvasControlsProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut', delay: 0.12 }}
      className="pointer-events-auto absolute right-4 bottom-4 flex items-center gap-1 rounded-2xl border border-white/20 bg-slate-900/60 p-2 shadow-lg shadow-slate-950/40 backdrop-blur-xl md:right-6 md:bottom-6"
    >
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-slate-100 hover:bg-white/15"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <Plus />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-slate-100 hover:bg-white/15"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <Minus />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-slate-100 hover:bg-white/15"
        onClick={onFitCanvas}
        aria-label="Fit canvas"
      >
        <Maximize2 />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-slate-100 hover:bg-white/15"
        onClick={onResetView}
        aria-label="Reset view"
      >
        <RotateCcw />
      </Button>
    </motion.section>
  );
};

export default CanvasControls;
