'use client';

import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';

type MosaicStatusProps = {
  placementsCount: number;
  scale: number;
};

const MosaicStatus = ({ placementsCount, scale }: MosaicStatusProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10, y: -6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.26, ease: 'easeOut', delay: 0.08 }}
      className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-900/55 px-3 py-2 text-xs text-slate-100 shadow-lg shadow-slate-950/40 backdrop-blur-xl"
    >
      <Badge variant="secondary" className="bg-white/15 text-slate-100 ring-1 ring-white/25">
        {placementsCount} tiles
      </Badge>
      <Badge variant="outline" className="border-white/30 bg-white/10 text-slate-100">
        <Search className="size-3.5" />
        {Math.round(scale * 100)}%
      </Badge>
    </motion.div>
  );
};

export default MosaicStatus;
