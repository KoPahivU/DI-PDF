import React, { ReactNode } from 'react';
import styles from './AuthLayout.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const token = Cookies.get('DITokens');
  const navigate = useNavigate();

  console.log(!(token === undefined));
  console.log(token)

  if (!(token === undefined)) navigate('/');

  return (
    <div>
      <img
        className={cx('background')}
        src="https://plus.unsplash.com/premium_photo-1661955917112-32d44c5c0f78?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Background"
      />
      <main className={cx('main')}>{children}</main>
    </div>
  );
};

export default AuthLayout;
