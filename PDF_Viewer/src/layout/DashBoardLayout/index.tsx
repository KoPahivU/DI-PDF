import React, { createContext, useContext, useEffect, useState } from 'react'; // Import React
import styles from './DashBoardLayout.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import Header from '../../components/Header';

const cx = classNames.bind(styles);

interface DashBoardLayoutProps {
  children: React.ReactNode;
}

interface ProfileType {
  _id: string;
  gmail: string;
  fullName: string;
  avatar: string;
  accountType: string;
  isActive: boolean;
}

const AuthContext = createContext<ProfileType | null>(null);

export const useAuth = () => useContext(AuthContext);

const DashBoardLayout: React.FC<DashBoardLayoutProps> = ({ children }) => {
  const token = Cookies.get('DITokens');
  const [profile, setProfile] = useState<ProfileType | null>(null);

  const getProfile = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/user/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        Cookies.remove('DITokens');
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      // console.log('Response: ', responseData.data);
      const data = responseData.data;
      setProfile({
        _id: data._id,
        gmail: data.gmail,
        fullName: data.fullName,
        avatar: data.avatar,
        accountType: data.accountType,
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Post subject error:', error);
      return;
    }
  };

  useEffect(() => {
    const profile = async () => {
      await getProfile();
    };

    profile();
  }, []);

  return (
    <AuthContext.Provider value={profile}>
      <div className={cx('wrapper')}>
        <Header />
        <main className={cx('main')}>{children}</main>
      </div>
    </AuthContext.Provider>
  );
};

export default DashBoardLayout;
