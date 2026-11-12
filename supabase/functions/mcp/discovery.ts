import { createMcpHandler, fromJsonSchema, McpServer } from 'npm:@modelcontextprotocol/server@2.3.1';
import { readLimitedJsonBody, RequestBodyTooLargeError } from '../_shared/request-body.ts';
import { PUBLIC_TOOLS } from './public-catalog.ts';

const ALLOWED_METHODS = new Set(['initialize', 'notifications/initialized', 'ping', 'tools/list']);

// No DB client, token, grant or tool implementation enters this handler.
const discovery = createMcpHandler(() => {
  const server = new McpServer({ name: 'Cormak AI', version: '1.4.0' }, {
    instructions: 'This is a public preview of Cormak.app tools. Sign in through Cormak OAuth to run tools and see the catalog for your granted permissions.',
  });
  for (const { name, description, inputSchema, annotations } of PUBLIC_TOOLS) {
    server.registerTool(name, { description, inputSchema: fromJsonSchema(inputSchema), annotations }, () => {
      throw new Error('oauth_required');
    });
  }
  return server;
}, { legacy: 'stateless' });

export async function publicDiscovery(req: Request, unauthorized: () => Response): Promise<Response> {
  let body: unknown;
  try {
    body = await readLimitedJsonBody(req, 64_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: 'request_too_large' }, { status: 413, headers: { 'Cache-Control': 'no-store' } });
    }
    return unauthorized();
  }
  // A single message only. In particular, no mixed batches, tool calls,
  // resources or user data can go through the public transport.
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
    !('method' in body) || typeof body.method !== 'string' || !ALLOWED_METHODS.has(body.method)) {
    return unauthorized();
  }
  const response = await discovery.fetch(req, { parsedBody: body });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
