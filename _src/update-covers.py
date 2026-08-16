#!/usr/bin/env python3
"""腹壁整形系列：上传新写实封面并更新 12 篇草稿的封面（thumb_media_id）。

- 新封面：/tmp/abdo-publish/covers/{A1..D3}-cover.png（2952x1256, 2.35:1）
- 流程：上传封面为永久素材 -> draft/get 原草稿 -> 替换 thumb_media_id -> draft/update
- 关键：所有 POST 必须 json.dumps(ensure_ascii=False).encode('utf-8') + charset 头，
  严禁 requests json= 参数（中文会被转成字面 \\uXXXX 存储）。
"""
import json
import os
import time

import requests
import yaml

cfg = yaml.safe_load(open('/root/.claude/skills/wewrite/config.yaml', encoding='utf-8'))
appid = cfg['wechat']['appid']
secret = cfg['wechat']['secret']

r = requests.get('https://api.weixin.qq.com/cgi-bin/token',
                 params={'grant_type': 'client_credential', 'appid': appid, 'secret': secret}, timeout=30)
token = r.json()['access_token']
print('token OK')

DRAFT_MIDS = {
    'A1': 'BaAwiUSgnTOVnjUsR0axI6nBPAZ31A_Z0j4Bee0gCnNqFfcUPFSN4DemdbgBe19v',
    'A2': 'BaAwiUSgnTOVnjUsR0axI_clXliiKAmdOFfcjM2TFtCvRxFg5Dm20fpet39qIyxH',
    'A3': 'BaAwiUSgnTOVnjUsR0axI6sNHA6Lbw1N-F_9gxv00bFZR55P2zPDabpnE8BNGhRw',
    'B1': 'BaAwiUSgnTOVnjUsR0axI-YPiIWx3jBDNkSG02hy-xonoWyrNzLoXMFp_R-QFCoz',
    'B2': 'BaAwiUSgnTOVnjUsR0axI0KE9cpfDqcjHBjS710IumJtg7M9y0a3KZHHUXI1aUW8',
    'B3': 'BaAwiUSgnTOVnjUsR0axI9JYFqLHpmwDmpWx0ADmhZfbVo5Zt69OHjVo-7tDWbVW',
    'C1': 'BaAwiUSgnTOVnjUsR0axI392FTCcLYxSfR6VmTKHDtMzUVu9uZxvUan4KML-4mX4',
    'C2': 'BaAwiUSgnTOVnjUsR0axIwkCbzKD-sq1LolEJkGA1uemGfm5yQ0z-ZGPpTx7FHMl',
    'C3': 'BaAwiUSgnTOVnjUsR0axIyTkg_8R5WI-cObLvZHmna2X62DKuU7lgcV9ezaxa10S',
    'D1': 'BaAwiUSgnTOVnjUsR0axI-IAwHGRbiMzWsmKIQomveH0gBOk3_cQKZfrmRfjyPCD',
    'D2': 'BaAwiUSgnTOVnjUsR0axI1e8khRZYQ8Dk9CK1D-FTCzhNxrEsmjaxl-JJsrpwRnN',
    'D3': 'BaAwiUSgnTOVnjUsR0axI5MO-Rq-NyI6MteFMVn_0Ezlvto-3da58ONIBqa3UmL7',
}
COVER_DIR = '/tmp/abdo-publish/covers'
KEEP = ['title', 'author', 'digest', 'content', 'content_source_url', 'thumb_media_id',
        'need_open_comment', 'only_fans_can_comment', 'show_cover_pic', 'pic_crop_235_1', 'pic_crop_1_1']


def api_post(url, payload, timeout=90):
    return requests.post(url, params={'access_token': token},
                         data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
                         headers={'Content-Type': 'application/json; charset=utf-8'},
                         timeout=timeout)


for k, draft_mid in DRAFT_MIDS.items():
    cover = os.path.join(COVER_DIR, k + '-cover.png')
    if not os.path.exists(cover):
        print('%s SKIP (cover missing)' % k)
        continue
    # 1. 上传封面为永久素材
    with open(cover, 'rb') as f:
        r = requests.post('https://api.weixin.qq.com/cgi-bin/material/add_material',
                          params={'access_token': token, 'type': 'image'},
                          files={'media': (os.path.basename(cover), f, 'image/png')}, timeout=90)
    d = json.loads(r.content.decode('utf-8'))
    if 'media_id' not in d:
        print('%s UPLOAD FAIL: %s' % (k, d))
        continue
    thumb = d['media_id']
    print('%s cover uploaded: %s' % (k, thumb))
    # 2. 取原草稿
    r = api_post('https://api.weixin.qq.com/cgi-bin/draft/get', {'media_id': draft_mid})
    d2 = json.loads(r.content.decode('utf-8'))
    if 'news_item' not in d2:
        print('%s GET FAIL: %s' % (k, d2))
        continue
    n = d2['news_item'][0]
    n['thumb_media_id'] = thumb
    articles = {kk: n[kk] for kk in KEEP if kk in n}
    # 3. 更新草稿
    r = api_post('https://api.weixin.qq.com/cgi-bin/draft/update',
                 {'media_id': draft_mid, 'index': 0, 'articles': articles})
    d3 = json.loads(r.content.decode('utf-8'))
    print('%s update: %s' % (k, d3))
    time.sleep(0.5)
print('ALL DONE')
