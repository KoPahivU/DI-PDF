import { useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import classNames from 'classnames/bind';
import logo from '~/assets/images/logo.png';
import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../layout/DashBoardLayout';

// Khởi tạo cx từ classNames
const cx = classNames.bind(styles);

function Header() {
  const token = Cookies.get('DITokens');
  const profile = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    Cookies.remove('DITokens');
    navigate('/');
    window.location.reload();
  };

  const [hiddenBox, setHiddenBox] = useState<boolean>(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setHiddenBox(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('left-header')} onClick={() => navigate('/')}>
        <img className={cx('logo')} src={logo} alt="Logo" />
        <h1 className={cx('name')}>DI-PDF</h1>
      </div>
      {token === undefined ? (
        <div className={cx('right-header')}>
          <h1 className={cx('sign-in')} onClick={() => navigate('/auth/signin')}>
            Sign in
          </h1>
          <h1 className={cx('sign-up')} onClick={() => navigate('/auth/signup')}>
            Sign up
          </h1>
        </div>
      ) : (
        <div className={cx('right-header')} ref={dropdownRef}>
          <img
            className={cx('avatar')}
            src={
              profile?.avatar && profile.avatar.trim() !== ''
                ? profile.avatar
                : 'https://i.pinimg.com/736x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg'
            }
            alt="Avatar"
            onClick={() => setHiddenBox(!hiddenBox)}
          />
          {hiddenBox && (
            <div className={cx('dropdown')}>
              <button className={cx('profile')} onClick={handleLogout}>
                <FontAwesomeIcon className={cx('user-icon')} icon={faUser} />
                Profile
              </button>
              <button className={cx('logout')} onClick={handleLogout}>
                <FontAwesomeIcon className={cx('out-icon')} icon={faRightFromBracket} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Header;
