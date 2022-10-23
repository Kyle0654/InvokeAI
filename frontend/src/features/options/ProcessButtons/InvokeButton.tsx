import { generateImage } from '../../../app/socketio/actions';
import { RootState, useAppDispatch, useAppSelector } from '../../../app/store';
import IAIButton from '../../../common/components/IAIButton';
import useCheckParameters from '../../../common/hooks/useCheckParameters';
import generateMask from '../../tabs/Inpainting/util/generateMask';
import { tabMap } from '../../tabs/InvokeTabs';

export default function InvokeButton() {
  const dispatch = useAppDispatch();
  const isReady = useCheckParameters();

  const activeTab = useAppSelector(
    (state: RootState) => state.options.activeTab
  );

  const { lines } = useAppSelector((state: RootState) => state.inpainting);
  const { currentImage } = useAppSelector((state: RootState) => state.gallery);

  const handleClickGenerate = () => {
    if (tabMap[activeTab] === 'inpainting') {
      if (!currentImage) return;

      const onloadCallback = (maskDataURL: string) => {
        dispatch(
          generateImage({
            inpaintingMask: maskDataURL.split('data:image/png;base64,')[1],
          })
        );
      };

      generateMask(currentImage, lines, onloadCallback);
    } else {
      dispatch(generateImage());
    }
  };

  return (
    <IAIButton
      label="Invoke"
      aria-label="Invoke"
      type="submit"
      isDisabled={!isReady}
      onClick={handleClickGenerate}
      className="invoke-btn"
    />
  );
}
