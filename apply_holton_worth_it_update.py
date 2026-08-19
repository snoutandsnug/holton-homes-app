#!/usr/bin/env python3
"""Install Holton Homes Worth-It Update v2 on a fresh branch/local repo.

Keeps app.js untouched. Re-running is safe/idempotent.
"""
from __future__ import annotations
import re, shutil, sys
from pathlib import Path

VERSION="2"
RUNTIME=["holton-studio-engine.js","holton-studio.js","holton-studio.css","holton-worth-it.js","holton-worth-it.css"]
CSS_STUDIO=f'<link rel="stylesheet" href="./holton-studio.css?v={VERSION}">'
CSS_WORTH=f'<link rel="stylesheet" href="./holton-worth-it.css?v={VERSION}">'
JS_ENGINE=f'<script src="./holton-studio-engine.js?v={VERSION}"></script>'
JS_STUDIO=f'<script src="./holton-studio.js?v={VERSION}"></script>'
JS_WORTH=f'<script src="./holton-worth-it.js?v={VERSION}"></script>'
CACHE="holton-homes-worth-it-v2"

def die(msg): print("ERROR:",msg); raise SystemExit(1)
def repo_path(arg=None):
    if arg: p=Path(arg).expanduser().resolve()
    elif (Path.cwd()/"index.html").exists(): p=Path.cwd().resolve()
    else: p=Path(input("Paste the path to your holton-homes-app folder: ").strip().strip('"')).expanduser().resolve()
    if not (p/"index.html").exists() or not (p/"app.js").exists(): die(f"{p} is not the Holton Homes repo root.")
    return p

def backup(repo,name):
    src=repo/name
    if not src.exists(): return
    d=repo/".bak-holton-worth-it-v2"; d.mkdir(exist_ok=True); dst=d/name
    if not dst.exists(): shutil.copy2(src,dst); print("Backup:",dst)

def copy_runtime(repo,pkg):
    for name in RUNTIME:
        src=pkg/name
        if not src.exists(): die(f"Package missing {name}")
        shutil.copy2(src,repo/name); print("Installed:",name)

def patch_index(repo):
    p=repo/"index.html"; t=p.read_text(encoding="utf-8")
    patterns=[
      r'\s*<link\s+rel="stylesheet"\s+href="\./holton-studio\.css\?v=[^"]+"\s*>',
      r'\s*<link\s+rel="stylesheet"\s+href="\./holton-worth-it\.css\?v=[^"]+"\s*>',
      r'\s*<script\s+src="\./holton-studio-engine\.js\?v=[^"]+"\s*></script>',
      r'\s*<script\s+src="\./holton-studio\.js\?v=[^"]+"\s*></script>',
      r'\s*<script\s+src="\./holton-worth-it\.js\?v=[^"]+"\s*></script>',
    ]
    for pat in patterns: t=re.sub(pat,"",t)
    m=re.search(r'(<link\s+rel="stylesheet"\s+href="\./holton-ai\.css[^>]*>)',t)
    if not m: die("Could not find holton-ai.css in index.html")
    t=t[:m.end()]+"\n  "+CSS_STUDIO+"\n  "+CSS_WORTH+t[m.end():]
    m=re.search(r'(<script\s+src="\./holton-ai\.js[^>]*></script>)',t)
    if not m: die("Could not find holton-ai.js in index.html")
    t=t[:m.end()]+"\n"+JS_ENGINE+"\n"+JS_STUDIO+"\n"+JS_WORTH+t[m.end():]
    p.write_text(t,encoding="utf-8"); print("Patched: index.html")

def patch_sw(repo):
    p=repo/"service-worker.js"
    if not p.exists(): print("WARNING: service-worker.js missing; skipped cache patch."); return
    t=p.read_text(encoding="utf-8")
    t=re.sub(r'const\s+CACHE\s*=\s*"[^"]+"\s*;',f'const CACHE="{CACHE}";',t,count=1)
    t=re.sub(r'\s*"\./holton-(?:studio(?:-engine)?|worth-it)\.(?:js|css)\?v=[^"]+",?',"",t)
    entries=[f'"./holton-studio.css?v={VERSION}"',f'"./holton-studio-engine.js?v={VERSION}"',f'"./holton-studio.js?v={VERSION}"',f'"./holton-worth-it.css?v={VERSION}"',f'"./holton-worth-it.js?v={VERSION}"']
    m=re.search(r'("\./holton-ai\.js[^\"]*"\s*,?)',t)
    if m:
        pre=t[:m.end()]
        if not pre.rstrip().endswith(','): pre=pre.rstrip()+','
        t=pre+"\n  "+",\n  ".join(entries)+","+t[m.end():]
    else: print("WARNING: could not locate holton-ai.js cache anchor.")
    p.write_text(t,encoding="utf-8"); print("Patched: service-worker.js")

def validate(repo):
    idx=(repo/"index.html").read_text(encoding="utf-8")
    checks={
      "Studio CSS once":idx.count("./holton-studio.css?v=2")==1,
      "Worth CSS once":idx.count("./holton-worth-it.css?v=2")==1,
      "Engine once":idx.count("./holton-studio-engine.js?v=2")==1,
      "Studio UI once":idx.count("./holton-studio.js?v=2")==1,
      "Worth UI once":idx.count("./holton-worth-it.js?v=2")==1,
      "Load order":idx.find("holton-studio-engine.js")<idx.find("holton-studio.js")<idx.find("holton-worth-it.js"),
    }
    sw=repo/"service-worker.js"
    if sw.exists():
        s=sw.read_text(encoding="utf-8")
        checks.update({"Cache v2":CACHE in s,"Worth JS cached":s.count("./holton-worth-it.js?v=2")==1,"Worth CSS cached":s.count("./holton-worth-it.css?v=2")==1})
    for n,ok in checks.items(): print(("PASS" if ok else "FAIL")+":",n)
    bad=[n for n,ok in checks.items() if not ok]
    if bad: die("Validation failed: "+", ".join(bad))

def main():
    pkg=Path(__file__).resolve().parent; repo=repo_path(sys.argv[1] if len(sys.argv)>1 else None)
    print(f"\nHolton Homes Worth-It Update v2\nRepo: {repo}\n")
    backup(repo,"index.html"); backup(repo,"service-worker.js")
    copy_runtime(repo,pkg); patch_index(repo); patch_sw(repo); validate(repo)
    print("\nDONE. Test this on a fresh branch/Vercel preview before merging to main.")
if __name__=="__main__": main()
