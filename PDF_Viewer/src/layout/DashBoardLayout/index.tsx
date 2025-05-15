import React from 'react'; // Import React
import styles from './DashBoardLayout.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import Header from '../../components/Header';

const cx = classNames.bind(styles);

interface DashBoardLayoutProps {
  children: React.ReactNode;
}

const DashBoardLayout: React.FC<DashBoardLayoutProps> = ({ children }) => {
  const token = Cookies.get('DITokens');

  console.log('Token: ', token)

  return (
    <div className={cx('wrapper')}>
      <Header token={token} />
      <main className={cx('main')}>{children}</main>
    </div>
  );
};

export default DashBoardLayout;
