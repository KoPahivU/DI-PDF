import { useEffect, useRef, useState } from 'react';
import styles from './SearchUser.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';

const cx = classNames.bind(styles);

interface User {
  _id: string;
  avatar: string;
  fullName: string;
  gmail: string;
}

export function SearchUser({ fileId }: { fileId: string | undefined }) {
  console.log('File: ', fileId);
  const token = Cookies.get('DITokens');

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [userData, setUserData] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTerm === '') {
      setUserData([]);
      setShowDropdown(false);
      return;
    }

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      searchUser(searchTerm);
    }, 500);

    setDebounceTimeout(timeout);
  }, [searchTerm]);

  const searchUser = async (input: string) => {
    try {
      console.log(
        JSON.stringify({
          fileId: fileId,
          searchInput: input,
        }),
      );
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/user/search-user`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
          searchInput: input,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response search: ', responseData.data);
      if (responseData.data.user.length > 0) {
        const newUser: User[] = responseData.data.user.map((data: any) => {
          console.log(data.avatar);
          return {
            _id: data._id,
            avatar:
              data.avatar !== ''
                ? data.avatar
                : 'https://i.pinimg.com/736x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg',
            fullName: data.fullName,
            gmail: data.gmail,
          };
        });
        setUserData(newUser);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Post search error:', error);
      return;
    }
  };

  return (
    <div className={cx('wrapper')}>
      <input
        ref={inputRef}
        className={cx('input')}
        placeholder="Insert gmail or name"
        onChange={(e) => {
          setUserData([]);
          setSearchTerm(e.target.value);
        }}
      />

      {showDropdown && userData.length > 0 && (
        <ul className={cx('dropdown')}>
          {userData.map((user) => (
            <li key={user._id} className={cx('dropdownItem')}>
              <img src={user.avatar} alt="avatar" className={cx('avatar')} />
              <div className={cx('info')}>
                <strong style={{ fontSize: '1.6rem' }}>{user.fullName || 'No Name'}</strong>
                <span style={{ fontSize: '1.4rem' }}>{user.gmail}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
