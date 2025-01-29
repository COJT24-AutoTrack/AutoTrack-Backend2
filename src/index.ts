import { Hono } from "hono";
import { verifyFirebaseAuth } from "@hono/firebase-auth";

export interface Bindings {
  DB: D1Database;
  FIREBASE_PROJECT_ID: string;
  PUBLIC_JWK_CACHE_KEY: string;
  PUBLIC_JWK_CACHE_KV: KVNamespace;
}

const app = new Hono<{ Bindings: Bindings }>()
  .use("*", async (c, next) => {
    const projectId = c.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      return c.json(
        {
          code: "config/missing-project-id",
          message: "Firebase project ID is missing.",
        },
        500
      );
    }
    return verifyFirebaseAuth({ projectId })(c, next);
  })
  .get("/", (c) => {
    return c.text("Hello Hono!");
  });

export default app;
