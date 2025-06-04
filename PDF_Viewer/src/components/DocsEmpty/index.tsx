import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import img_empty from '~/assets/svg/img_empty_in_progress_pic.svg';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import styles from './DocsEmpty.module.scss';
import { useTranslation } from 'react-i18next';
import { MouseEventHandler } from 'react';

const cx = classNames.bind(styles);

export function DocsEmpty({ toggleDropdown }: { toggleDropdown: MouseEventHandler<HTMLDivElement> }) {
  const { t } = useTranslation('components/DocsEmpty');

  return (
    <div className={cx('docs-background')}>
      <img src={img_empty} alt="No Document" />
      <span> {t('noDocsFound')}</span>
      <div className={cx('no-docs-button')} onClick={toggleDropdown}>
        <FontAwesomeIcon className={cx('upload')} icon={faArrowUpFromBracket} />
        {t('upload')}
      </div>
    </div>
  );
}
