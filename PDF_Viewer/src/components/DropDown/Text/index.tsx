import classNames from 'classnames/bind';
import styles from './Text.module.scss';
import { Core, WebViewerInstance } from '@pdftron/webviewer';
import { COLORS } from '../Shape';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export function toColorObject(
  rgb: { r: number; g: number; b: number; a?: number },
  Annotations: typeof Core.Annotations,
) {
  if (rgb.a === 0) return null;
  return new Annotations.Color(rgb.r, rgb.g, rgb.b, rgb.a ?? 1);
}

export function Text({ instance }: { instance: WebViewerInstance | null }) {
  const { t } = useTranslation('components/DropDown/Text');

  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [fontSize, setFontSize] = useState(12);
  const [selectedTextColor, setSelectedTextColor] = useState<Object>(COLORS[1]);
  const [selectedBorderColor, setSelectedBorderColor] = useState<Object>(COLORS[0]);
  const [selectedFillColor, setSelectedFillColor] = useState<Object>(COLORS[0]);

  const [selectedStyle, setSelectedStyle] = useState<'fill' | 'border'>('fill');
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [opacity, setOpacity] = useState<number>(50);

  useEffect(() => {
    if (!instance) return;

    const { documentViewer } = instance.Core;

    documentViewer.getTool('AnnotationCreateFreeText').setStyles({
      FontSize: fontSize,
      Font: fontFamily,
      TextColor: selectedTextColor,
      StrokeColor: selectedBorderColor,
      FillColor: selectedFillColor,
      Opacity: Number((opacity / 100).toFixed(2)),
    });

    // console.log('AnnotationCreateFreeText: ', documentViewer.getTool('AnnotationCreateFreeText'));
  }, [instance, fontSize, fontFamily, selectedTextColor, selectedFillColor, selectedBorderColor, opacity]);

  return (
    <div className={cx('wrapper')}>
      <span>{t('Text Style')}</span>
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
              <option value="Helvetica" style={{ fontFamily: 'Helvetica' }}>
                Helvetica
              </option>
              <option value="Arimo" style={{ fontFamily: 'Arimo' }}>
                Arimo
              </option>
              <option value="Caladea" style={{ fontFamily: 'Caladea' }}>
                Caladea
              </option>
              <option value="Carlito" style={{ fontFamily: 'Carlito' }}>
                Carlito
              </option>
              <option value="Cousine" style={{ fontFamily: 'Cousine' }}>
                Cousine
              </option>
              <option value="Liberation Serif" style={{ fontFamily: 'Liberation Serif' }}>
                Liberation Serif
              </option>
              <option value="Open Sans" style={{ fontFamily: 'Open Sans' }}>
                Open Sans
              </option>
              <option value="Roboto" style={{ fontFamily: 'Roboto' }}>
                Roboto
              </option>
              <option value="Roboto Mono" style={{ fontFamily: 'Roboto Mono' }}>
                Roboto Mono
              </option>
              <option value="Tinos" style={{ fontFamily: 'Tinos' }}>
                Tinos
              </option>
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
        {COLORS.filter((color) => color.A !== 0).map((color, index) => (
          <div
            key={index}
            className={cx('color-dot', {
              selected: selectedTextColor === color,
            })}
            onClick={() => setSelectedTextColor(color)}
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
        ))}
      </div>

      {/* Frame */}
      <span> {t('Frame Style')}</span>
      <div className={cx('style-container')}>
        <strong className={cx({ selected: selectedStyle === 'fill' })} onClick={() => setSelectedStyle('fill')}>
          {t('Fill')}
        </strong>
        <strong className={cx({ selected: selectedStyle === 'border' })} onClick={() => setSelectedStyle('border')}>
          {t('Border line')}
        </strong>
      </div>
      <div className={cx('color-picker')}>
        {COLORS.map((color, index) => {
          const isSelected = selectedStyle === 'fill' ? selectedFillColor === color : selectedBorderColor === color;

          if (color.A === 0) {
            return (
              <div
                key={index}
                className={cx('color-dot', { selected: isSelected })}
                onClick={() => {
                  selectedStyle === 'border' ? setSelectedBorderColor(color) : setSelectedFillColor(color);
                }}
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
              onClick={() => {
                selectedStyle === 'border' ? setSelectedBorderColor(color) : setSelectedFillColor(color);
              }}
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
      <span>{t('Opacity')}</span>
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
