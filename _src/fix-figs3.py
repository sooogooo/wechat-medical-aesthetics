#!/usr/bin/env python3
"""腹壁整形系列：补插第 3 张写实配图（修复 update-figs.py 的 pop 消耗 bug）。

每篇草稿当前正文已有新图 fig1/fig2（data-src 替换成功），
本脚本：上传 fig3 -> draft/get -> 复制第二个 img 标签换 src=fig3 -> 插入其后 -> update。
"""
import io
import json
import os
import re
import time

import requests
import yaml
from PIL import Image

cfg = yaml.safe_load(open('/root/.claude/skills/wewrite/config.yaml', encoding='utf-8'))
r = requests.get('https://api.weixin.qq.com/cgi-bin/token',
                 params={'grant_type': 'client_credential', 'appid': cfg['wechat']['appid'],
                         'secret': cfg['wechat']['secret']}, timeout=30)
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
FIG_DIR = '/tmp/abdo-publish/figs'
KEEP = ['title', 'author', 'digest', 'content', 'content_source_url', 'thumb_media_id',
        'need_open_comment', 'only_fans_can_comment', 'show_cover_pic', 'pic_crop_235_1', 'pic_crop_1_1']
img_re = re.compile(r'<img\b[^>]*>')


def api_post(url, payload, timeout=120):
    return requests.post(url, params={'access_token': token},
                         data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
                         headers={'Content-Type': 'application/json; charset=utf-8'},
                         timeout=timeout)


def upload_img(path):
    img = Image.open(path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=88, optimize=True)
    buf.seek(0)
    r = requests.post('https://api.weixin.qq.com/cgi-bin/media/uploadimg',
                      params={'access_token': token},
                      files={'media': (os.path.basename(path).replace('.png', '.jpg'), buf, 'image/jpeg')},
                      timeout=120)
    d = json.loads(r.content.decode('utf-8'))
    if 'url' not in d:
        raise RuntimeError('uploadimg fail: %s' % d)
    return d['url']


for k, draft_mid in DRAFT_MIDS.items():
    p3 = os.path.join(FIG_DIR, '%s-3.png' % k)
    url3 = upload_img(p3)
    print('%s fig3 uploaded %s' % (k, url3[:70]))
    r = api_post('https://api.weixin.qq.com/cgi-bin/draft/get', {'media_id': draft_mid})
    d2 = json.loads(r.content.decode('utf-8'))
    if 'news_item' not in d2:
        print('%s GET FAIL: %s' % (k, d2))
        continue
    n = d2['news_item'][0]
    content = n['content']
    tags = img_re.findall(content)
    if len(tags) < 2:
        print('%s WARN imgs=%d, skip insert' % (k, len(tags)))
        continue
    second = tags[1]
    third = re.sub(r'src="[^"]*"', 'src="%s"' % url3, second)
    content2 = content.replace(second, second + '\n' + third, 1)
    n['content'] = content2
    articles = {kk: n[kk] for kk in KEEP if kk in n}
    r = api_post('https://api.weixin.qq.com/cgi-bin/draft/update',
                 {'media_id': draft_mid, 'index': 0, 'articles': articles})
    d3 = json.loads(r.content.decode('utf-8'))
    print('%s update: %s' % (k, d3))
    time.sleep(0.5)
print('ALL DONE')
