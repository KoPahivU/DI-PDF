import { useTranslation } from 'react-i18next';
import styles from './UploadProcess.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export function UploadProcess({ uploadProgress }: { uploadProgress: number }) {
  const { t } = useTranslation('components/Popup/UploadProcess');

  return (
    <div className={cx('progress-bar-wrapper')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 0 10px 5px' }}>
        <div className={cx('spinner')}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <span style={{ fontSize: '2rem', fontWeight: '500' }}>{t('On uploading')}...</span>
      </div>
      <div className={cx('progress-bar')} style={{ width: `${uploadProgress}%` }}></div>
    </div>
  );
}
