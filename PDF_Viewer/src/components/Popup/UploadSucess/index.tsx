import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckToSlot, faXmark } from '@fortawesome/free-solid-svg-icons';
import styles from './UploadSucess.module.scss';
import classNames from 'classnames/bind';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export function UploadSucess({ setSuccessPopup }: { setSuccessPopup: Function }) {
  const { t } = useTranslation('components/Popup/UploadSucess');

  return (
    <div className={cx('success-popup')}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faCheckToSlot} />
        <h4>{t('Uploaded successfully')}</h4>
        <FontAwesomeIcon
          style={{ width: '18px', height: '18px', alignSelf: 'center', cursor: 'pointer', marginLeft: '20px' }}
          icon={faXmark}
          onClick={() => setSuccessPopup(false)}
        />
      </div>
    </div>
  );
}
