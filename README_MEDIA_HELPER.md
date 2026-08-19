# Optional Holton Clip Cutter

`HoltonClipCutter.pyw` is deliberately separate from the CRM.

Why:
- huge video files should stay local
- the CRM should work whether media tooling exists or not
- FFmpeg is free and deterministic
- `.pyw` + `CREATE_NO_WINDOW` prevents a separate FFmpeg Command Prompt window from popping up for every cut on Windows

## Use
1. Install FFmpeg and make sure `ffmpeg` is on PATH.
2. Double-click `HoltonClipCutter.pyw` (Python for Windows required).
3. Select the source video.
4. Paste ranges from Studio → Clip Finder, one per line:
   `00:01:12,00:01:48,Why this matters`
5. Click **Cut Clips**.

This helper does not upload the video and does not connect to the CRM database.
