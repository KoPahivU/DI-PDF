import { ComponentType, ReactNode } from 'react';
import AuthLayout from '../layout/AuthLayout';
import DashBoardLayout from '../layout/DashBoardLayout';
import EmptyLayout from '../layout/EmptyLayout';
import Active from '../pages/Active';
import DashBoard from '../pages/DashBoard';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import PdfViewer from '../pages/PdfViewer';
import { Test } from '~/pages/Test';

type LayoutType = ComponentType<{ children: ReactNode }>;

// Định nghĩa kiểu Route
interface RouteType {
  path: string;
  Component: React.ComponentType;
  layout: LayoutType;
}

const publicRoutes: RouteType[] = [
  { path: '/', Component: DashBoard, layout: DashBoardLayout },
  { path: '/auth/signin', Component: SignIn, layout: AuthLayout },
  { path: '/auth/signup', Component: SignUp, layout: AuthLayout },
  { path: '/auth/activate', Component: Active, layout: EmptyLayout },
  { path: '/file/:id', Component: PdfViewer, layout: DashBoardLayout },
  { path: '/test', Component: Test, layout: DashBoardLayout },
];

const privateRoutes: RouteType[] = [];

export { publicRoutes, privateRoutes };
