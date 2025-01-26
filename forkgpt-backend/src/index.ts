import dotenv from "dotenv";
dotenv.config(); // Should happen before any file is imported and possibly runs code.
import express from "express";
import cors from "cors";
import { EventBus } from "safe-event";
import { initMessageApi } from "./domains/message/message.api";
import { initTopicApi } from "./domains/topic/topic.api";
import { Supabase } from "../supabase/supabase";
import { initUserMiddleware } from "./domains/user/user.middleware";
import { initThreadApi } from "./domains/thread/thread.api";
import { LlmService } from "./domains/llm/llm.service";

// Initialize core services
Supabase.init();
EventBus.init();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, _, next) => {
  console.log(req.path);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

function initAllApi(app: express.Application) {
  LlmService.init();
  initUserMiddleware(app);
  initMessageApi(app);
  initTopicApi(app);
  initThreadApi(app);
}

initAllApi(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
