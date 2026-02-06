//security middleware called before each request
import { ArcjetNodeRequest, slidingWindow } from "@arcjet/node";
import { NextFunction, Request, Response } from "express";
import aj from "../config/arcjet";

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === "test") return next();
  try {
    //define user role
    const role: RateLimitRole = req.user?.role ?? "guest";

    //request limits fo the various roles
    let limit: number;
    let message: string;
    switch (role) {
      case "admin":
        limit = 20;
        message =
          "Admin rate limit exceeded. Please try again later(20 per minute).";
        break;
      case "teacher":
      case "student":
        limit = 10;
        message =
          "User rate limit exceeded. Please try again later(10 per minute).";
        break;
      default:
        limit = 5;
        message =
          "Guest rate limit exceeded. Please signup for higher limits).";
    }
    //creating a new arcjet client
    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m", // 1 minute
        max: limit, //defined limit based on user role
      }),
    );

    //intercepting the request(arcjet request)
    const arcjetRequest: ArcjetNodeRequest = {
      headers: req.headers,
      method: req.method,
      url: req.originalUrl,
      socket: {
        remoteAddress: req.socket.remoteAddress ?? req.ip ?? "0.0.0.0",
      }, //defining the ip address for rate limiting
    };
    //processing the request through arcjet or making a decison
    const decision = await client.protect(arcjetRequest);
    if (decision.isDenied() && decision.reason.isBot()) {
      return res
        .status(403)
        .json({
          error: "Forbidden",
          message: "Automated requests are not allowed.",
        });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      return res
        .status(403)
        .json({
          error: "Forbidden",
          message: "Request blocked by security policy.",
        });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      return res
        .status(429)
        .json({ error: "Too many requests. Please try again later.", message });
    }
    next();
  } catch (e) {
    console.error("Arcjet middleware error:", e);
    res
      .status(500)
      .json({
        error: "Internal Server Error",
        message: "Something went wrong with security middleware",
      });
  }
};
export default securityMiddleware;
