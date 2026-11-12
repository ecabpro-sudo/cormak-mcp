# Cormak.app MCP — public discovery source

This repository contains the public discovery component deployed at
https://mcp.cormak.app/mcp and its catalog of selected tool schemas. It implements
Streamable HTTP discovery with the official MCP SDK. The commercial service,
account storage and authenticated tool implementations are not part of this
repository.

Connect an MCP client with OAuth support to the production endpoint to run tools.
Cormak displays the requested permissions before granting access. The tools a
signed-in client sees depend on that grant. To browse the live catalog without
signing in, see [mcptry](https://mcptry.com/servers/app.cormak/mcp-server).

To run the discovery component on your own machine with Deno:

```sh
deno run --no-lock --node-modules-dir=none --allow-net=127.0.0.1:8765 serve.ts
```

Connect your MCP client to `http://127.0.0.1:8765/mcp` to initialize, list tools
and ping. This local example cannot sign users in or execute any tools.
