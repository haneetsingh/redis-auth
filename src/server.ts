import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.routes"
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware";

dotenv.config();
const app = express();
const PORT = process.env.PORT ?? 8080;

app.disable("x-powered-by");
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Index route
app.get('/', (_req, res) => {
  res.sendFile(path.join(path.resolve('./'), 'public/index.html'));
});

// Auth routes
app.use("/v1/auth", authRoutes);

// Global error handler
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(`Auth API listening on http://localhost:${PORT}`);
});
