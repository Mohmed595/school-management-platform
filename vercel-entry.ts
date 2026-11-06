import type { IncomingMessage, ServerResponse } from 'node:http';
import { getApp } from './server';

/**
 * Entry point that gets bundled by `npm run build:vercel-api` into
 * api/index.js (plain CommonJS) before Vercel packages the function.
 *
 * Vercel's function builder does not bundle TypeScript files imported from
 * outside the api/ directory, so the server is pre-bundled instead.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
