import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Same-origin requests (the site and API share an origin, including behind the
// Replit proxy) need no CORS headers. Cross-origin access is denied unless the
// origin is listed in ALLOWED_ORIGINS (comma-separated), or it is a localhost
// origin while NOT running in production.
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, "").toLowerCase())
    .filter(Boolean),
);
const isLocalOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, false);
      const normalised = origin.replace(/\/+$/, "").toLowerCase();
      const allowed =
        allowedOrigins.has(normalised) ||
        (process.env.NODE_ENV !== "production" && isLocalOrigin(normalised));
      callback(null, allowed);
    },
    allowedHeaders: ["Content-Type", "X-Admin-Key", "X-Object-Path"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
