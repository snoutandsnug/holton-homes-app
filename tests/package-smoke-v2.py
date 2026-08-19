from pathlib import Path
import re, subprocess, tempfile, shutil, sys
ROOT=Path(__file__).resolve().parents[1]
required=[
 'holton-studio-engine.js','holton-studio.js','holton-studio.css','holton-worth-it.js','holton-worth-it.css',
 'apply_holton_worth_it_update.py','INSTALL_WINDOWS.bat','CONFIGURE_OLLAMA_ORIGIN.bat',
 'upload-ready/index.html','upload-ready/service-worker.js','upload-ready/holton-studio-engine.js','upload-ready/holton-studio.js','upload-ready/holton-studio.css','upload-ready/holton-worth-it.js','upload-ready/holton-worth-it.css'
]
for rel in required: assert (ROOT/rel).exists(), f'missing {rel}'
engine=(ROOT/'holton-studio-engine.js').read_text(); ui=(ROOT/'holton-studio.js').read_text(); wi=(ROOT/'holton-worth-it.js').read_text(); idx=(ROOT/'upload-ready/index.html').read_text(); sw=(ROOT/'upload-ready/service-worker.js').read_text(); installer=(ROOT/'apply_holton_worth_it_update.py').read_text()
block=engine.split('const TOOL_CATALOG = [',1)[1].split('\n  ];',1)[0]
tools=re.findall(r'\{\s*id:\s*"([^"]+)"\s*,\s*category:\s*"([^"]+)"',block)
assert len(tools)==36, len(tools)
ids={x for x,_ in tools}
# Every v2 AI action references a real tool.
refs=set(re.findall(r'(?:data-wi-(?:quick-ai|generate|open-studio-tool)=\\?"|runTool\(\\?")([a-z0-9-]+)',wi))
for x in refs: assert x in ids, f'v2 references missing tool {x}'
for phrase in ['HOLTON COMMAND CENTER','Relationship Copilot','SELLER COMMAND DESK','Seller Net Estimate','HOLTON CONTENT FACTORY','CMA Workbench','Five workspaces. Complete jobs.']:
    assert phrase in wi, phrase
assert 'window.HoltonStudioUI' in ui, 'Studio UI API not exported'
for ref in ['./holton-studio.css?v=2','./holton-worth-it.css?v=2','./holton-studio-engine.js?v=2','./holton-studio.js?v=2','./holton-worth-it.js?v=2']:
    assert idx.count(ref)==1, f'index ref {ref}'
    assert sw.count(ref)==1, f'sw ref {ref}'
assert idx.index('holton-studio-engine.js?v=2')<idx.index('holton-studio.js?v=2')<idx.index('holton-worth-it.js?v=2')
assert 'holton-homes-worth-it-v2' in sw
for name in ['holton-studio-engine.js','holton-studio.js','holton-studio.css','holton-worth-it.js','holton-worth-it.css']:
    assert (ROOT/name).read_bytes()==(ROOT/'upload-ready'/name).read_bytes(), f'stale upload-ready {name}'
# No core app overwrite and no automated portal scraping.
assert 'app.js' not in installer.split('RUNTIME=',1)[1].split(']',1)[0]
allrt=engine+'\n'+ui+'\n'+wi
for forbidden in ['fetch("https://www.zillow.com',"fetch('https://www.zillow.com",'fetch("https://www.redfin.com',"fetch('https://www.redfin.com"]: assert forbidden not in allrt
# Seller net sheet must not preset compensation.
assert 'Enter actual agreed/estimated rate' in wi and 'Compensation is not assumed or preset' in wi
# Syntax.
for f in ['holton-studio-engine.js','holton-studio.js','holton-worth-it.js']: subprocess.run(['node','--check',str(ROOT/f)],check=True)
subprocess.run([sys.executable,'-m','py_compile',str(ROOT/'apply_holton_worth_it_update.py'),str(ROOT/'tools/HoltonClipCutter.pyw')],check=True)
# Installer idempotency.
with tempfile.TemporaryDirectory() as td:
    repo=Path(td); (repo/'app.js').write_text('// core')
    (repo/'index.html').write_text('<!doctype html><html><head><link rel="stylesheet" href="./holton-ai.css?v=8"></head><body><script src="./app.js"></script><script src="./holton-ai.js?v=8"></script></body></html>')
    (repo/'service-worker.js').write_text('const CACHE="old";\nconst ASSETS=["./","./index.html","./holton-ai.js?v=8"];')
    for _ in range(2): subprocess.run([sys.executable,str(ROOT/'apply_holton_worth_it_update.py'),str(repo)],check=True,stdout=subprocess.DEVNULL)
    i=(repo/'index.html').read_text(); s=(repo/'service-worker.js').read_text()
    for ref in ['./holton-studio.css?v=2','./holton-worth-it.css?v=2','./holton-studio-engine.js?v=2','./holton-studio.js?v=2','./holton-worth-it.js?v=2']:
        assert i.count(ref)==1, f'idempotency index {ref}'; assert s.count(ref)==1, f'idempotency sw {ref}'
for p in [ROOT/'__pycache__',ROOT/'tools/__pycache__']:
    if p.exists(): shutil.rmtree(p)
print('PASS Worth-It v2 package smoke:',len(tools),'tools; five workflow UX; installer idempotent')
