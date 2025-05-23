import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import type { Request } from 'express';

module.exports = function (app: any) {
  app.use(
    '/',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      selfHandleResponse: true, // bắt buộc nếu muốn can thiệp response
      on: {
        proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req: Request, res) => {
          // Thêm header tại đây
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          return responseBuffer;
        }),
      },
    }),
  );
};
