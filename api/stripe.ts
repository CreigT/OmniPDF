import type { IncomingMessage, ServerResponse } from 'http';
import handler from './[...slug]';

export default async function stripeApiHandler(
  req: IncomingMessage & { url?: string; method?: string; query?: any },
  res: ServerResponse
) {
  return handler(req, res);
}
