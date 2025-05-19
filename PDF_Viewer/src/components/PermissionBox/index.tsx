import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../layout/DashBoardLayout';
import { faChevronDown, faCopy, faGlobe, faLock, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { UserItem } from '../UserItem';
import { AdminItem } from '../AdminItem';
import { PdfData, sharedLink } from '../../pages/PdfViewer';
import styles from './PermissionBox.module.scss';
import classNames from 'classnames/bind';
import { SearchUser } from '../SearchUser';
import Cookies from 'js-cookie';

const cx = classNames.bind(styles);

export function PermissionBox({
  access,
  setPermissionPopup,
  pdfData,
}: {
  access: string | undefined;
  setPermissionPopup: Function;
  pdfData: PdfData | null;
}) {
  const token = Cookies.get('DITokens');
  const profile = useAuth();
  console.log('pdf: ', pdfData);
  const [isPublic, setIsPublic] = useState<boolean>(pdfData?.isPublic || false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [link, setLink] = useState<sharedLink[]>(pdfData?.sharedLink || []);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const selectOption = (value: boolean) => {
    setIsPublic(value);
    setShowDropdown(false);
  };

  useEffect(() => {
    if (pdfData?.isPublic !== undefined) {
      setIsPublic(pdfData.isPublic);
    }
  }, [pdfData]);

  useEffect(() => {
    patchPublic();
  }, [isPublic]);

  const patchPublic = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/pdf-files/public`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: pdfData?._id,
          isPublic,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response patchPublic: ', responseData.data);
      if (isPublic) {
        setLink(responseData.data.sharedLink);
      }
    } catch (error) {
      console.error('patchPublic error:', error);
      return;
    }
  };

  return (
    <div className={cx('modal-overlay')}>
      <div className={cx('modal')}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2.5rem' }}>Share '{pdfData?.fileName}'</h1>
          <FontAwesomeIcon icon={faXmark} className={cx('exit')} onClick={() => setPermissionPopup(false)} />
        </div>
        {isPublic && <SearchUser fileId={pdfData?._id} />}

        <AdminItem userData={null} />
        {isPublic && (
          <div className={cx('user-list')}>
            <UserItem userData={null} />
            <UserItem userData={null} />
            <UserItem userData={null} />
            <UserItem userData={null} />
            <UserItem userData={null} />
          </div>
        )}

        {isPublic && (
          <div style={{ fontSize: '1.7rem', fontWeight: '600' }}>
            Public Access
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              className={cx('link-container')}
            >
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '500' }}>Editor shared link</h1>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '400' }}>
                  Anyone with an Internet connection and this link can edit it.
                </h1>
              </div>
              <FontAwesomeIcon
                icon={faCopy}
                className={cx('copy-icon')}
                onClick={() => {
                  const textToCopy = `${process.env.REACT_APP_FE_URI}/file/${pdfData?._id}?shared=${link[0].token}`;
                  navigator.clipboard
                    .writeText(textToCopy)
                    .then(() => {
                      console.log('Copy to clipboard');
                    })
                    .catch((err) => {
                      console.error('Error: ', err);
                    });
                }}
              />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              className={cx('link-container')}
            >
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '500' }}>Viewer shared link</h1>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '400' }}>
                  Anyone with an Internet connection and this link can view it.
                </h1>
              </div>
              <FontAwesomeIcon
                icon={faCopy}
                className={cx('copy-icon')}
                onClick={() => {
                  const textToCopy = `${process.env.REACT_APP_FE_URI}/file/${pdfData?._id}?shared=${link[1].token}`;
                  navigator.clipboard
                    .writeText(textToCopy)
                    .then(() => {
                      console.log('Copy to clipboard');
                    })
                    .catch((err) => {
                      console.error('Error: ', err);
                    });
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={cx('dropdown-container')}>
          <div className={cx('dropdown-selected')} onClick={toggleDropdown}>
            <FontAwesomeIcon
              icon={isPublic ? faGlobe : faLock}
              style={{
                color: isPublic ? '#79c0da' : '#900b09',
              }}
            />
            {isPublic ? 'Public' : 'Private'}
            <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 'auto' }} />
          </div>
          <div className={cx('save')}>Save</div>
          {showDropdown && (
            <div className={cx('dropdown-options')}>
              <div className={cx('option')} onClick={() => selectOption(true)}>
                <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '8px', color: '#79c0da' }} />
                Public
              </div>
              <div className={cx('option')} onClick={() => selectOption(false)}>
                <FontAwesomeIcon icon={faLock} style={{ marginRight: '8px', color: '#900b09' }} />
                Private
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
