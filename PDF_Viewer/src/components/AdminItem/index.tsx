import { useEffect, useState } from 'react';
import styles from './AdminItem.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../layout/DashBoardLayout';
import Cookies from 'js-cookie';
import { UserItemInterface } from '../UserItem';

const cx = classNames.bind(styles);

export function AdminItem({ ownerId }: { ownerId: string | undefined }) {
  const profile = useAuth();
  const token = Cookies.get('DITokens');
  const [userData, setUserData] = useState<UserItemInterface | null>(null);

  useEffect(() => {
    if (ownerId) {
      getInformation();
    }
  }, [ownerId]);

  const getInformation = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/user/user-information/${ownerId}`, {
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
        access: 'Owner',
      });
    } catch (error) {
      console.error('patchPublic error:', error);
      return;
    }
  };

  return (
    <div style={{ height: '45px', display: 'flex', gap: '7px' }}>
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
          {userData?.userId === profile?._id && '(You)'}
        </strong>
        <span style={{ fontSize: '1.2rem', color: '#7C7C7C' }}>
          {userData?.gmail === undefined || userData.gmail === '' ? 'N/A' : userData.gmail}
        </span>
      </div>

      <h1
        style={{
          textAlign: 'center',
          height: '40px',
          marginLeft: 'auto',
          padding: '6px 8px',
          fontSize: '1.2rem',
          borderRadius: '6px',
          color: '#757575',
          fontStyle: 'italic',
          fontWeight: '400',
        }}
      >
        Doc Owner
      </h1>
    </div>
  );
}
