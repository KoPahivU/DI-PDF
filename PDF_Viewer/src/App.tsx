import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { privateRoutes, publicRoutes } from './routes';
import NotFoundLayout from './layout/NotFoundLayout';
import DashBoardLayout from './layout/DashBoardLayout';

import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface LayoutProps {
  children: React.ReactNode;
}

interface RouteType {
  path: string;
  Component: React.ComponentType;
  layout?: React.ComponentType<LayoutProps>;
}

function App() {
  const renderRoute = (route: RouteType) => {
    const Page = route.Component;
    const Layout = route.layout || DashBoardLayout;

    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <Layout>
            <Page />
          </Layout>
        }
      />
    );
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {publicRoutes.map(renderRoute)}
          {privateRoutes.map(renderRoute)}

          <Route path="*" element={<NotFoundLayout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
