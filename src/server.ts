import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import couponRoutes from "./routes/couponRoutes";
import settingsRoutes from "./routes/settingRoutes";
import cartRoutes from "./routes/cartRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import reviewRoutes from "./routes/reviewRoutes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

let corsOptions;
if (process.env.NODE_ENV === "production") {
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl) {
    corsOptions = {
      origin: clientUrl,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };
  } else {
    console.warn(
      "CLIENT_URL environment variable is not set in production. Please set it in your deployment platform settings."
    );
    corsOptions = {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };
  }
} else {
  corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

export const prisma = new PrismaClient();

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.send("Hello from E-Commerce backend");
});

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
});
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
