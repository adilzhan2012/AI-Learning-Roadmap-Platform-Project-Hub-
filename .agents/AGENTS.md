# Rules for AI Agent

## Using Context7 for Documentation
Before researching, analyzing, or writing code involving external libraries, APIs, or frameworks (such as React, Firebase, Supabase, etc.), the agent MUST query the Context7 MCP server to get the latest, version-specific documentation and code examples:
1. Use `resolve-library-id` to find the correct library ID (e.g., `/vercel/next.js`, `/firebase/firebase-js-sdk`).
2. Use `query-docs` or `get-library-docs` to retrieve the relevant API signatures, code examples, and best practices.
3. Do not rely on pre-trained knowledge for fast-changing APIs; always check Context7 first.
