import type { IncomingMessage, ServerResponse } from 'node:http';
import { getApp } from '../server.ts';

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

let app: RequestHandler | null = null;

/**
 * Vercel serverless entry point.
 *
 * All /api/* requests are rewritten to this function (see vercel.json) and then
 * handed to the same Express app used by `npm run dev` / `npm start`, so the API
 * behaves identically on Vercel and on a long-running container host.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!app) {
    app = (await getApp()) as unknown as RequestHandler;
  }
  app(req, res);
}
