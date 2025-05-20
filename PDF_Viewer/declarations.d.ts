declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}
declare module '*.png' {
  const value: string;
  export default value;
}
declare module '*.jpg' {
  const value: string;
  export default value;
}
declare module '*.svg' {
  const value: string;
  export default value;
}
declare module 'js-cookie' {
  const Cookies: any;
  export default Cookies;
}
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
