import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  Flex,
  FormControl,
  FormLabel,
  SliderMark,
  useToast,
  Popover,
  PopoverTrigger,
  Box,
  PopoverContent,
  PopoverArrow,
} from '@chakra-ui/react';
import { RgbStringColorPicker } from 'react-colorful';
import { ChangeEvent, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  FaEraser,
  FaPaintBrush,
  FaPalette,
  FaRedo,
  FaTrash,
  FaUndo,
} from 'react-icons/fa';
import { RootState, useAppDispatch, useAppSelector } from '../../../app/store';
import IAIIconButton from '../../../common/components/IAIIconButton';
import {
  clearMask,
  InpaintingState,
  redo,
  setMaskColor,
  setBrushSize,
  setMaskOpacity,
  setShouldInvertMask,
  setShouldShowBrushPreview,
  setShouldShowCheckboardTransparency,
  setTool,
  undo,
} from './inpaintingSlice';

import { tabMap } from '../InvokeTabs';
import InpaintingCanvas from './InpaintingCanvas';
import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

const inpaintingEditorSelector = createSelector(
  (state: RootState) => state.inpainting,
  (inpainting: InpaintingState) => {
    return {
      tool: inpainting.tool,
      brushSize: inpainting.brushSize,
      maskColor: inpainting.maskColor,
      maskOpacity: inpainting.maskOpacity,
      shouldInvertMask: inpainting.shouldInvertMask,
      shouldShowCheckboardTransparency:
        inpainting.shouldShowCheckboardTransparency,
      canUndo: inpainting.currentLinesIndex > -1,
      canRedo: inpainting.currentLinesIndex < inpainting.lines.length - 1,
    };
  },
  {
    memoizeOptions: {
      resultEqualityCheck: _.isEqual,
    },
  }
);

const InpaintingEditor = () => {
  const {
    tool,
    brushSize,
    maskColor,
    maskOpacity,
    shouldInvertMask,
    shouldShowCheckboardTransparency,
    canUndo,
    canRedo,
  } = useAppSelector(inpaintingEditorSelector);

  const activeTab =
    tabMap[useAppSelector((state: RootState) => state.options.activeTab)];

  const dispatch = useAppDispatch();
  const toast = useToast();

  // TODO: add mask overlay display
  const [shouldOverlayMask, setShouldOverlayMask] = useState<boolean>(false);

  // Hotkeys
  useHotkeys(
    '[',
    () => {
      if (activeTab === 'inpainting' && brushSize - 5 > 0) {
        handleChangeBrushSize(brushSize - 5);
      } else {
        handleChangeBrushSize(1);
      }
    },
    [brushSize]
  );

  useHotkeys(
    ']',
    () => {
      if (activeTab === 'inpainting') {
        handleChangeBrushSize(brushSize + 5);
      }
    },
    [brushSize]
  );

  useHotkeys('e', () => {
    if (activeTab === 'inpainting') {
      handleSelectEraserTool();
    }
  });

  useHotkeys('b', () => {
    if (activeTab === 'inpainting') {
      handleSelectBrushTool();
    }
  });

  useHotkeys('cmd+z', () => {
    if (activeTab === 'inpainting') {
      handleUndo();
    }
  });

  useHotkeys('cmd+shift+z', () => {
    if (activeTab === 'inpainting') {
      handleRedo();
    }
  });

  useHotkeys('control+z', () => {
    if (activeTab === 'inpainting') {
      handleUndo();
    }
  });

  useHotkeys('control+shift+z', () => {
    if (activeTab === 'inpainting') {
      handleRedo();
    }
  });

  useHotkeys('c', () => {
    if (activeTab === 'inpainting') {
      handleClearMask();
      toast({
        title: 'Mask Cleared',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    }
  });

  const handleClearMask = () => {
    dispatch(clearMask());
  };

  const handleSelectEraserTool = () => dispatch(setTool('eraser'));

  const handleSelectBrushTool = () => dispatch(setTool('brush'));

  const handleChangeBrushSize = (v: number) => {
    dispatch(setShouldShowBrushPreview(true));
    dispatch(setBrushSize(v));
  };

  const handleChangeMaskOpacity = (v: number) => {
    dispatch(setMaskOpacity(v));
  };

  const handleChangeShouldInvertMask = (e: ChangeEvent<HTMLInputElement>) =>
    dispatch(setShouldInvertMask(e.target.checked));

  const handleMouseOverBrushControls = () => {
    dispatch(setShouldShowBrushPreview(true));
  };

  const handleMouseOutBrushControls = () => {
    dispatch(setShouldShowBrushPreview(false));
  };

  const handleChangeBrushColor = (newColor: string) => {
    dispatch(setMaskColor(newColor));
  };

  const handleUndo = () => dispatch(undo());

  const handleRedo = () => dispatch(redo());

  const handleChangeShouldShowCheckerboardTransparency = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    dispatch(setShouldShowCheckboardTransparency(e.target.checked));
  };

  return (
    <div>
      <Flex gap={4} direction={'column'} padding={2}>
        <Flex gap={4}>
          <IAIIconButton
            aria-label="Brush"
            tooltip="Brush"
            icon={<FaPaintBrush />}
            colorScheme={tool === 'brush' ? 'green' : undefined}
            onClick={handleSelectBrushTool}
          />
          <IAIIconButton
            aria-label="Eraser"
            tooltip="Eraser"
            icon={<FaEraser />}
            colorScheme={tool === 'eraser' ? 'green' : undefined}
            onClick={handleSelectEraserTool}
          />
          <IAIIconButton
            aria-label="Clear mask"
            tooltip="Clear mask"
            icon={<FaTrash />}
            colorScheme={'red'}
            onClick={handleClearMask}
          />
          <IAIIconButton
            aria-label="Undo"
            tooltip="Undo"
            icon={<FaUndo />}
            onClick={handleUndo}
            isDisabled={!canUndo}
          />
          <IAIIconButton
            aria-label="Redo"
            tooltip="Redo"
            icon={<FaRedo />}
            isDisabled={!canRedo}
            onClick={handleRedo}
          />
          <Popover trigger={'click'}>
            <PopoverTrigger>
              <Box>
                <IAIIconButton
                  aria-label="Mask Color"
                  tooltip="Mask Color"
                  icon={<FaPalette />}
                />
              </Box>
            </PopoverTrigger>
            <PopoverContent
              onClick={(e) => e.preventDefault()}
              width="min-content"
              height="min-content"
              cursor={'initial'}
              padding="1rem"
            >
              <PopoverArrow />
              <RgbStringColorPicker
                color={maskColor}
                onChange={handleChangeBrushColor}
              />
            </PopoverContent>
          </Popover>
        </Flex>
        <Flex gap={4}>
          <FormControl
            width={300}
            onMouseOver={handleMouseOverBrushControls}
            onMouseEnter={handleMouseOverBrushControls}
            onMouseOut={handleMouseOutBrushControls}
            onMouseLeave={handleMouseOutBrushControls}
          >
            <FormLabel>Brush Size</FormLabel>

            <Slider
              aria-label="Brush Size"
              value={brushSize}
              onChange={handleChangeBrushSize}
              min={1}
              max={500}
              focusThumbOnChange={false}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderMark
                value={brushSize}
                textAlign="center"
                bg="gray.800"
                color="white"
                mt="-10"
                ml="-5"
                w="12"
              >
                {brushSize}px
              </SliderMark>
              <SliderThumb />
            </Slider>
          </FormControl>
          <FormControl width={300}>
            <FormLabel>Mask Opacity</FormLabel>

            <Slider
              aria-label="Mask Opacity"
              value={maskOpacity}
              onChange={handleChangeMaskOpacity}
              min={0}
              max={1}
              step={0.01}
              focusThumbOnChange={false}
              isDisabled={shouldShowCheckboardTransparency || shouldInvertMask}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderMark
                value={maskOpacity}
                textAlign="center"
                bg="gray.800"
                color="white"
                mt="-10"
                ml="-5"
                w="12"
              >
                {maskOpacity}%
              </SliderMark>
              <SliderThumb />
            </Slider>
          </FormControl>
          <FormControl width={300}>
            <FormLabel>Invert Mask Display</FormLabel>
            <Switch
              checked={shouldInvertMask}
              onChange={handleChangeShouldInvertMask}
            />
          </FormControl>
          <FormControl width={300}>
            <FormLabel>Use Checkerboard Transparency</FormLabel>
            <Switch
              checked={shouldShowCheckboardTransparency}
              onChange={handleChangeShouldShowCheckerboardTransparency}
            />
          </FormControl>
        </Flex>
      </Flex>
      <InpaintingCanvas />
    </div>
  );
};

export default InpaintingEditor;
