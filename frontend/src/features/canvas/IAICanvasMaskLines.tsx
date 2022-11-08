import { GroupConfig } from 'konva/lib/Group';
import { Group, Line } from 'react-konva';
import { useAppSelector } from 'app/store';
import { createSelector } from '@reduxjs/toolkit';
import { currentCanvasSelector, GenericCanvasState } from './canvasSlice';

export const canvasLinesSelector = createSelector(
  currentCanvasSelector,
  (currentCanvas: GenericCanvasState) => {
    const { lines } = currentCanvas;
    return {
      lines,
    };
  }
);

type InpaintingCanvasLinesProps = GroupConfig;

/**
 * Draws the lines which comprise the mask.
 *
 * Uses globalCompositeOperation to handle the brush and eraser tools.
 */
const IAICanvasLines = (props: InpaintingCanvasLinesProps) => {
  const { ...rest } = props;
  const { lines } = useAppSelector(canvasLinesSelector);

  return (
    <Group {...rest}>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          stroke={'rgb(0,0,0)'} // The lines can be any color, just need alpha > 0
          strokeWidth={line.strokeWidth * 2}
          tension={0}
          lineCap="round"
          lineJoin="round"
          shadowForStrokeEnabled={false}
          listening={false}
          globalCompositeOperation={
            line.tool === 'maskBrush' ? 'source-over' : 'destination-out'
          }
        />
      ))}
    </Group>
  );
};

export default IAICanvasLines;