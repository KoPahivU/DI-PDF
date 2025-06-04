import { useEffect, useState } from 'react';
import { WebViewerInstance } from '@pdftron/webviewer';
import classNames from 'classnames/bind';
import styles from './Shape.module.scss';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export const COLORS = [
  { R: 0, G: 0, B: 0, A: 0 },
  { R: 0, G: 0, B: 0, A: 1 },
  { R: 229, G: 57, B: 53, A: 1 },
  { R: 66, G: 133, B: 244, A: 1 },
  { R: 77, G: 182, B: 172, A: 1 },
  { R: 255, G: 235, B: 59, A: 1 },
  { R: 209, G: 236, B: 241, A: 1 },
  { R: 255, G: 255, B: 255, A: 1 },
];

const handleChooseColor = (
  instance: WebViewerInstance,
  selectedFillColor: Object,
  selectedStrokeColor: Object,
  value: string,
  strokeWidth: number,
  opacity: number,
) => {
  const { documentViewer } = instance.Core;

  documentViewer.getTool(value).setStyles({
    StrokeThickness: strokeWidth,
    FillColor: selectedFillColor,
    StrokeColor: selectedStrokeColor,
    Opacity: Number((opacity / 100).toFixed(2)),
  });
};

export function Shape({ instance }: { instance: WebViewerInstance | null }) {
  const { t } = useTranslation('components/DropDown/Shape');

  const [selectedStyle, setSelectedStyle] = useState<'fill' | 'stroke'>('fill');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [selectedFillColor, setSelectedFillColor] = useState<Object>(COLORS[0]);
  const [selectedStrokeColor, setSelectedStrokeColor] = useState<Object>(COLORS[1]);
  const [opacity, setOpacity] = useState<number>(100);

  const handleSelectShape = (value: string) => {
    if (!instance) return;

    setSelectedShape(value);
    instance.UI.setToolMode(value);
    handleChooseColor(instance, selectedFillColor, selectedStrokeColor, value, strokeWidth, opacity);
  };

  useEffect(() => {
    if (!instance || !selectedShape) return;
    handleChooseColor(instance, selectedFillColor, selectedStrokeColor, selectedShape, strokeWidth, opacity);
  }, [opacity, strokeWidth, selectedFillColor, selectedStrokeColor, instance, selectedShape]);

  return (
    <div className={cx('wrapper')}>
      <span> {t('shape')}</span>
      <div className={cx('shape-container')}>
        {/* Rectangle */}
        <div
          className={cx('shape-wrapper', { selected: selectedShape === 'AnnotationCreateRectangle' })}
          onClick={() => handleSelectShape('AnnotationCreateRectangle')}
        >
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cx('shape')}
          >
            <path
              d="M1.54286 2V12H16.4571V2H1.54286ZM0 1.97727C0 1.1614 0.680295 0.5 1.51948 0.5H16.4805C17.3197 0.5 18 1.1614 18 1.97727V12.0227C18 12.8386 17.3197 13.5 16.4805 13.5H1.51948C0.680295 13.5 0 12.8386 0 12.0227V1.97727Z"
              fill="#757575"
            />
          </svg>
        </div>
        {/* Circle */}
        <div
          className={cx('shape-wrapper', { selected: selectedShape === 'AnnotationCreateEllipse' })}
          onClick={() => handleSelectShape('AnnotationCreateEllipse')}
        >
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cx('shape')}
          >
            <path
              d="M9 1.4C4.79414 1.4 1.4 3.72877 1.4 7C1.4 10.2712 4.79414 12.6 9 12.6C13.2059 12.6 16.6 10.2712 16.6 7C16.6 3.72877 13.2059 1.4 9 1.4ZM0 7C0 3.13401 4.02944 0 9 0C13.9706 0 18 3.13401 18 7C18 10.866 13.9706 14 9 14C4.02944 14 0 10.866 0 7Z"
              fill="#757575"
            />
          </svg>
        </div>
        {/* Triangle */}
        <div
          className={cx('shape-wrapper', { selected: selectedShape === 'AnnotationCreatePolygon' })}
          onClick={() => handleSelectShape('AnnotationCreatePolygon')}
        >
          <svg
            width="16"
            height="14"
            viewBox="0 0 16 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cx('shape')}
          >
            <path
              d="M8 1.97183L14.1769 12.6197H1.82315L8 1.97183ZM8.68632 0.394366C8.38129 -0.131455 7.61871 -0.131455 7.31368 0.394366L0.107356 12.8169C-0.197674 13.3427 0.183614 14 0.793674 14H15.2063C15.8164 14 16.1977 13.3427 15.8926 12.8169L8.68632 0.394366Z"
              fill="#757575"
            />
          </svg>
        </div>
        {/* Line */}
        <div
          className={cx('shape-wrapper', { selected: selectedShape === 'AnnotationCreateLine' })}
          onClick={() => handleSelectShape('AnnotationCreateLine')}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cx('shape')}
          >
            <path
              d="M15.4697 1.53022C15.7626 1.82311 15.7626 2.29798 15.4697 2.59088L2.53033 15.5302C2.23744 15.8231 1.76256 15.8231 1.46967 15.5302C1.17678 15.2373 1.17678 14.7625 1.46967 14.4696L14.409 1.53022C14.7019 1.23732 15.1768 1.23732 15.4697 1.53022Z"
              fill="#757575"
            />
          </svg>
        </div>
        {/* Arrow */}
        <div
          className={cx('shape-wrapper', { selected: selectedShape === 'AnnotationCreateArrow' })}
          onClick={() => handleSelectShape('AnnotationCreateArrow')}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cx('shape')}
          >
            <path
              d="M14.5807 1.07227C14.67 0.735547 14.3607 0.426273 14.024 0.515573L6.70033 2.45786C6.36361 2.54716 6.25198 2.96806 6.4994 3.21548L8.642 5.35808L0.43179 13.5683C0.159716 13.8404 0.176593 14.2984 0.469486 14.5913C0.762379 14.8841 1.22038 14.901 1.49245 14.629L9.70266 6.41874L11.8808 8.59685C12.1282 8.84427 12.5491 8.73265 12.6384 8.39593L14.5807 1.07227Z"
              fill="#757575"
            />
          </svg>
        </div>
      </div>

      <span>{t('style')}</span>
      <div className={cx('style-container')}>
        <strong className={cx({ selected: selectedStyle === 'fill' })} onClick={() => setSelectedStyle('fill')}>
          {t('fill')}
        </strong>
        <strong className={cx({ selected: selectedStyle === 'stroke' })} onClick={() => setSelectedStyle('stroke')}>
          {t('stroke')}
        </strong>
      </div>

      {selectedStyle === 'stroke' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M3 5.25C3 4.83579 3.33579 4.5 3.75 4.5H20.25C20.6642 4.5 21 4.83579 21 5.25C21 5.66421 20.6642 6 20.25 6H3.75C3.33579 6 3 5.66421 3 5.25ZM3 11C3 10.4477 3.44772 10 4 10H20C20.5523 10 21 10.4477 21 11C21 11.5523 20.5523 12 20 12H4C3.44772 12 3 11.5523 3 11ZM4.375 16.25C3.61561 16.25 3 16.8656 3 17.625C3 18.3844 3.61561 19 4.375 19H19.625C20.3844 19 21 18.3844 21 17.625C21 16.8656 20.3844 16.25 19.625 16.25H4.375Z"
              fill="#325167"
            />
          </svg>

          <input
            type="range"
            min={0}
            max={100}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className={cx('slider-stroke')}
          />
          <span className={cx('opacity-value')}>{strokeWidth} px</span>
        </div>
      )}

      <div className={cx('color-picker')}>
        {COLORS.map((color, index) => {
          const isSelected = selectedStyle === 'fill' ? selectedFillColor === color : selectedStrokeColor === color;

          if (color.A === 0) {
            return (
              <div
                key={index}
                className={cx('color-dot', { selected: isSelected })}
                onClick={() => (selectedStyle === 'fill' ? setSelectedFillColor(color) : setSelectedStrokeColor(color))}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20.4003 11C20.4002 8.61985 19.5138 6.44743 18.0554 4.79141L4.79092 18.0559C6.44694 19.5143 8.61936 20.4007 10.9995 20.4008C16.191 20.4008 20.4003 16.1915 20.4003 11ZM1.5999 11C1.5999 13.3796 2.48587 15.5515 3.94365 17.2074L17.2069 3.94414C15.551 2.48636 13.3791 1.60039 10.9995 1.60039C5.80834 1.6006 1.60011 5.80883 1.5999 11ZM21.6003 11C21.6003 16.8542 16.8537 21.6008 10.9995 21.6008C5.14547 21.6006 0.399902 16.8541 0.399902 11C0.400113 5.14609 5.1456 0.400602 10.9995 0.400391C16.8536 0.400391 21.6001 5.14596 21.6003 11Z"
                    fill="#5A5A5A"
                  />
                </svg>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={cx('color-dot', { selected: isSelected })}
              onClick={() => (selectedStyle === 'fill' ? setSelectedFillColor(color) : setSelectedStrokeColor(color))}
            >
              <div
                style={{
                  backgroundColor: `rgba(${color.R}, ${color.G}, ${color.B}, ${color.A})`,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '0.5px solid #d0d0d0',
                }}
              />
            </div>
          );
        })}
      </div>

      <span>{t('opacity')}</span>
      <div className={cx('opacity-slider')}>
        <div className={cx('opacity-track')}>
          <div className={cx('checkerboard')} />
          <div className={cx('gradient-overlay')} />
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className={cx('slider-input')}
          />
          <div
            className={cx('slider-thumb')}
            style={{
              left: `${opacity}%`,
            }}
          />
        </div>
        <span className={cx('opacity-value')}>{opacity} %</span>
      </div>
    </div>
  );
}
