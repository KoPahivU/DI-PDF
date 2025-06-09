import { useEffect, useState } from 'react';
import styles from './UserItem.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../layout/DashBoardLayout';
import { SharedUser } from '../../pages/PdfViewer';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export interface UserItemInterface {
  userId: string;
  fullName: string;
  gmail: string;
  avatar: string;
  access: string | undefined;
}

export function UserItem({ sharedUser, setSharedUser }: { sharedUser: SharedUser | null; setSharedUser: Function }) {
  const { t } = useTranslation('components/UserItem');

  const profile = useAuth();
  const token = Cookies.get('DITokens');
  const [access, setAccess] = useState(sharedUser?.access || 'View');
  const [userData, setUserData] = useState<UserItemInterface | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setAccess(value);

    if (!sharedUser) return;

    setSharedUser((prev: SharedUser[]) =>
      prev.map((user) => (user.userId === sharedUser.userId ? { ...user, access: value } : user)),
    );
    console.log(`User ${sharedUser?.userId} set to: ${value}`);
  };

  useEffect(() => {
    if (sharedUser?.userId) {
      getInformation();
    }
  }, [sharedUser?.userId]);

  const getInformation = async () => {
    try {
      console.log('hoh', sharedUser?.access);

      const res = await fetch(`${process.env.REACT_APP_BE_URI}/user/user-information/${sharedUser?.userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response getInformation: ', responseData.data);
      setUserData({
        userId: responseData.data._id,
        fullName: responseData.data.fullName,
        gmail: responseData.data.gmail,
        avatar: responseData.data.avatar,
        access: sharedUser?.access,
      });
    } catch (error) {
      console.error('patchPublic error:', error);
      return;
    }
  };

  console.log(userData?.avatar);

  return (
    <div
      style={{
        height: '45px',
        display: 'flex',
        gap: '7px',
        marginBottom: '10px',
      }}
    >
      <img
        src={
          userData?.avatar === undefined || userData.avatar === ''
            ? 'https://i.pinimg.com/736x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg'
            : userData.avatar
        }
        className={cx('avatar')}
        alt="avatar"
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong style={{ fontSize: '1.4rem', fontWeight: '600' }}>
          {userData?.fullName === undefined || userData.fullName === '' ? 'No Name' : userData.fullName}{' '}
          {userData?.userId === profile?._id && t('(You)')}
        </strong>
        <span style={{ fontSize: '1.2rem', color: '#7C7C7C' }}>
          {userData?.gmail === undefined || userData.gmail === '' ? 'N/A' : userData.gmail}
        </span>
      </div>

      <select
        value={access}
        onChange={handleChange}
        style={{
          height: '35px',
          marginLeft: 'auto',
          padding: '6px 8px',
          fontSize: '1.2rem',
          borderRadius: '6px',
          border: '0px solid #FFFFFF',
        }}
      >
        <option value="Edit">{t('Edit')}</option>
        <option value="View">{t('View')}</option>
        <option value="Remove">{t('Remove')}</option>
      </select>
    </div>
  );
}
