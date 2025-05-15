import Header from '../../components/Header';
import styles from './LandingLayout.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  return (
    <div className={cx('wrapper')}>
      <Header />
      <main className={cx('main')}>{children}</main>
    </div>
  );
};

export default LandingLayout;
