import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Active.module.css';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { Loading } from '../../components/Loading';

function Active() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const codeId = searchParams.get('codeId');
  const navigate = useNavigate();

  useEffect(() => {
    if (codeId) {
      fetch(`${process.env.REACT_APP_BE_URI}/auth/verify-code?codeId=${codeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codeId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message === 'Success') {
            Cookies.set('DITokens', data.data.access_token, { expires: 10 });
            navigate('/');
          } else {
            console.log('Error in else');
            navigate('/auth/signup');
          }
        })
        .catch((error) => {
          console.log('Catching errror: ', error);
          navigate('/auth/signup');
        });
    }

    if (token) {
      Cookies.set('DITokens', token, { expires: 10 });
      navigate('/');
    }
  });

  return (
    <div className={styles.wrapper}>
      <Loading />
    </div>
  );
}

export default Active;
