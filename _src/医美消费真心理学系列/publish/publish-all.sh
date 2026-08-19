#!/bin/bash
# 逐篇发布 8 篇草稿到丽格晓冬（draft/add，不群发）
cd /root/.claude/skills/wewrite
python3 - << 'PYEOF'
import json, subprocess, os
m = json.load(open('/tmp/pub-xiaodong-1/manifest.json'))
results = []
for it in m['items']:
    md = f"/tmp/pub-xiaodong-1/{it['file']}"
    cover = f"/tmp/pub-xiaodong-1/covers/{it['n']}.jpg"
    cmd = ['python3','toolkit/cli.py','publish',md,
           '--theme', m['theme'], '--title', it['title'], '--digest', it['digest']]
    if os.path.exists(cover):
        cmd += ['--cover', cover]
    r = subprocess.run(cmd, capture_output=True, text=True)
    out = (r.stdout + r.stderr).strip().replace('\n',' | ')
    print(f"== {it['n']} rc={r.returncode}: {out[-500:]}", flush=True)
    results.append((it['n'], r.returncode))
print('SUMMARY', results, flush=True)
PYEOF
echo PUBLISH-DONE
