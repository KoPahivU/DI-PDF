import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './OnSave.module.scss';
import classNames from 'classnames/bind';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

const cx = classNames.bind(styles);

export function OnSave() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 5 ? '.' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cx('success-popup')}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <FontAwesomeIcon className={cx('rotating-icon')} style={{ width: '22px', height: '22px' }} icon={faRotate} />
        <h4>On saving{dots}</h4>
      </div>
    </div>
  );
}
