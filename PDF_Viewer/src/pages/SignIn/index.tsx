import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import logo from '~/assets/images/logo.png';
import styles from './SignIn.module.scss';
import classNames from 'classnames/bind';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

function isValidPassword(password: string) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

function SignIn() {
  const { t } = useTranslation('pages/SignIn');

  const navigate = useNavigate();
  const token = Cookies.get('DITokens');
  if (token) navigate('/');

  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisbility, setPasswordVisbility] = useState(false);

  const [wrongEmailInput, setWrongEmailInput] = useState(false);
  const [emailField, setEmailField] = useState('');

  const [wrongPasswordInput, setWrongPasswordInput] = useState(false);
  const [passwordField, setPasswordField] = useState('');

  const [searchParams] = useSearchParams();
  const [error, setError] = useState(searchParams.get('error')?.trim());
  console.log(error, typeof error);

  const refs = {
    emailRef: useRef<HTMLInputElement>(null),
    passwordRef: useRef<HTMLInputElement>(null),
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSignIn = async () => {
    if (refs.emailRef.current?.value === '') {
      setEmailField(t('Mandatory field'));
      setWrongEmailInput(true);
    } else if (!emailRegex.test(refs.emailRef.current?.value || '')) {
      setEmailField(t('Wrong format'));
      setWrongEmailInput(true);
    } else {
      setWrongEmailInput(false);
    }

    if (!isValidPassword(refs.passwordRef.current?.value || '')) {
      setPasswordField(t('Password must be 8+ chars with upper, lower, number & symbol.'));
      setWrongPasswordInput(true);
    } else setWrongPasswordInput(false);

    if (!wrongEmailInput && !wrongPasswordInput) {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_BE_URI}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gmail: refs.emailRef.current?.value,
            password: refs.passwordRef.current?.value,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.log('Error Response:', errorData);

          if (errorData.message === 'Gmail has been used.') {
            setEmailField(t('Gmail has been used.'));
            setWrongEmailInput(true);
            return;
          } else if (errorData.message === "Account isn't active yet.") {
            setEmailField(t(`Account isn't active yet.`));
            setWrongEmailInput(true);
            return;
          } else if (errorData.message === 'This is a google login account.') {
            setError('gmail-account');
          }
          throw new Error(errorData.message || 'Invalid credentials');
        }

        const responseData = await res.json();
        console.log('Response: ', responseData);
        if (responseData.message === 'Success') {
          Cookies.set('DITokens', responseData.data.access_token, { expires: 10 });
          navigate('/');
        }
      } catch (error) {
        console.error('Post subject error:', error);
        return;
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSignIn();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('form')}>
        <div className={cx('form-header')}>
          <img className={cx('header-logo')} src={logo} alt="Logo" />
          <h1 className={cx('sign-header')}>{t('Sign In')}</h1>
        </div>

        <a
          href={`${process.env.REACT_APP_BE_URI}/auth/google/callback`}
          rel="noopener noreferrer"
          className={cx('google-button')}
        >
          <img
            className={cx('google-img')}
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google Logo"
          />
          <h1 className={cx('google-text')}>{t('Continue with Google')}</h1>
        </a>

        <div className={cx('separator')}>
          <span className={cx('line')}></span>
          <span className={cx('or-text')}>{t('or')}</span>
          <span className={cx('line')}></span>
        </div>

        {error === 'default-account' && (
          <div className={cx('error-text')}>
            <span>
              {t(
                'This email address is currently being used with email & password. Please sign in with email & password',
              )}
            </span>
          </div>
        )}

        {error === 'gmail-account' && (
          <div className={cx('error-text')}>
            <span>
              {t('This email address is associated with a Google account. Please sign in using Google Sign-In.')}
            </span>
          </div>
        )}

        <div className={cx('container')}>
          <div className={cx('describe')}>
            <h1 className={cx('text')}>Email</h1>
            <h1 className={cx('symbol')}>*</h1>
          </div>
          <input
            ref={refs.emailRef}
            placeholder="Input email address"
            className={cx('input', { 'input-error': wrongEmailInput })}
          ></input>
          <h2 className={cx('error', { show: wrongEmailInput })}>{emailField}</h2>
        </div>

        <div className={cx('container')}>
          <div className={cx('describe')}>
            <h1 className={cx('text')}>{t('Password')}</h1>
            <h1 className={cx('symbol')}>*</h1>
          </div>
          <div className={cx('input', { 'input-error': wrongEmailInput })}>
            <input
              ref={refs.passwordRef}
              placeholder="Input password"
              className={cx('input-password')}
              type={passwordVisbility ? 'text' : 'password'}
            />
            <FontAwesomeIcon
              className={cx('toggle-visbility')}
              icon={passwordVisbility ? faEye : faEyeSlash}
              onClick={() => {
                setPasswordVisbility(!passwordVisbility);
              }}
            />
          </div>
          <h2 className={cx('error', { show: wrongPasswordInput })}>{passwordField}</h2>
        </div>

        <div className={cx('sign-button')} onClick={async () => await handleSignIn()}>
          {t('Sign In')}
        </div>

        <div className={cx('form-footer')}>
          <h2 className={cx('describe')}>{t('Do not have an account?')}</h2>
          <h1 className={cx('button')} onClick={() => navigate('/auth/signup')}>
            {t('Sign Up')}
          </h1>
        </div>
      </div>

      {isLoading && (
        <div className={cx('loading-overlay')}>
          <div className={cx('spinner')}></div>
          <p>{t('Loading')}...</p>
        </div>
      )}
    </div>
  );
}

export default SignIn;
