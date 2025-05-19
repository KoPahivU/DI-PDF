import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './UploadWarning.module.scss';
import classNames from 'classnames/bind';
import { faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

export function UploadWarning({ setWarningPopup }: { setWarningPopup: Function }) {
  return (
    <div className={cx('error-popup')}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faTriangleExclamation} />
        <div>
          <h4>Cannot upload this file</h4>
          <span style={{ maxWidth: '400px', fontSize: '1.3rem' }}>
            Please ensure the upload file is not more than 20MB and in .pdf format
          </span>
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
