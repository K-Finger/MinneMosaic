'use client';

import UploadPage from './image-button';

type Placement = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
};

type FloatingUploadPanelProps = {
  ghost: { src: string; x: number; y: number; w: number; h: number } | null;
  placementsCount: number;
  isGhostAdjacent: boolean;
  onFileSelect: (src: string | null, w: number, h: number) => void;
  onUploaded: (placement: Placement) => void;
};

const FloatingUploadPanel = ({
  ghost,
  placementsCount,
  isGhostAdjacent,
  onFileSelect,
  onUploaded,
}: FloatingUploadPanelProps) => {
  const imageProps = ghost
    ? { x: ghost.x, y: ghost.y, w: ghost.w, h: ghost.h }
    : { x: 0, y: 0, w: 0, h: 0 };

  return (
    <div className="pointer-events-auto max-w-[90vw] sm:max-w-xs">
      <UploadPage
        imageProps={imageProps}
        canSubmit={ghost != null && (placementsCount === 0 || isGhostAdjacent)}
        onFileSelect={onFileSelect}
        onUploaded={onUploaded}
      />
    </div>
  );
};

export default FloatingUploadPanel;
