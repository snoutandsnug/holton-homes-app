# Ollama Setup — Holton Studio

Verified against official Ollama docs 2026-08-19.

## What Ollama does

Ollama is only the local model server. The CRM does not depend on it. On Windows, the normal Ollama app runs in the background and serves its API at:

`http://localhost:11434`

Official Windows docs:
- https://docs.ollama.com/windows

## First model

Start with a model small enough to test before deciding on something larger:

`ollama pull qwen3:8b`

The current Ollama library lists Qwen3 8B at roughly 5.2 GB model storage with a 40K context window. Actual speed depends heavily on your PC hardware.

- https://ollama.com/library/qwen3

## Studio behavior

Studio calls:
- `GET /api/tags` to discover installed models
- `POST /api/chat` to generate a response

Official API docs:
- https://docs.ollama.com/api/tags
- https://docs.ollama.com/api/chat

Studio defaults `keep_alive` to `0`. Ollama documents that `keep_alive: 0` unloads the model immediately after the response, which is useful when you do not want the model sitting in RAM/VRAM.

- https://docs.ollama.com/faq

## Vercel browser origin

A Vercel-hosted page is a different web origin from localhost. Ollama allows additional browser origins through `OLLAMA_ORIGINS`.

Use the exact preview URL while testing. Later use the exact production origin.

You can run `CONFIGURE_OLLAMA_ORIGIN.bat` in the package and paste the exact origin. Then **quit and restart Ollama**.

Official FAQ:
- https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama

Do not use a broad wildcard unless you have a very specific reason. Do not change `OLLAMA_HOST` to expose `11434` to the public internet just to make the CRM work.

## Streaming

When streaming:
1. quit Ollama from its Windows tray/taskbar app
2. Holton CRM remains usable
3. Studio deterministic features (scores/CMA math) remain usable
4. AI generation reports offline
5. restart Ollama when you want local AI again

## If it does not connect

Check in this order:
1. Is Ollama actually running?
2. Does `http://localhost:11434/api/tags` work locally?
3. Is a model installed?
4. Is the exact Vercel origin in `OLLAMA_ORIGINS`?
5. Did you quit/restart Ollama after changing the environment variable?
6. Is the browser showing a CORS/network error?

Do not “solve” the problem by opening Ollama to the public internet.
