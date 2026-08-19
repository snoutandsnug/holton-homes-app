"""Holton Clip Cutter — optional local helper.

Paste clip lines from Holton Studio Clip Finder:
  00:01:12,00:01:48,First-time buyer myth
  00:05:20,00:06:02,Why this road project matters

Requires FFmpeg on PATH. Uses CREATE_NO_WINDOW on Windows so ffmpeg does not
spawn a separate command window for each clip.
"""
from __future__ import annotations
import os, re, shutil, subprocess, threading
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0

def seconds(value: str) -> float:
    value = value.strip()
    if not value:
        raise ValueError("missing timestamp")
    parts = value.split(":")
    if len(parts) == 3:
        h, m, s = parts
    elif len(parts) == 2:
        h, m, s = "0", parts[0], parts[1]
    else:
        h, m, s = "0", "0", parts[0]
    return float(h) * 3600 + float(m) * 60 + float(s)

def safe_name(value: str, fallback: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]+', "-", value).strip().strip(".")
    name = re.sub(r"\s+", " ", name)
    return (name[:90] or fallback)

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Holton Clip Cutter")
        self.geometry("820x620")
        self.minsize(720, 520)
        self.video = tk.StringVar()
        self.output = tk.StringVar()
        self.status = tk.StringVar(value="Choose a video, paste timestamp ranges, then cut.")
        self._build()

    def _build(self):
        root = ttk.Frame(self, padding=16); root.pack(fill="both", expand=True)
        ttk.Label(root, text="HOLTON HOMES", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        ttk.Label(root, text="Clip Cutter", font=("Segoe UI", 22, "bold")).pack(anchor="w", pady=(2, 4))
        ttk.Label(root, text="Optional local helper. Studio finds the clips; this cuts them from the original file.").pack(anchor="w", pady=(0, 14))

        row = ttk.Frame(root); row.pack(fill="x", pady=4)
        ttk.Label(row, text="Video", width=10).pack(side="left")
        ttk.Entry(row, textvariable=self.video).pack(side="left", fill="x", expand=True, padx=6)
        ttk.Button(row, text="Choose…", command=self.pick_video).pack(side="left")
        row = ttk.Frame(root); row.pack(fill="x", pady=4)
        ttk.Label(row, text="Output", width=10).pack(side="left")
        ttk.Entry(row, textvariable=self.output).pack(side="left", fill="x", expand=True, padx=6)
        ttk.Button(row, text="Choose…", command=self.pick_output).pack(side="left")

        ttk.Label(root, text="One clip per line: START,END,TITLE", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(16, 4))
        self.text = tk.Text(root, height=15, wrap="none", font=("Consolas", 10))
        self.text.pack(fill="both", expand=True)
        self.text.insert("1.0", "00:01:12,00:01:48,Clip title here\n")

        opt = ttk.Frame(root); opt.pack(fill="x", pady=(10, 4))
        self.accurate = tk.BooleanVar(value=True)
        ttk.Checkbutton(opt, text="Accurate cuts (re-encode; recommended)", variable=self.accurate).pack(side="left")
        ttk.Button(opt, text="Cut Clips", command=self.start).pack(side="right")
        self.progress = ttk.Progressbar(root, mode="determinate"); self.progress.pack(fill="x", pady=(8, 4))
        ttk.Label(root, textvariable=self.status).pack(anchor="w")

    def pick_video(self):
        p = filedialog.askopenfilename(title="Choose source video", filetypes=[("Video files", "*.mp4 *.mov *.mkv *.m4v *.avi *.webm"), ("All files", "*.*")])
        if p:
            self.video.set(p)
            if not self.output.get(): self.output.set(str(Path(p).with_name(Path(p).stem + " - Holton Clips")))

    def pick_output(self):
        p = filedialog.askdirectory(title="Choose output folder")
        if p: self.output.set(p)

    def parse(self):
        clips = []
        for i, raw in enumerate(self.text.get("1.0", "end").splitlines(), 1):
            raw = raw.strip()
            if not raw or raw.startswith("#"): continue
            parts = [p.strip() for p in raw.split(",", 2)]
            if len(parts) < 2: raise ValueError(f"Line {i}: expected START,END,TITLE")
            start, end = seconds(parts[0]), seconds(parts[1])
            if end <= start: raise ValueError(f"Line {i}: end must be after start")
            title = parts[2] if len(parts) == 3 else f"Clip {len(clips)+1}"
            clips.append((start, end, title))
        if not clips: raise ValueError("No clip ranges found")
        return clips

    def start(self):
        if not shutil.which("ffmpeg"):
            messagebox.showerror("FFmpeg not found", "Install FFmpeg and make sure ffmpeg.exe is on PATH. The CRM does not need FFmpeg; only this optional clip helper does.")
            return
        src = Path(self.video.get().strip())
        if not src.exists(): return messagebox.showerror("Video missing", "Choose a valid source video.")
        try: clips = self.parse()
        except Exception as e: return messagebox.showerror("Clip list", str(e))
        out = Path(self.output.get().strip() or src.with_name(src.stem + " - Holton Clips")); out.mkdir(parents=True, exist_ok=True)
        self.progress["maximum"] = len(clips); self.progress["value"] = 0
        threading.Thread(target=self.run_cuts, args=(src, out, clips), daemon=True).start()

    def run_cuts(self, src: Path, out: Path, clips):
        failures = []
        for idx, (start, end, title) in enumerate(clips, 1):
            self.after(0, self.status.set, f"Cutting {idx}/{len(clips)} — {title}")
            dst = out / f"{idx:02d} - {safe_name(title, f'Clip {idx}')}.mp4"
            duration = end - start
            if self.accurate.get():
                cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start), "-i", str(src), "-t", str(duration), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", str(dst)]
            else:
                cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start), "-i", str(src), "-t", str(duration), "-c", "copy", str(dst)]
            try:
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, creationflags=CREATE_NO_WINDOW)
            except subprocess.CalledProcessError as e:
                failures.append((title, e.stderr.decode("utf-8", "ignore")[-500:]))
            self.after(0, self.progress.configure, {"value": idx})
        def done():
            if failures:
                self.status.set(f"Finished with {len(failures)} failure(s).")
                messagebox.showwarning("Clip Cutter", "Some clips failed:\n\n" + "\n".join(f"{t}: {m}" for t,m in failures[:4]))
            else:
                self.status.set(f"Done — {len(clips)} clips created in {out}")
                messagebox.showinfo("Clip Cutter", f"Created {len(clips)} clips.\n\n{out}")
        self.after(0, done)

if __name__ == "__main__":
    App().mainloop()
