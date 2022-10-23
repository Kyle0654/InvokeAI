import Konva from 'konva';
import * as InvokeAI from '../../../../app/invokeai';
import { MaskLine } from '../inpaintingSlice';

/**
 * Generating a mask image from InpaintingCanvas.tsx is not as simple
 * as calling toDataURL() on the canvas, because the mask may be represented
 * by colored lines or transparency, or the user may have inverted the mask
 * display.
 *
 * So we need to regenerate the mask image by creating an offscreen canvas,
 * drawing the mask and compositing everything correctly to output a valid
 * mask image. I can't think of any other way to generate the mask image.
 *
 * To further complicate things, we cannot get the HTMLImageElement needed
 * unless we load an image. And then we don't get access to that until the
 * image has loaded - so to get that image to our server, we need to provide
 * an onloadCallback which actually dispatches the generation request.
 *
 * Probably should use the Context API to provide the image to both this
 * function and InpaintingCanvas, making this a lot simpler.
 */
const generateMask = (
  currentImage: InvokeAI.Image,
  lines: MaskLine[],
  onloadCallback: (maskDataURL: string) => void
) => {
  const image = new Image();

  image.onload = () => {
    const { width, height } = image;
    const offscreenContainer = document.createElement('div');
    const stage = new Konva.Stage({
      container: offscreenContainer,
      width: width,
      height: height,
    });

    const layer = new Konva.Layer();

    stage.add(layer);

    lines.forEach((line) =>
      layer.add(
        new Konva.Line({
          points: line.points,
          stroke: 'rgb(255,0,0)',
          strokeWidth: line.strokeWidth * 2,
          tension: 0,
          lineCap: 'round',
          lineJoin: 'round',
          shadowForStrokeEnabled: false,
          globalCompositeOperation:
            line.tool === 'brush' ? 'source-over' : 'destination-out',
        })
      )
    );

    layer.add(
      new Konva.Image({ image: image, globalCompositeOperation: 'source-out' })
    );

    const maskDataURL = stage.toDataURL();

    onloadCallback(maskDataURL);
  };

  image.src = currentImage.url;
};

export default generateMask;
