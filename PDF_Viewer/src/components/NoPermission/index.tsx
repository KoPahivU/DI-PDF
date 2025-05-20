import { useNavigate } from 'react-router-dom';
import noPermission from '~/assets/images/no-permission.jpg';

export function NoPermission() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
      <img style={{ height: '245px', width: '245px' }} src={noPermission} />
      <div>
        <h1>Oops,</h1>
        <h2 style={{ fontWeight: '400' }}>You don't have permission to access this file.</h2>
        <button
          style={{
            padding: '20px 30px',
            backgroundColor: '#f5c731',
            fontSize: '2.3rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: 'white',
            textAlign: 'center',
            borderRadius: '15px',
            marginTop: '20px',
          }}
          onClick={() => navigate('/')}
        >
          Go to DashBoard
        </button>
      </div>
    </div>
  );
}
