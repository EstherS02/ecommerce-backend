import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/db.js";
import productRoutes from './routes/productRoutes.js'
import authRoutes from './routes/authRoutes.js';
import cartRoute from './routes/cartRoutes.js';
import orderRoute from './routes/orderRoute.js'

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoute);
app.use("/api/orders", orderRoute);

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Server is running"
    })
})

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log("Deployed again")
        console.log(`Server is up on port ${PORT}`);
    });
}

startServer();