import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import img_empty from '~/assets/svg/img_empty_in_progress_pic.svg';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import styles from './DocsEmpty.module.scss';
import { useTranslation } from 'react-i18next';
import { MouseEventHandler, useRef, useState } from 'react';

const cx = classNames.bind(styles);

export function DocsEmpty({
  handleLocalClick,
  handleDriveClick,
}: {
  handleLocalClick: Function;
  handleDriveClick: Function;
}) {
  const { t } = useTranslation('components/DocsEmpty');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  return (
    <div className={cx('docs-background')}>
      <img src={img_empty} alt="No Document" />
      <span> {t('noDocsFound')}</span>
      <div style={{ position: 'relative' }}>
        <div className={cx('no-docs-button')} onClick={() => setDropdownOpen(!dropdownOpen)}>
          <FontAwesomeIcon className={cx('upload')} icon={faArrowUpFromBracket} />
          {t('upload')}
        </div>
        {dropdownOpen && (
          <div ref={dropdownRef} className={cx('upload-dropdown')}>
            <div className={cx('upload-option')} onClick={() => handleLocalClick()}>
              📁 {t('From local file')}
            </div>
            <div className={cx('upload-option')} onClick={async () => await handleDriveClick()}>
              ☁️ {t('From Google Drive')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
