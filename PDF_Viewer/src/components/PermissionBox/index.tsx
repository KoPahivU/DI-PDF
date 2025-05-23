import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCopy, faGlobe, faLock, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { UserItem } from '../UserItem';
import { AdminItem } from '../AdminItem';
import { PdfData, SharedLink, SharedUser } from '../../pages/PdfViewer';
import styles from './PermissionBox.module.scss';
import classNames from 'classnames/bind';
import { SearchUser } from '../SearchUser';
import Cookies from 'js-cookie';
import { PermissionSuccess } from '../Popup/PermissionSuccess';
import { PermissionError } from '../Popup/PermissionError';
import { PermissionOnProcess } from '../Popup/PermissionOnProcess';

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
  console.log('pdf: ', pdfData);
  const [isPublic, setIsPublic] = useState<boolean>(pdfData?.isPublic || false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [linkResponsed, setLinkResponsed] = useState<boolean>(pdfData?.isPublic || false);
  const [sharedUser, setSharedUser] = useState<SharedUser[] | undefined>(pdfData?.sharedWith);
  const [link, setLink] = useState<SharedLink[]>(pdfData?.sharedLink || []);

  const [saveError, setSaveError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const [saveIsLoading, setSaveIsLoading] = useState(false);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  useEffect(() => {
    if (pdfData?.isPublic !== undefined) {
      setIsPublic(pdfData.isPublic);
    }
  }, [pdfData]);

  const toggleOption = (state: boolean) => {
    setIsPublic(state);
    setShowDropdown(false);
    patchPublic(state);
  };

  console.log(pdfData);

  const patchPublic = async (newState: boolean) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/pdf-files/public`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: pdfData?._id,
          isPublic: newState,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response patchPublic: ', responseData.data);
      if (newState) {
        setLink(responseData.data.sharedLink);
        setLinkResponsed(true);
      }
    } catch (error) {
      console.error('patchPublic error:', error);
      return;
    }
  };

  console.log(sharedUser);

  const postUserPermission = async () => {
    try {
      if (sharedUser && sharedUser.length > 0) {
        setSaveIsLoading(true);

        const responses = await Promise.all(
          sharedUser.map(async (item, index) => {
            const percent = ((index + 1) / sharedUser.length) * 100;
            setSaveProgress(percent);
            const res = await fetch(`${process.env.REACT_APP_BE_URI}/pdf-files/add-user-permission`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileId: pdfData?._id,
                userId: item.userId,
                access: item.access,
              }),
            });

            if (!res.ok) {
              const errorData = await res.json();
              console.log('Error Response:', errorData);
              setSaveIsLoading(false);
              setSaveSuccess(false);
              setSaveError(true);
              setTimeout(() => {
                setSaveError(false);
              }, 1000);
              throw new Error(errorData.message || 'Invalid credentials');
            }

            const responseData = await res.json();
            console.log('Response postUserPermission: ', responseData.data);
            return responseData.data;
          }),
        );
        setSaveIsLoading(false);
        setSaveProgress(0);
        console.log('All permissions updated:', responses);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 1000);
      }
    } catch (error) {
      console.error('postUserPermission error:', error);
    }
  };

  return (
    <div className={cx('modal-overlay')}>
      <div className={cx('modal')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ fontSize: '2.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Share '{pdfData?.fileName}'
          </h1>
          <FontAwesomeIcon icon={faXmark} className={cx('exit')} onClick={() => setPermissionPopup(false)} />
        </div>
        {isPublic && <SearchUser fileId={pdfData?._id} sharedUser={sharedUser} setSharedUser={setSharedUser} />}

        <AdminItem ownerId={pdfData?.ownerId} />
        {isPublic && linkResponsed && (
          <div className={cx('user-list')}>
            {sharedUser &&
              sharedUser.length > 0 &&
              sharedUser.map((item, index) => {
                return <UserItem key={index} sharedUser={item} setSharedUser={setSharedUser} />;
              })}
          </div>
        )}

        {isPublic && linkResponsed && (
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
          <div className={cx('save')} onClick={postUserPermission}>
            Save
          </div>
          {showDropdown && (
            <div className={cx('dropdown-options')}>
              <div
                className={cx('option')}
                onClick={() => {
                  toggleOption(true);
                }}
              >
                <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '8px', color: '#79c0da' }} />
                Public
              </div>
              <div
                className={cx('option')}
                onClick={() => {
                  toggleOption(false);
                }}
              >
                <FontAwesomeIcon icon={faLock} style={{ marginRight: '8px', color: '#900b09' }} />
                Private
              </div>
            </div>
          )}
        </div>
      </div>
      {saveSuccess && <PermissionSuccess setSaveSuccess={setSaveSuccess} />}
      {saveError && <PermissionError setSaveError={setSaveError} />}
      {saveIsLoading && <PermissionOnProcess saveProgress={saveProgress} />}
    </div>
  );
}
