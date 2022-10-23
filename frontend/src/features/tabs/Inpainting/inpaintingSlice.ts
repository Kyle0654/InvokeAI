import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type InpaintingTool = 'brush' | 'eraser';

export type MaskLine = {
  tool: InpaintingTool;
  strokeWidth: number;
  points: number[];
};

export type MaskCircle = {
  tool: InpaintingTool;
  radius: number;
  x: number;
  y: number;
};

export interface InpaintingState {
  tool: 'brush' | 'eraser';
  brushSize: number;
  maskColor: string;
  maskOpacity: number;
  lines: MaskLine[];
  currentLinesIndex: number;
  shouldHideMask: boolean;
  shouldInvertMask: boolean;
  shouldShowCheckboardTransparency: boolean;
  shouldShowBrushPreview: boolean;
}

const initialInpaintingState: InpaintingState = {
  tool: 'brush',
  brushSize: 20,
  maskColor: 'rgb(255,0,0)',
  maskOpacity: 1,
  lines: [],
  currentLinesIndex: -1,
  shouldHideMask: false,
  shouldInvertMask: false,
  shouldShowCheckboardTransparency: false,
  shouldShowBrushPreview: false,
};

const initialState: InpaintingState = initialInpaintingState;

export const inpaintingSlice = createSlice({
  name: 'inpainting',
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<InpaintingTool>) => {
      state.tool = action.payload;
    },
    setBrushSize: (state, action: PayloadAction<number>) => {
      state.brushSize = action.payload;
    },
    addLine: (state, action: PayloadAction<MaskLine>) => {
      state.lines = state.lines.slice(0, state.currentLinesIndex + 1);
      state.lines.push(action.payload);
      state.currentLinesIndex += 1;
    },
    addPointToCurrentLine: (state, action: PayloadAction<number[]>) => {
      state.lines[state.currentLinesIndex].points.push(...action.payload);
    },
    undo: (state) => {
      state.currentLinesIndex = Math.max(state.currentLinesIndex - 1, -1);
    },
    redo: (state) => {
      state.currentLinesIndex = Math.min(
        state.currentLinesIndex + 1,
        state.lines.length - 1
      );
    },
    clearMask: (state) => {
      state.lines = [];
      state.currentLinesIndex = -1;
      state.shouldInvertMask = false;
    },
    setShouldInvertMask: (state, action: PayloadAction<boolean>) => {
      state.shouldInvertMask = action.payload;
    },
    setShouldHideMask: (state, action: PayloadAction<boolean>) => {
      state.shouldHideMask = action.payload;
    },
    setShouldShowCheckboardTransparency: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.shouldShowCheckboardTransparency = action.payload;
    },
    setShouldShowBrushPreview: (state, action: PayloadAction<boolean>) => {
      state.shouldShowBrushPreview = action.payload;
    },
    setMaskColor: (state, action: PayloadAction<string>) => {
      state.maskColor = action.payload;
    },
    setMaskOpacity: (state, action: PayloadAction<number>) => {
      state.maskOpacity = action.payload;
    },
  },
});

export const {
  setTool,
  setBrushSize,
  addLine,
  addPointToCurrentLine,
  setShouldInvertMask,
  setShouldShowCheckboardTransparency,
  setShouldShowBrushPreview,
  setMaskColor,
  clearMask,
  setMaskOpacity,
  undo,
  redo,
} = inpaintingSlice.actions;

export default inpaintingSlice.reducer;
