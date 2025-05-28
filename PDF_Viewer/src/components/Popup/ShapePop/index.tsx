import { useEffect, useState } from 'react';
import { WebViewerInstance } from '@pdftron/webviewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { COLORS } from '~/components/DropDown/Shape';
import classNames from 'classnames/bind';
import styles from './ShapePop.module.scss';

const cx = classNames.bind(styles);

export function ShapePop({ instance, selectedAnnot }: { instance: WebViewerInstance | null; selectedAnnot: any }) {
  const [selectedStyle, setSelectedStyle] = useState<'fill' | 'stroke'>('fill');
  const [strokeWidth, setStrokeWidth] = useState<number>(selectedAnnot.StrokeThickness);
  const [selectedFillColor, setSelectedFillColor] = useState<Object>(selectedAnnot.FillColor);
  const [selectedStrokeColor, setSelectedStrokeColor] = useState<Object>(selectedAnnot.StrokeColor);
  const [opacity, setOpacity] = useState<number>(selectedAnnot.Opacity * 100);

  useEffect(() => {
    if (!instance || !selectedAnnot) return;

    const { annotationManager } = instance.Core;

    selectedAnnot.StrokeColor = selectedStrokeColor;

    selectedAnnot.FillColor = selectedFillColor;

    selectedAnnot.Opacity = Number((opacity / 100).toFixed(2));
    selectedAnnot.StrokeThickness = strokeWidth;

    annotationManager.redrawAnnotation(selectedAnnot);
  }, [opacity, strokeWidth, selectedFillColor, selectedStrokeColor, instance, selectedAnnot]);

  return (
    <div className={cx('wrapper')}>
      <span style={{ paddingTop: '10px' }}>Style</span>
      <div className={cx('style-container')}>
        <strong className={cx({ selected: selectedStyle === 'fill' })} onClick={() => setSelectedStyle('fill')}>
          Fill
        </strong>
        <strong className={cx({ selected: selectedStyle === 'stroke' })} onClick={() => setSelectedStyle('stroke')}>
          Stroke
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

      <span>Opacity</span>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '2px solid #d9d9d9',
          gap: '10px',
          padding: '5px 10px',
          color: '#E53935',
          cursor: 'pointer',
        }}
        className={cx('delete-annot')}
        onClick={() => {
          if (instance && selectedAnnot) instance.Core.annotationManager.deleteAnnotation(selectedAnnot);
        }}
      >
        <FontAwesomeIcon icon={faTrashCan} />
        <span>Delete</span>
      </div>
    </div>
  );
}
