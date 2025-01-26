import { Application, Request, Response, NextFunction } from "express";
import { Supabase } from "../../../supabase/supabase";
import { User } from "@supabase/supabase-js";

export function initUserMiddleware(app: Application) {
  // Add middleware
  app.use(async (req, res, next) => {
    await authMiddleware(req, res, next);
  });
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const {
      data: { user },
      error,
    } = await Supabase.client.auth.getUser(token);
    if (error || !user) {
      throw error || new Error("Invalid token");
    }
    req.user = { ...user, accessToken: token };
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Update the type definition for the user property in Request
declare global {
  namespace Express {
    interface Request {
      user: User & { accessToken: string };
    }
  }
}
