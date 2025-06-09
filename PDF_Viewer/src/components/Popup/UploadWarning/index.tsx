import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './UploadWarning.module.scss';
import classNames from 'classnames/bind';
import { faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export function UploadWarning({ setWarningPopup, text }: { setWarningPopup: Function; text: string }) {
  const { t } = useTranslation('components/Popup/UploadWarning');

  return (
    <div className={cx('error-popup')}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <FontAwesomeIcon
          style={{ width: '25px', height: '25px', alignSelf: 'center', marginRight: '3px' }}
          icon={faTriangleExclamation}
        />
        <div>
          <h4> {t('Cannot upload this file')}</h4>
          <span style={{ maxWidth: '400px', fontSize: '1.3rem' }}>{text}</span>
        </div>
        <FontAwesomeIcon
          style={{ width: '18px', height: '18px', alignSelf: 'center', cursor: 'pointer' }}
          icon={faXmark}
          onClick={() => setWarningPopup(false)}
        />
      </div>
    </div>
  );
}
