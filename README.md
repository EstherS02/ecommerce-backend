# 🛒 Ecommerce Backend API

A RESTful Ecommerce Backend built with **Node.js**, **Express.js**, **MongoDB**, and **Docker**.

## 🚀 Features

- User Authentication (JWT)
- Product Management
- Shopping Cart
- Order Management
- Password Encryption (bcrypt)
- Input Validation (Zod)
- Image Uploads to AWS S3
- Docker Support
- Nginx Reverse Proxy

---

## 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- Zod
- AWS S3
- Docker
- Docker Compose
- Nginx

---

## 📁 Project Structure

```
.
├── controllers/
├── middleware/
├── models/
├── routes/
├── validators/
├── nginx/
│   └── default.conf
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file using `.env.example`.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

---

## 🐳 Running with Docker

### Build and start

```bash
docker compose up --build -d
```

### Stop

```bash
docker compose down
```

### View logs

```bash
docker compose logs -f
```

---

## 💻 Running without Docker

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run dev
```

Start production server

```bash
npm start
```

---

## 🌐 API Base URL

```
http://localhost
```

When deployed:

```
http://<EC2_PUBLIC_IP>
```

---

## 📦 Deployment

This project is containerized using Docker and can be deployed to:

- AWS EC2
- Docker Compose
- Amazon ECS (future)
- Kubernetes (future)

---

## 👨‍💻 Author

Esther S