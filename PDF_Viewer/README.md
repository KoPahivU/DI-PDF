# 🌐 Frontend - DI-PDF Application

This is the frontend for the **Lumin 2025 PDF collaboration platform**, built with **React + TypeScript**.

---

## ⚙️ Getting Started

### 1️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 2️⃣ Start Development Server

```bash
npm start
# or
yarn start
```

By default, the app will be available at:
👉 http://localhost:3000

### 📦 Environment Variables

This project uses environment variables stored in a .env file.

A template is provided:
📄 [`./.env.example`](./.env.example)
Then update the values accordingly.

### 🧾 Environment Variables Description

| Variable Name                                            | Description                                                                                                                            |
| :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `REACT_APP_FE_URI`                                       | Based on the port number you define (Default is usually http://localhost:3000)                                                         |
| `REACT_APP_BE_URI`                                       | Based on the port number you define with /api after (Default is usually http://localhost:8081/api)                                     |
| `REACT_APP_SOCKET_URI`                                   | Same as above but without `/api`                                                                                                         |
| `REACT_APP_GOOGLE_CLIENT_ID`, `REACT_APP_GOOGLE_API_KEY` | Visit [Google Console](https://developers.google.com/identity/sign-in/web/sign-in) for instructions on getting the internal variables. |
| `REACT_APP_LICENSE_KEY`                                  | Visit [Apryse](https://docs.apryse.com/web/guides/get-started/react) and initialize LICENSE_KEY demo and insert it                     |
