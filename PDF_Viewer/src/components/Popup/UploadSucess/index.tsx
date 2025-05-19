import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './UploadSucess.module.scss';
import classNames from 'classnames/bind';
import { faCheckToSlot, faXmark } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

export function UploadSucess({ setSuccessPopup }: { setSuccessPopup: Function }) {
  return (
    <div className={cx('success-popup')}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faCheckToSlot} />
        <h4>Uploaded successfully</h4>
        <FontAwesomeIcon
          style={{ width: '18px', height: '18px', alignSelf: 'center', cursor: 'pointer', marginLeft: '20px' }}
          icon={faXmark}
          onClick={() => setSuccessPopup(false)}
        />
      </div>
    </div>
  );
}
