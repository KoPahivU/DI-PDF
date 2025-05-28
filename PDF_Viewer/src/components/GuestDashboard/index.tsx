import classNames from 'classnames/bind';
import styles from './GuestDashboard.module.scss';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export function GuestDashboard() {
  const { t } = useTranslation('components/GuestDashboard');

  const navigate = useNavigate();
  return (
    <div className={cx('wrapper')}>
      <FontAwesomeIcon className={cx('user-icon')} icon={faUser} />
      <h1 style={{ display: 'flex', gap: '5px', fontSize: '2rem', fontWeight: '400' }}>
        {t('Please')}
        <strong style={{ cursor: 'pointer', color: '#f5c731' }} onClick={() => navigate('/auth/signin')}>
          {t('Sign In')}
        </strong>
        {t('to experience more features')}...
      </h1>
    </div>
  );
}
