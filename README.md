# 📘 Lumin 2025 - Internship Program

This is the source code for an application to **view and interact with PDF files**, supporting real-time collaboration, annotations, and more.

---

## 📁 Project Structure

This repository includes both **frontend** and **backend** projects. Please refer to each part for specific setup instructions.

- [`/PDF_Viewer`](./PDF_Viewer/README.md) — React-based web application
- [`/PDF_Viewer_Backend`](./PDF_Viewer_Backend/README.md) — NestJS-based API server

✅ **Be sure to follow the README in each folder to correctly set up the `.env` configuration files.**

---

## 🐳 Quick Setup: Redis & RabbitMQ with Docker

- **Run Redis**

```bash
docker run -d --name lumin-redis -p 6379:6379 redis
```

- **Run RabbitMQ**

```bash
docker run -d --hostname lumin-rabbitmq --name lumin-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

---

## 🚀 Basic Features

- 🔐 **Authentication & Authorization**

  - Login via Email & Password, or Google OAuth

- 📂 **Document Management**

  - Upload from local machine
  - View list of available documents

- 🛡 **Document Permissions**

  - Guest / View-only / Edit modes

- 👁 **View & Download**

  - View PDFs online
  - Download files

- ✏️ **Annotation Tools**
  - Shapes and Free-text annotations

---

## ⚙️ Advanced Features

- 👥 **Real-time Collaboration**

  - Multi-user document editing

- ☁️ **3rd-party Upload**

  - Import documents from Google Drive

- 🚀 **Performance Optimization**

  - Document caching

- ✍️ **Integration with [Lumin Sign API](https://developers.luminpdf.com/docs/api/intro/)**

  - E-signatures

- 🌐 **Multilingual Support**

  - English 🇺🇸 / Vietnamese 🇻🇳

- 📧 **Sharing & Collaboration**
  - Share via email or public/private links
  - Control view/edit access

---

Feel free to contribute or open issues. Thanks for checking out the project! 💡
