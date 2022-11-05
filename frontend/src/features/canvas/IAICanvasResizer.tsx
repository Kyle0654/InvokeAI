import { Spinner } from '@chakra-ui/react';
import { useLayoutEffect, useRef } from 'react';
import { RootState, useAppDispatch, useAppSelector } from 'app/store';
import { activeTabNameSelector } from 'features/options/optionsSelectors';
import { setStageDimensions, setStageScale } from 'features/tabs/Inpainting/inpaintingSlice';

const IAICanvasResizer = () => {
  const dispatch = useAppDispatch();
  const { doesCanvasNeedScaling, imageToInpaint } = useAppSelector(
    (state: RootState) => state.inpainting
  );
  const activeTabName = useAppSelector(activeTabNameSelector);

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    window.setTimeout(() => {
      if (!ref.current || !imageToInpaint) return;

      const width = ref.current.clientWidth;
      const height = ref.current.clientHeight;

      const scale = Math.min(
        1,
        Math.min(width / imageToInpaint.width, height / imageToInpaint.height)
      );

      dispatch(setStageScale(scale));

      if (activeTabName === 'inpainting') {
        dispatch(
          setStageDimensions({
            width: Math.floor(imageToInpaint.width * scale),
            height: Math.floor(imageToInpaint.height * scale),
          })
        );
      } else if (activeTabName === 'outpainting') {
        dispatch(
          setStageDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          })
        );
      }
    }, 0);
  }, [dispatch, imageToInpaint, doesCanvasNeedScaling, activeTabName]);

  return (
    <div ref={ref} className="inpainting-canvas-area">
      <Spinner thickness="2px" speed="1s" size="xl" />
    </div>
  );
};

export default IAICanvasResizer;