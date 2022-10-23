import { createSelector } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';

import {
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { RootState, useAppDispatch, useAppSelector } from '../../../app/store';
import { setHeight, setWidth } from '../../options/optionsSlice';

import * as InvokeAI from '../../../app/invokeai';

import { Circle, Layer, Line, Stage } from 'react-konva';
import { Image as KonvaImage } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Stage as StageType } from 'konva/lib/Stage';
import {
  addLine,
  addPointToCurrentLine,
  InpaintingState,
  MaskLine,
} from './inpaintingSlice';
import { Vector2d } from 'konva/lib/types';
import Konva from 'konva';

// stageRef for InvokeButton.tsx to use; should use Context API for this.
export let stageRef: MutableRefObject<StageType | null>;

export const inpaintingOptionsSelector = createSelector(
  (state: RootState) => state.inpainting,
  (inpainting: InpaintingState) => {
    return {
      tool: inpainting.tool,
      brushSize: inpainting.brushSize,
      maskColor: inpainting.maskColor,
      shouldInvertMask: inpainting.shouldInvertMask,
      shouldShowCheckboardTransparency:
        inpainting.shouldShowCheckboardTransparency,
      shouldShowBrushPreview: inpainting.shouldShowBrushPreview,
      maskOpacity: inpainting.maskOpacity,
    };
  },
  {
    memoizeOptions: {
      resultEqualityCheck: isEqual,
    },
  }
);

type InpaintingCanvasLinesProps = {
  lines: MaskLine[];
  currentLinesIndex: number;
  maskColor: string;
};

const InpaintingCanvasLines = (props: InpaintingCanvasLinesProps) => {
  const { lines, currentLinesIndex, maskColor } = props;
  return (
    <>
      {lines.slice(0, currentLinesIndex + 1).map((line, i) => (
        <Line
          key={i}
          points={line.points}
          stroke={maskColor}
          strokeWidth={line.strokeWidth * 2}
          tension={0}
          lineCap="round"
          lineJoin="round"
          shadowForStrokeEnabled={false}
          globalCompositeOperation={
            line.tool === 'brush' ? 'source-over' : 'destination-out'
          }
        />
      ))}
    </>
  );
};

const InpaintingCanvas = () => {
  const dispatch = useAppDispatch();
  const currentImage = useAppSelector(
    (state: RootState) => state.gallery.currentImage,
    (a: InvokeAI.Image | undefined, b: InvokeAI.Image | undefined) =>
      a !== undefined && b !== undefined && a.uuid === b.uuid
  );

  const {
    tool,
    brushSize,
    maskColor,
    shouldInvertMask,
    shouldShowCheckboardTransparency,
    shouldShowBrushPreview,
    maskOpacity,
  } = useAppSelector(inpaintingOptionsSelector);

  /**
   * We always rerender on changes to lines; we can save a couple
   * milliseconds by not using reselect's memoization.
   */
  const { lines, currentLinesIndex } = useAppSelector(
    (state: RootState) => state.inpainting
  );

  // set the stageRef for InvokeButton.tsx
  stageRef = useRef<StageType>(null);

  // Mask goes here
  const maskLayerRef = useRef<Konva.Layer>(null);

  // Use ref for values that do not affect rendering
  const didMouseMoveRef = useRef<boolean>(false);
  const isDrawing = useRef<boolean>(false);

  // Track cursor position for brush preview
  const [cursorPos, setCursorPos] = useState<Vector2d | null>(null);

  // Load the image into this
  const [canvasBgImage, setCanvasBgImage] = useState<HTMLImageElement | null>(
    null
  );

  // Load the image and set the options panel width & height
  useLayoutEffect(() => {
    if (currentImage) {
      const image = new Image();
      image.onload = () => {
        const { width, height } = image;
        setCanvasBgImage(image);
        dispatch(setWidth(width));
        dispatch(setHeight(height));
      };
      image.src = currentImage.url;
    }
  }, [currentImage, dispatch]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;

    const pointerPosition = e.target.getStage()?.getPointerPosition();

    if (!pointerPosition || !maskLayerRef.current) return;

    // Add a new line starting from the current cursor position.
    dispatch(
      addLine({
        tool,
        strokeWidth: brushSize / 2,
        points: [pointerPosition.x, pointerPosition.y],
      })
    );
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const pointerPosition = e.target.getStage()?.getPointerPosition();

    if (!pointerPosition) return;

    // Track the cursor position
    setCursorPos(pointerPosition);

    if (!isDrawing.current || !maskLayerRef.current) {
      return;
    }

    didMouseMoveRef.current = true;
    // Extend the current line
    dispatch(addPointToCurrentLine([pointerPosition.x, pointerPosition.y]));
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    if (!didMouseMoveRef.current) {
      const pointerPosition = stageRef.current?.getPointerPosition();

      if (!pointerPosition || !maskLayerRef.current) return;

      /**
       * Extend the current line.
       * In this case, the mouse didn't move, so we append the
       * same point to the line. This allows the line to render
       * as a circle centered on that point.
       */
      dispatch(addPointToCurrentLine([pointerPosition.x, pointerPosition.y]));
    } else {
      didMouseMoveRef.current = false;
    }
  };

  const handleMouseOutCanvas = () => {
    setCursorPos(null);
    isDrawing.current = false
  };

  // Triggers canvas redraw when mask is "empty" i.e. no lines to draw
  useEffect(() => {
    if (!maskLayerRef.current || currentLinesIndex > -1) return;
    maskLayerRef.current.clearCache();
  }, [currentLinesIndex]);

  /**
   * Konva's cache() method basically rasterizes an object/canvas.
   * This is needed to rasterize the mask, before setting the opacity.
   * If we do not cache the maskLayer, the brush strokes will have opacity
   * set individually.
   */
  useEffect(() => {
    if (!maskLayerRef.current || lines.length === 0) return;
    maskLayerRef.current.cache();
  });

  return (
    canvasBgImage && (
      <div className="inpainting-wrapper checkerboard">
        <Stage
          width={canvasBgImage.width}
          height={canvasBgImage.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onMouseOut={handleMouseOutCanvas}
          onMouseLeave={handleMouseOutCanvas}
          style={{ cursor: 'none' }}
          ref={stageRef}
        >
          {!shouldInvertMask && !shouldShowCheckboardTransparency && (
            <Layer listening={false}>
              <KonvaImage image={canvasBgImage} />
            </Layer>
          )}
          <Layer
            listening={false}
            opacity={
              shouldShowCheckboardTransparency || shouldInvertMask
                ? 1
                : maskOpacity
            }
            ref={maskLayerRef}
          >
            <InpaintingCanvasLines
              lines={lines}
              currentLinesIndex={currentLinesIndex}
              maskColor={maskColor}
            />

            {(cursorPos || shouldShowBrushPreview) && (
              <Circle
                x={cursorPos ? cursorPos.x : canvasBgImage.width / 2}
                y={cursorPos ? cursorPos.y : canvasBgImage.height / 2}
                radius={brushSize / 2}
                fill={maskColor}
                globalCompositeOperation={
                  tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            )}
            {shouldInvertMask && (
              <KonvaImage
                image={canvasBgImage}
                globalCompositeOperation="source-in"
              />
            )}
            {!shouldInvertMask && shouldShowCheckboardTransparency && (
              <KonvaImage
                image={canvasBgImage}
                globalCompositeOperation="source-out"
              />
            )}
            {(cursorPos || shouldShowBrushPreview) && (
              <Circle
                x={cursorPos ? cursorPos.x : canvasBgImage.width / 2}
                y={cursorPos ? cursorPos.y : canvasBgImage.height / 2}
                radius={brushSize / 2}
                stroke={'rgba(0,0,0,1)'}
                strokeWidth={1}
                strokeEnabled={true}
              />
            )}
          </Layer>
        </Stage>
      </div>
    )
  );
};

export default InpaintingCanvas;
