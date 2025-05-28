import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './PermissionError.module.scss';
import classNames from 'classnames/bind';
import { faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export function PermissionError({ setSaveError }: { setSaveError: Function }) {
  const { t } = useTranslation('components/Popup/PermissionError');

  return (
    <div className={cx('error-popup')}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faTriangleExclamation} />
        <div>
          <h4>{t('Unable to update permissions')}</h4>
        </div>
        <FontAwesomeIcon
          style={{ width: '18px', height: '18px', alignSelf: 'center', cursor: 'pointer' }}
          icon={faXmark}
          onClick={() => setSaveError(false)}
        />
      </div>
    </div>
  );
}
