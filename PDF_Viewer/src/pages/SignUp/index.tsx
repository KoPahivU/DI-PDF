import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSquareCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faSquare } from '@fortawesome/free-regular-svg-icons';
import { useEffect, useRef, useState } from 'react';
import logo from '~/assets/images/logo.png';
import email from '~/assets/svg/email.svg';
import { useNavigate } from 'react-router-dom';
import styles from './SignUp.module.scss';
import classNames from 'classnames/bind';
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

function SignUp() {
  const { t } = useTranslation('pages/SignUp');

  const navigate = useNavigate();
  const token = Cookies.get('DITokens');
  if (token) navigate('/');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const refs = {
    email: useRef<HTMLInputElement>(null),
    fullName: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    reTypePassword: useRef<HTMLInputElement>(null),
  };

  const [wrongFullNameInput, setWrongFullNameInput] = useState(false);
  const [fullNameField, setFullNameField] = useState('');

  const [wrongEmailInput, setWrongEmailInput] = useState(false);
  const [emailField, setEmailField] = useState('');

  const [wrongPasswordInput, setWrongPasswordInput] = useState(false);
  const [passwordField, setPasswordField] = useState('');

  const [wrongReTypePasswordInput, setWrongReTypePasswordInput] = useState(false);
  const [reTypePasswordField, setReTypePasswordField] = useState('');

  const [passwordVisbility, setPasswordVisbility] = useState(false);
  const [reTypePasswordVisbility, setReTypePasswordVisbility] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const [acceptStatus, setAcceptStatus] = useState(false);

  const handleSignUp = async () => {
    if (refs.email.current?.value === '') {
      setEmailField(t('Mandatory field'));
      setWrongEmailInput(true);
    } else if (!emailRegex.test(refs.email.current?.value || '')) {
      setEmailField(t('Wrong format'));
      setWrongEmailInput(true);
    } else {
      setWrongEmailInput(false);
    }

    if (refs.fullName.current?.value === '') {
      setFullNameField(t('Mandatory field'));
      setWrongFullNameInput(true);
    } else setWrongFullNameInput(false);

    if (!isValidPassword(refs.password.current?.value || '')) {
      setPasswordField(t('Password must be 8+ chars with upper, lower, number & symbol.'));
      setWrongPasswordInput(true);
    } else setWrongPasswordInput(false);

    if (refs.reTypePassword.current?.value !== refs.password.current?.value) {
      setReTypePasswordField(t('Passwords do not match'));
      setWrongReTypePasswordInput(true);
    } else setWrongReTypePasswordInput(false);

    if (!wrongEmailInput && !wrongFullNameInput && !wrongPasswordInput && !wrongReTypePasswordInput) {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_BE_URI}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: refs.fullName.current?.value,
            gmail: refs.email.current?.value,
            password: refs.password.current?.value,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.log('Error Response:', errorData);

          if (errorData.message === 'Gmail has been used.') {
            setEmailField(t('Gmail has been used.'));
            setWrongEmailInput(true);
            return;
          }
          throw new Error(errorData.message || 'Invalid credentials');
        }

        const responseData = await res.json();
        console.log('Response: ', responseData);
        if (responseData.message === 'Success') {
          setSuccessPopup(true);
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
        if (acceptStatus) handleSignUp();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleResendGmail = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/auth/send-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: refs.fullName.current?.value,
          gmail: refs.email.current?.value,
          password: refs.password.current?.value,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response: ', responseData);
      if (responseData.message === 'Success') {
        setSuccessPopup(true);
      }
    } catch (error) {
      console.error('Post subject error:', error);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('form')}>
        <div className={cx('form-header')}>
          <img className={cx('header-logo')} src={logo} alt="Logo" />
          <h1 className={cx('sign-header')}>{t('Sign Up')}</h1>
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

        {/* {error === 'gmail-account' && (
          <div className={cx('error-text')}>
            <span>This email address is associated with a Google account. Please sign in using Google Sign-In.</span>
          </div>
        )} */}

        <div className={cx('container')}>
          <div className={cx('describe')}>
            <h1 className={cx('text')}>{t('Full name')}</h1>
            <h1 className={cx('symbol')}>*</h1>
          </div>
          <input
            ref={refs.fullName}
            placeholder="Input full name"
            className={cx('input', { 'input-error': wrongFullNameInput })}
          ></input>
          <h2 className={cx('error', { show: wrongFullNameInput })}>{fullNameField}</h2>
        </div>

        <div className={cx('container')}>
          <div className={cx('describe')}>
            <h1 className={cx('text')}>Email</h1>
            <h1 className={cx('symbol')}>*</h1>
          </div>
          <input
            ref={refs.email}
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
          <div className={cx('input', { 'input-error': wrongPasswordInput })}>
            <input
              ref={refs.password}
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

        <div className={cx('container')}>
          <div className={cx('describe')}>
            <h1 className={cx('text')}>{t('Re-confirm Password')}</h1>
            <h1 className={cx('symbol')}>*</h1>
          </div>
          <div className={cx('input', { 'input-error': wrongReTypePasswordInput })}>
            <input
              ref={refs.reTypePassword}
              placeholder={t('Re-confirm Password')}
              className={cx('input-password')}
              type={reTypePasswordVisbility ? 'text' : 'password'}
            />
            <FontAwesomeIcon
              className={cx('toggle-visbility')}
              icon={reTypePasswordVisbility ? faEye : faEyeSlash}
              onClick={() => {
                setReTypePasswordVisbility(!reTypePasswordVisbility);
              }}
            />
          </div>
          <h2 className={cx('error', { show: wrongReTypePasswordInput })}>{reTypePasswordField}</h2>
        </div>

        <div className={cx('accept-box')} onClick={() => setAcceptStatus(!acceptStatus)}>
          <FontAwesomeIcon icon={acceptStatus ? faSquareCheck : faSquare} className={cx('checkbox')} />
          <span>
            {t('I accept all')}
            <strong className={cx('bold')}>{t('Terms of Service')}</strong>
            {t('and')}
            <strong className={cx('bold')}>{t('Privacy Policy')}</strong>
          </span>
        </div>

        <div
          className={cx('sign-button', { disable: !acceptStatus })}
          onClick={async () => {
            if (acceptStatus) await handleSignUp();
          }}
        >
          {t('Sign Up')}
        </div>

        <div className={cx('form-footer')}>
          <h2 className={cx('describe')}>{t('Already have an account?')}</h2>
          <h1 className={cx('button')} onClick={() => navigate('/auth/signin')}>
            {t('Sign In')}
          </h1>
        </div>
      </div>

      {isLoading && (
        <div className={cx('loading-overlay')}>
          <div className={cx('spinner')}></div>
          <p>{t('Loading')}...</p>
        </div>
      )}

      {successPopup && (
        <div className={cx('overlay')}>
          <div className={cx('success-popup')}>
            <FontAwesomeIcon icon={faXmark} className={cx('exit')} onClick={() => setSuccessPopup(false)} />
            <img className={cx('image')} src={email} alt="pic" />
            <h2>{t('Verify your email address')}</h2>

            <div className={cx('email-text')}>
              <p>
                {t('We’ve just sent a verification email to')} <strong>{refs?.email?.current?.value}</strong>.{' '}
                {t('Please check your inbox')}.
              </p>
            </div>
            <div className={cx('resend')}>
              <p>{t(`Didn't receive an email?`)} </p>
              <strong
                className={cx('link')}
                onClick={() => {
                  handleResendGmail();
                }}
              >
                {t('Resend verification link.')}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignUp;
