import './GlobalStyles.scss';

interface GlobalStylesProps {
  children: React.ReactNode;
}

const GlobalStyles: React.FC<GlobalStylesProps> = ({ children }) => {
  return <>{children}</>;
};

export default GlobalStyles;
