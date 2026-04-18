import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import authRoutes from "./routes/authRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import adminServiceRouter from "./routes/adminServiceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import marketingRoutes from "./routes/marketingRoutes.js";
import { sendResponse } from "./utils/http.js";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

if (env.enableBackendLogs) {
  app.use(morgan("dev"));
}

app.get("/api/health", (_req, res) =>
  sendResponse(res, 200, true, "CampusConnect API is running.", {}),
);

app.use("/api/auth", authRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin/services", adminServiceRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/marketing", marketingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
