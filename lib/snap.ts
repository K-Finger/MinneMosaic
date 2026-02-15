type Rect = { x: number; y: number; w: number; h: number };

const SNAP_THRESH = 80;

// This whole thing is for magnetic snapping
// https://stackoverflow.com/questions/22591927/snap-edges-of-objects-to-each-other-and-prevent-overlap

function getEdges(rects: Rect[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const r of rects) {
    xs.push(r.x, r.x + r.w);
    ys.push(r.y, r.y + r.h);
  }
  return { xs, ys };
}

function snapToEdge(value: number, targets: number[]): number | null {
  let best: number | null = null;
  let bestDist = SNAP_THRESH;
  for (const t of targets) {
    const d = Math.abs(value - t);
    if (d < bestDist) { best = t; bestDist = d; }
  }
  return best;
}

export function snapPosition(x: number, y: number, w: number, h: number, rects: Rect[]): { x: number; y: number } {
  if (rects.length === 0) return { x, y };
  const { xs, ys } = getEdges(rects);

  let newX = x, newY = y;

  const snapL = snapToEdge(x, xs);
  const snapR = snapToEdge(x + w, xs);
  const dL = snapL !== null ? Math.abs(x - snapL) : Infinity;
  const dR = snapR !== null ? Math.abs(x + w - snapR) : Infinity;
  if (dL <= dR && snapL !== null) newX = snapL;
  else if (snapR !== null) newX = snapR - w;

  const snapT = snapToEdge(y, ys);
  const snapB = snapToEdge(y + h, ys);
  const dT = snapT !== null ? Math.abs(y - snapT) : Infinity;
  const dB = snapB !== null ? Math.abs(y + h - snapB) : Infinity;
  if (dT <= dB && snapT !== null) newY = snapT;
  else if (snapB !== null) newY = snapB - h;

  if (checkOverlap({ x: newX, y: newY, w, h }, rects)) {
    return { x, y };
  }
  return { x: newX, y: newY };
}

export function snapSize(x: number, y: number, w: number, h: number, rects: Rect[]): { w: number; h: number } {
  if (rects.length === 0) return { w, h };
  const { xs, ys } = getEdges(rects);
  const ratio = w / h;

  const snapR = snapToEdge(x + w, xs);
  const snapB = snapToEdge(y + h, ys);

  const dR = snapR !== null && snapR > x + 50 ? Math.abs(x + w - snapR) : Infinity;
  const dB = snapB !== null && snapB > x + 50 ? Math.abs(y + h - snapB!) : Infinity;

  if (dR <= dB && snapR !== null) {
    const newW = snapR - x;
    return { w: newW, h: Math.round(newW / ratio) };
  }
  if (snapB !== null) {
    const newH = snapB - y;
    return { w: Math.round(newH * ratio), h: newH };
  }

  return { w, h };
}

export function isAdjacent(img: Rect, rects: Rect[]) {
  const TOL = 2;
  return rects.some((p) => {
    const touchX = Math.abs(img.x + img.w - p.x) < TOL || Math.abs(p.x + p.w - img.x) < TOL;
    const touchY = Math.abs(img.y + img.h - p.y) < TOL || Math.abs(p.y + p.h - img.y) < TOL;
    const overlapX = img.x < p.x + p.w && img.x + img.w > p.x;
    const overlapY = img.y < p.y + p.h && img.y + img.h > p.y;
    return (touchX && overlapY) || (touchY && overlapX);
  });
}

export function checkOverlap(rect: Rect, rects: Rect[]) {
  const TOL = 2;
  return rects.some((p) =>
    rect.x < p.x + p.w - TOL &&
    rect.x + rect.w > p.x + TOL &&
    rect.y < p.y + p.h - TOL &&
    rect.y + rect.h > p.y + TOL
  );
}
