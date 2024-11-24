import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Netmask } from "netmask"; // For PayFast IP range validation
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import User from "./models/userModel.js";
import Company from "./models/companyModel.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8003;
const MONGOURL = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// CORS configuration
app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
mongoose
    .connect(MONGOURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Database connected");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => console.error("Database connection error:", error));

// Use external routes
app.use("/auth", authRoutes);
app.use("/payments", paymentRoutes);

// Catch-all for undefined routes
app.use((req, res) => res.status(404).send("Route not found"));

export default app;
