import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import styles from './UploadFile.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function UploadFile({ setShowUpload }: { setShowUpload: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <div className={cx('overlay')}>
      <div className={cx('upload-popup')}>
        <FontAwesomeIcon icon={faXmark} className={cx('exit')} onClick={() => setShowUpload(false)} />
      </div>
    </div>
  );
}

export default UploadFile;
