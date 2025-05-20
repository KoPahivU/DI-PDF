import classNames from 'classnames/bind';
import styles from './GuestDashboard.module.scss';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

export function GuestDashboard() {
  const navigate = useNavigate();
  return (
    <div className={cx('wrapper')}>
      <FontAwesomeIcon className={cx('user-icon')} icon={faUser} />
      <h1 style={{ display: 'flex', gap: '5px', fontSize: '2rem', fontWeight: '400' }}>
        Please
        <strong style={{ cursor: 'pointer', color: '#f5c731' }} onClick={() => navigate('/auth/signin')}>
          Sign In
        </strong>
        to experience more features.
      </h1>
    </div>
  );
}
