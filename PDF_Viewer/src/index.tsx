import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import GlobalStyles from './components/GlobalStyles';
import './i18n';

// Tạo root element
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  // <React.StrictMode>
  <GlobalStyles>
    <App />
  </GlobalStyles>,
  // {/* </React.StrictMode> */}
);

reportWebVitals();
