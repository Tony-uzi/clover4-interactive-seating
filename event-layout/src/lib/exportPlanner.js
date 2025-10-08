import { jsPDF } from 'jspdf';

const DEFAULT_PIXEL_RATIO = 2;
const DEFAULT_PADDING = 32;
const EDGE_BUFFER = 24;

function ensureStage(stageRef, canvasNodeRef) {
  const stage = stageRef?.current;
  const canvasNode = canvasNodeRef?.current;
  if (!stage || !canvasNode) {
    throw new Error('Canvas is not ready for export.');
  }
  return { stage, canvasNode };
}

function computeBounds(canvasNode, padding = 0) {
  const rect = canvasNode.getClientRect({ skipShadow: true });
  const safePadding = Math.max(0, padding) + EDGE_BUFFER;
  return {
    x: rect.x - safePadding,
    y: rect.y - safePadding,
    width: Math.max(rect.width + safePadding * 2, 1),
    height: Math.max(rect.height + safePadding * 2, 1)
  };
}

function captureStage(stage, canvasNode, { pixelRatio, padding }) {
  const previousScale = { x: stage.scaleX(), y: stage.scaleY() };
  const previousPosition = { x: stage.x(), y: stage.y() };
  const hasDraggableApi = typeof stage.draggable === 'function';
  const wasDraggable = hasDraggableApi ? stage.draggable() : undefined;
  const wasDragging = typeof stage.isDragging === 'function' ? stage.isDragging() : false;
  if (wasDragging && typeof stage.stopDrag === 'function') {
    stage.stopDrag();
  }
  if (hasDraggableApi) {
    stage.draggable(false);
  }

  stage.draw();

  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.draw();

  const rawBounds = computeBounds(canvasNode, padding);
  const shiftX = rawBounds.x < 0 ? -rawBounds.x : 0;
  const shiftY = rawBounds.y < 0 ? -rawBounds.y : 0;
  if (shiftX !== 0 || shiftY !== 0) {
    stage.position({ x: shiftX, y: shiftY });
    stage.draw();
  }

  const bounds = {
    x: rawBounds.x + shiftX,
    y: rawBounds.y + shiftY,
    width: rawBounds.width,
    height: rawBounds.height
  };
  const previousSize = { width: stage.width(), height: stage.height() };
  const requiredWidth = Math.max(previousSize.width, bounds.x + bounds.width);
  const requiredHeight = Math.max(previousSize.height, bounds.y + bounds.height);
  if (stage.width() !== requiredWidth || stage.height() !== requiredHeight) {
    stage.size({ width: requiredWidth, height: requiredHeight });
    stage.draw();
  }

  let dataUrl, capturedBounds;
  try {
    dataUrl = stage.toDataURL({
      pixelRatio,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    });
    capturedBounds = bounds;
  } finally {
    if (stage.width() !== previousSize.width || stage.height() !== previousSize.height) {
      stage.size(previousSize);
    }
    stage.scale(previousScale);
    stage.position(previousPosition);
    if (hasDraggableApi) {
      stage.draggable(!!wasDraggable);
    }
    stage.draw();
  }

  return { dataUrl, bounds: capturedBounds };
}

function triggerDownload(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function buildFilename(baseName, extension) {
  const safeName = baseName.replace(/[^a-z0-9-_]/gi, '_');
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
  return `${safeName || 'event-layout'}-${timestamp}.${extension}`;
}

export function downloadPlannerAsPNG(stageRef, canvasNodeRef, {
  fileBaseName = 'event-layout',
  pixelRatio = DEFAULT_PIXEL_RATIO,
  padding = DEFAULT_PADDING
} = {}) {
  const { stage, canvasNode } = ensureStage(stageRef, canvasNodeRef);
  const { dataUrl } = captureStage(stage, canvasNode, { pixelRatio, padding });
  triggerDownload(dataUrl, buildFilename(fileBaseName, 'png'));
}

export function downloadPlannerAsPDF(stageRef, canvasNodeRef, {
  fileBaseName = 'event-layout',
  pixelRatio = DEFAULT_PIXEL_RATIO,
  padding = DEFAULT_PADDING
} = {}) {
  const { stage, canvasNode } = ensureStage(stageRef, canvasNodeRef);
  const { dataUrl, bounds } = captureStage(stage, canvasNode, { pixelRatio, padding });
  const orientation = bounds.width >= bounds.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [bounds.width, bounds.height]
  });
  pdf.addImage(dataUrl, 'PNG', 0, 0, bounds.width, bounds.height, undefined, 'FAST');
  pdf.save(buildFilename(fileBaseName, 'pdf'));
}
