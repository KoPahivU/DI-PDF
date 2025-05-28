import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './PermissionSuccess.module.scss';
import classNames from 'classnames/bind';
import { faCheckToSlot, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export function PermissionSuccess({ setSaveSuccess }: { setSaveSuccess: Function }) {
  const { t } = useTranslation('components/Popup/PermissionSuccess');

  return (
    <div className={cx('success-popup')}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faCheckToSlot} />
        <h4>{t('Permission updated successfully')}</h4>
        <FontAwesomeIcon
          style={{ width: '18px', height: '18px', alignSelf: 'center', cursor: 'pointer', marginLeft: '20px' }}
          icon={faXmark}
          onClick={() => setSaveSuccess(false)}
        />
      </div>
    </div>
  );
}
