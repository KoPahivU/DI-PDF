import { useTranslation } from 'react-i18next';
import styles from './UploadProcess.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export function UploadProcess() {
  const { t } = useTranslation('components/Popup/UploadProcess');

  return (
    <div className={cx('progress-bar-wrapper')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className={cx('spinner')} />

        <span style={{ fontSize: '2rem', fontWeight: '500' }}>{t('On uploading')}...</span>
      </div>
    </div>
  );
}
