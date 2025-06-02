import { useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import classNames from 'classnames/bind';
import logo from '~/assets/images/logo.png';
import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../layout/DashBoardLayout';
import i18n from '~/i18n';
import { useTranslation } from 'react-i18next';

// Khởi tạo cx từ classNames
const cx = classNames.bind(styles);

const languages = [
  { code: 'en', label: 'EN', icon: faGlobe },
  { code: 'vi', label: 'VI', icon: faGlobe },
];

function Header() {
  const { t } = useTranslation('components/Header');

  const token = Cookies.get('DITokens');
  const profile = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(i18n.language);

  const toggleOpen = () => setOpen(!open);

  const handleSelect = (code: string) => {
    setSelected(code);
    i18n.changeLanguage(code);
    setOpen(false);
  };

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
      <div className={cx('right-header')}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            onClick={toggleOpen}
            style={{
              cursor: 'pointer',
              border: '1px solid #ccc',
              padding: '6px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              userSelect: 'none',
              backgroundColor: '#fff',
              boxSizing: 'border-box',
            }}
          >
            <FontAwesomeIcon icon={languages.find((l) => l.code === selected)?.icon || faGlobe} />
            {languages.find((l) => l.code === selected)?.label || 'EN'}
          </div>

          {open && (
            <ul
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                listStyle: 'none',
                margin: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                backgroundColor: '#fff',
                borderRadius: '4px',
                minWidth: '100%',
                boxSizing: 'border-box',
                zIndex: 1000,
              }}
            >
              {languages.map(({ code, label, icon }) => (
                <li
                  key={code}
                  onClick={() => handleSelect(code)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: code === selected ? '#eee' : 'transparent',
                  }}
                >
                  <FontAwesomeIcon icon={icon} />
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
        {token === undefined ? (
          <div className={cx('right-header')}>
            <h1 className={cx('sign-in')} onClick={() => navigate('/auth/signin')}>
              {t('Sign in')}
            </h1>
            <h1 className={cx('sign-up')} onClick={() => navigate('/auth/signup')}>
              {t('Sign up')}
            </h1>
          </div>
        ) : (
          <div className={cx('right-header')}>
            <span
              style={{
                color: 'white',
                fontSize: '1.4rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                display: 'inline-block',
              }}
            >
              {t('Good day')}, {profile?.fullName}
            </span>
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
                  {t('Profile')}
                </button>
                <button className={cx('logout')} onClick={handleLogout}>
                  <FontAwesomeIcon className={cx('out-icon')} icon={faRightFromBracket} />
                  {t('Logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;
