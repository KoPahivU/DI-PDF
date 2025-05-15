import styles from './EmptyLayout.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

interface EmptyLayoutProps {
  children: React.ReactNode;
}

const EmptyLayout: React.FC<EmptyLayoutProps> = ({children}) =>{
    return <div className={cx('wrapper')}>
        <main className={cx('main')}>{children}</main>

    </div>;
}

export default EmptyLayout;