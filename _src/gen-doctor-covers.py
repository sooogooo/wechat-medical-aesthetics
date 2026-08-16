#!/usr/bin/env python3
"""腹壁整形系列第四轮封面：医生形象版（Seedream 5.0 参考图生图）。

- 参考：/tmp/abdo-publish/doctor-ref.png（532×822 医生照片，相貌锁定）
- 输出：/tmp/abdo-publish/covers-doctor/{A1..D3}-cover.png（2952×1256，2.35:1 微信封面）
- 构图：超宽横幅，医生半身居右约三分之一，主题静物占左侧三分之二
"""
import base64
import sys
import time
from pathlib import Path

import requests
import yaml

cfg = yaml.safe_load(open('/root/.claude/skills/wewrite/config.yaml', encoding='utf-8'))
img_cfg = cfg['image']
# provider 链里 doubao 的 key（image_gen.py 同款读取方式）
api_key = img_cfg.get('doubao', {}).get('api_key') or img_cfg.get('api_key')
base_url = 'https://ark.cn-beijing.volces.com/api/v3'
model = img_cfg.get('doubao', {}).get('model', 'doubao-seedream-5-0-260128')

REF = Path('/tmp/abdo-publish/doctor-ref.png')
OUT = Path('/tmp/abdo-publish/covers-doctor')
OUT.mkdir(parents=True, exist_ok=True)

ref_b64 = base64.b64encode(REF.read_bytes()).decode()
ref_uri = 'data:image/png;base64,' + ref_b64

LIKENESS = (
    "CRITICAL LIKENESS REQUIREMENTS, highest priority: the man MUST wear black rectangular "
    "eyeglasses exactly as in the reference photo; square face (guozi face) with clear jawline; "
    "short hair with left-side parting, slightly gray temples; thick straight dark eyebrows; "
    "narrow eyes; straight nose bridge. Study the reference photo carefully and preserve his identity."
)

MOTIFS = {
    'A1': "four different materials arranged on a surface: a soft clay lump, a drooping piece of loose fabric, two knitted ribbons pulled apart, and a small net with a hole",
    'A2': "two knitted fabric panels being drawn back together at the center by a threaded needle",
    'A3': "an excess piece of fabric drooping over a table edge like an apron",
    'B1': "five stitched seams of increasing length across one wide piece of fabric with a tailor chalk beside",
    'B2': "a neatly arranged surgical tray with suture thread, gauze and instruments in ordered rows",
    'B3': "two hands working on one piece of fabric: one pulling it taut while the other draws out excess padding from underneath",
    'C1': "one long horizontal seam running the full width of a piece of fabric, with a small wooden embroidery hoop resting nearby",
    'C2': "three ropes hanging side by side under different tension: one slack, one frayed, one pulled tight",
    'C3': "a thin branch wrapped in a bandage from which fresh young leaves are sprouting",
    'D1': "an hourglass standing on a table with an open palm held calmly in front of it",
    'D2': "a pen resting on a card of empty square checkboxes with a magnifying glass beside",
    'D3': "a small tower of stacked wooden blocks with one block sliding out at the bottom",
}

NEG = ("no readable text, no letters, no numbers, no logo, no watermark, no captions, no labels, "
       "no speech bubbles, no interface panels, no generic AI brain, no robot mascot, "
       "no decorative stock illustration, no gradient, no glow, no glossy 3D, "
       "no heavy drop shadow, no unintended extra limbs, no cropped key subject. "
       "Do NOT remove his eyeglasses.")


def build_prompt(key):
    motif = MOTIFS[key]
    return f"""{LIKENESS}

Task: premium editorial magazine cover artwork for a medical-education article, ultra-wide panoramic banner.

The doctor from the attached reference photo: half-body portrait in a clean white coat over a dark shirt, arms crossed, standing confidently on the RIGHT third of the ultra-wide frame, facing slightly toward the left.

The left two-thirds: a refined line-drawn still-life: {motif}, given generous horizontal space and quiet negative space around it.

Design: magazine-cover refinement; warm paper background #FAF8F3; a single deep blue accent #0072B2 used sparingly on thin geometric lines or small shapes; subtle paper grain; balanced panoramic composition, portrait counterposing still-life across the wide frame; quiet editorial elegance.

No readable text inside the image.

Negative constraints: {NEG}"""


def gen(key):
    out = OUT / f'{key}-cover.png'
    if out.exists() and out.stat().st_size > 100_000:
        print(f'{key} exists, skip')
        return
    body = {
        'model': model,
        'prompt': build_prompt(key),
        'image': [ref_uri],
        'response_format': 'url',
        'size': '2952x1256',
        'stream': False,
        'watermark': False,
    }
    for attempt in (1, 2, 3):
        try:
            r = requests.post(f'{base_url}/images/generations',
                              headers={'Content-Type': 'application/json',
                                       'Authorization': f'Bearer {api_key}'},
                              json=body, timeout=180)
            data = r.json()
            if r.status_code != 200:
                raise ValueError(f'HTTP {r.status_code}: {data}')
            url = data.get('data', [{}])[0].get('url')
            if not url:
                raise ValueError(f'no url: {data}')
            raw = requests.get(url, timeout=120).content
            out.write_bytes(raw)
            print(f'{key} OK {len(raw)//1024}KB -> {out}')
            return
        except Exception as e:
            print(f'{key} attempt {attempt} FAIL: {e}', file=sys.stderr)
            time.sleep(5)
    raise SystemExit(f'{key} failed after 3 attempts')


only = sys.argv[1:] or list(MOTIFS)
for k in only:
    gen(k)
    time.sleep(1)
print('ALL DONE')
