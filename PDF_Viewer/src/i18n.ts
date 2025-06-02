// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: [
      'components/AdminItem',
      'components/DocsEmpty',
      'components/DropDown/RequireHigherPermission',
      'components/DropDown/Shape',
      'components/DropDown/Text',
      'compornents/GuestDashboard',
      'compornents/Header',
      'compornents/NoPermission',
      'compornents/PermissionBox',
      'compornents/Popup/OnSave',
      'compornents/Popup/PermissionError',
      'compornents/Popup/PermissionOnProcess',
      'compornents/Popup/PermissionSuccess',
      'compornents/Popup/ShapePop',
      'compornents/Popup/TextPop',
      'compornents/Popup/UploadProcess',
      'compornents/Popup/UploadSucess',
      'compornents/Popup/UploadWarning',
      'compornents/UserItem',
      'layout/NotFoundLayout',
      'pages/DashBoard',
      'pages/PdfViewer',
      'pages/SignIn',
      'pages/SignUp',
    ],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
