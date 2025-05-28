import classNames from 'classnames/bind';
import styles from './RequireHigherPermission.module.scss';

const cx = classNames.bind(styles);

export function RequireHigherPermission() {
  return <div className={cx('wrapper')}>No no</div>;
}
