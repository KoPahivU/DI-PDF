import { useState } from 'react';
import styles from './AdminItem.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../layout/DashBoardLayout';

const cx = classNames.bind(styles);

export interface UserItemInterface {
  userId: string;
  fullName: string;
  gmail: string;
  avatar: string;
  access: string;
}

export function AdminItem({ userData }: { userData: UserItemInterface | null }) {
  const profile = useAuth();

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
