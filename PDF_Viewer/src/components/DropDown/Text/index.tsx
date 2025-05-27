import classNames from 'classnames/bind';
import styles from './Text.module.scss';
import { WebViewerInstance } from '@pdftron/webviewer';
import { COLORS, hexToRgb } from '../Shape';
import { useEffect, useState } from 'react';

const cx = classNames.bind(styles);

export function Text({ instance }: { instance: WebViewerInstance | null }) {
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [fontSize, setFontSize] = useState(12);
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#000000');
  const [selectedFillColor, setSelectedFillColor] = useState<string>('#000000');
  const [selectedBorderColor, setSelectedBorderColor] = useState<string>('#000000');

  const [selectedStyle, setSelectedStyle] = useState<'fill' | 'border'>('fill');
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [opacity, setOpacity] = useState<number>(50);

  useEffect(() => {
    if (!instance) return;

    const { documentViewer, Annotations } = instance.Core;

    const { r: textR, g: textG, b: textB } = hexToRgb(selectedTextColor);
    const { r: fillR, g: fillG, b: fillB } = hexToRgb(selectedFillColor);
    const { r: strokeR, g: strokeG, b: strokeB } = hexToRgb(selectedBorderColor);

    documentViewer.getTool('AnnotationCreateFreeText').setStyles({
      FontSize: fontSize,
      Font: fontFamily,
      TextColor: new instance.Core.Annotations.Color(textR, textG, textB),
      StrokeColor: new instance.Core.Annotations.Color(strokeR, strokeG, strokeB),
      FillColor: new instance.Core.Annotations.Color(fillR, fillG, fillB),
      Opacity: Number((opacity / 100).toFixed(2)),
    });
  }, [instance, fontSize, fontFamily, selectedTextColor, selectedFillColor, selectedBorderColor, opacity]);

  return (
    <div className={cx('wrapper')}>
      <span>Text Style</span>
      {/* Font */}
      <div style={{ display: 'flex' }}>
        <div className={cx('input-group')} style={{ flex: '1' }}>
          <select
            id="font-family"
            className={cx('select-box')}
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            <optgroup label="Font Family">
              <option value="Helvetica">Helvetica</option>
              <option value="Arimo">Arimo</option>
              <option value="Caladea">Caladea</option>
              <option value="Carlito">Carlito</option>
              <option value="Cousine">Cousine</option>
              <option value="Liberation Serif">Liberation Serif</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Roboto">Roboto</option>
              <option value="Roboto Mono">Roboto Mono</option>
              <option value="Tinos">Tinos</option>
            </optgroup>
          </select>
        </div>
        <div className={cx('input-group')}>
          <select
            id="font-size"
            className={cx('select-box')}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          >
            <optgroup label="Size">
              {Array.from({ length: 513 }, (_, i) => (
                <option key={i} value={i}>
                  {i} px
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <div className={cx('color-picker')}>
        {COLORS.map((color) => (
          <div
            key={color}
            className={cx('color-dot', {
              selected: selectedTextColor === color,
            })}
            onClick={() => setSelectedTextColor(color)}
          >
            <div
              style={{
                backgroundColor: color,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '0.5px solid #d0d0d0',
              }}
            />
          </div>
        ))}
      </div>

      {/* Frame */}
      <span>Frame Style</span>
      <div className={cx('style-container')}>
        <strong className={cx({ selected: selectedStyle === 'fill' })} onClick={() => setSelectedStyle('fill')}>
          Fill
        </strong>
        <strong className={cx({ selected: selectedStyle === 'border' })} onClick={() => setSelectedStyle('border')}>
          Border line
        </strong>
      </div>
      <div className={cx('color-picker')}>
        {COLORS.map((color) => (
          <div
            key={color}
            className={cx('color-dot', {
              selected: selectedStyle === 'border' ? selectedBorderColor === color : selectedFillColor === color,
            })}
            onClick={() => {
              selectedStyle === 'border' ? setSelectedBorderColor(color) : setSelectedFillColor(color);
            }}
          >
            <div
              style={{
                backgroundColor: color,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '0.5px solid #d0d0d0',
              }}
            />
          </div>
        ))}
      </div>

      {selectedStyle === 'border' && (
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
            value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            className={cx('slider-stroke')}
          />
          <span className={cx('opacity-value')}>{borderWidth} px</span>
        </div>
      )}

      {/* Opacity */}
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
    </div>
  );
}
