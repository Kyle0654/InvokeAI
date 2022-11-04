import React from 'react';
import IAISlider from '../../../../../common/components/IAISlider';

import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from '../../../../../app/store';
import { createSelector } from '@reduxjs/toolkit';
import {
  InpaintingState,
  setBoundingBoxDimensions,
} from '../../../../tabs/Inpainting/inpaintingSlice';

import { roundDownToMultiple } from '../../../../../common/util/roundDownToMultiple';
import _ from 'lodash';

const boundingBoxDimensionsSelector = createSelector(
  (state: RootState) => state.inpainting,
  (inpainting: InpaintingState) => {
    const { canvasDimensions, boundingBoxDimensions, shouldLockBoundingBox } =
      inpainting;
    return {
      canvasDimensions,
      boundingBoxDimensions,
      shouldLockBoundingBox,
    };
  },
  {
    memoizeOptions: {
      resultEqualityCheck: _.isEqual,
    },
  }
);

type BoundingBoxDimensionSlidersType = {
  dimension: 'width' | 'height';
  label: string;
};

export default function BoundingBoxDimensionSlider(
  props: BoundingBoxDimensionSlidersType
) {
  const { dimension, label } = props;
  const dispatch = useAppDispatch();
  const { shouldLockBoundingBox, canvasDimensions, boundingBoxDimensions } =
    useAppSelector(boundingBoxDimensionsSelector);

  const canvasDimension = canvasDimensions[dimension];
  const boundingBoxDimension = boundingBoxDimensions[dimension];

  const handleBoundingBoxDimension = (v: number) => {
    if (dimension == 'width') {
      dispatch(
        setBoundingBoxDimensions({
          ...boundingBoxDimensions,
          width: Math.floor(v),
        })
      );
    }

    if (dimension == 'height') {
      dispatch(
        setBoundingBoxDimensions({
          ...boundingBoxDimensions,
          height: Math.floor(v),
        })
      );
    }
  };

  const handleResetDimension = () => {
    if (dimension == 'width') {
      dispatch(
        setBoundingBoxDimensions({
          ...boundingBoxDimensions,
          width: Math.floor(canvasDimension),
        })
      );
    }
    if (dimension == 'height') {
      dispatch(
        setBoundingBoxDimensions({
          ...boundingBoxDimensions,
          height: Math.floor(canvasDimension),
        })
      );
    }
  };

  return (
    <>
      {/* <div className="inpainting-bounding-box-dimensions-slider-numberinput">
        <IAISlider
          isDisabled={shouldLockBoundingBox}
          label={label}
          min={64}
          max={roundDownToMultiple(canvasDimension, 64)}
          step={64}
          value={boundingBoxDimension}
          onChange={handleBoundingBoxDimension}
          width={'5rem'}
        />
        <IAINumberInput
          isDisabled={shouldLockBoundingBox}
          value={boundingBoxDimension}
          onChange={handleBoundingBoxDimension}
          min={64}
          max={roundDownToMultiple(canvasDimension, 64)}
          step={64}
          padding="0"
          width={'5rem'}
        />
        <IAIIconButton
          size={'sm'}
          aria-label={'Reset Height'}
          tooltip={'Reset Height'}
          onClick={handleResetDimension}
          icon={<BiReset />}
          styleClass="inpainting-bounding-box-reset-icon-btn"
          isDisabled={
            shouldLockBoundingBox || canvasDimension === boundingBoxDimension
          }
        />
      </div> */}
      <IAISlider
        label={label}
        value={boundingBoxDimension}
        min={64}
        max={roundDownToMultiple(canvasDimension, 64)}
        step={64}
        onChange={handleBoundingBoxDimension}
        withReset
        handleReset={handleResetDimension}
        isResetDisabled={
          shouldLockBoundingBox || canvasDimension === boundingBoxDimension
        }
        withSliderMarks
        withInput
        isInteger
        inputReadOnly
      />
    </>
  );
}
