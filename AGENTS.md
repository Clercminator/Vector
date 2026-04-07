<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project Execution Rules

- Think before acting. Read existing files before writing code.
- Keep solutions efficient and direct over complicated and redundant. Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not stop after editing code. Before finishing any code change, run the relevant validation needed to keep the repo deployable. Test your code before declaring done.
- For changes that can affect production compilation, run `pnpm build` and fix resulting errors before concluding the task.
- For smaller isolated changes, run the narrowest relevant test or lint step first, but if there is any doubt about deployability, fall back to `pnpm build`.
- For visual or interaction bugs, reproduce and inspect the issue with available browser tooling such as Chrome DevTools MCP or Playwright/browser MCP instead of relying only on static code reading.
- After a UI change, verify the exact affected flow in the browser, then check closely related states or breakpoints when relevant before concluding the task.
- If the browser tooling is unavailable or blocked, say so explicitly and do not present the UI fix as fully verified.
- Do not claim a task is complete while known build errors, type errors, or directly related regressions remain.


<!-- END:nextjs-agent-rules -->
