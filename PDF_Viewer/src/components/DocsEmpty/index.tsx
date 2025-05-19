import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './DocsEmpty.module.scss';
import classNames from 'classnames/bind';
import img_empty from '~/assets/svg/img_empty_in_progress_pic.svg';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

export function DocsEmpty({ toggleDropdown }: { toggleDropdown: Function }) {
  return (
    <div className={cx('docs-background')}>
      <img src={img_empty} alt="No Document" />
      <span>There is no document founded</span>
      <div className={cx('no-docs-button')} onClick={() => toggleDropdown()}>
        <FontAwesomeIcon className={cx('upload')} icon={faArrowUpFromBracket} />
        Upload Document
      </div>
    </div>
  );
}
