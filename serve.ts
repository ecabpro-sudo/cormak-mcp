import { publicDiscovery } from './supabase/functions/mcp/discovery.ts';

Deno.serve({ hostname: '127.0.0.1', port: 8765 }, async req => {
  if (new URL(req.url).pathname !== '/mcp') return new Response(null, { status: 404 });
  if (req.headers.has('Origin')) return new Response(null, { status: 403 });
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const unauthorized = () => Response.json({ error: 'tool_execution_requires_cormak_oauth' }, {
    status: 401, headers: { 'Cache-Control': 'no-store',
      'WWW-Authenticate': 'Bearer resource_metadata="https://mcp.cormak.app/mcp/oauth-protected-resource"' },
  });
  if (req.headers.has('Authorization')) return unauthorized();
  return await publicDiscovery(req, unauthorized);
});
