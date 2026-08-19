#!/bin/bash
cd /tmp/pub-xiaodong-1
python3 - << 'PYEOF'
import json, subprocess, sys
items = json.load(open('covers.json'))
for it in items:
    out = f"/tmp/pub-xiaodong-1/covers/{it['n']}.jpg"
    r = subprocess.run(['python3','/root/.claude/skills/wewrite/toolkit/image_gen.py',
                        '--prompt', it['prompt'], '--output', out, '--size', 'cover'],
                       capture_output=True, text=True)
    ok = r.returncode == 0
    print(it['n'], 'OK' if ok else 'FAIL', flush=True)
    if not ok:
        print(r.stderr[-300:], flush=True)
PYEOF
echo ALL-DONE
