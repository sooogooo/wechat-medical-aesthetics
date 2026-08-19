# -*- coding: utf-8 -*-
# 核对标题后删除 v1 旧草稿（只输出 ASCII，避免终端乱码）
# 注意微信 API 响应必须 r.content.decode('utf-8') 手动解析，r.json() 会误判编码
import sys, json, requests, yaml
sys.path.insert(0, '/root/.claude/skills/wewrite/toolkit')
from wechat_api import get_access_token

def wjson(r):
    return json.loads(r.content.decode('utf-8'))

cfg = yaml.safe_load(open('/root/.claude/skills/wewrite/config.yaml'))
wc = cfg['wechat']
token = get_access_token(wc['appid'], wc['secret'])

old = {
 '01': ('BaAwiUSgnTOVnjUsR0axIwoMDf1FRpnL7xqMWIAK01pivgN5Yfp1I6eVcdXMkOeX', '你买的不是变美'),
 '02': ('BaAwiUSgnTOVnjUsR0axI9zKmvGjx_8Qb-tlWkyxHKkWemQmEB0Uy6bnz80E_05i', '买了项目不维护'),
 '03': ('BaAwiUSgnTOVnjUsR0axI_BMZ3ncOliJOZfP-ELreTAsUyAYFdaGCdTs2Tw4mRmw', '医美里最贵的幻觉'),
 '04': ('BaAwiUSgnTOVnjUsR0axIyQ4q8UmWkglxiQnXphL4MLiU1ZoqJghyEWTfRuHO0J3', '没有天生想做抗衰'),
 '05': ('BaAwiUSgnTOVnjUsR0axI-eX3_apxirPyVSioFTodSYZR4mY1ObAHqBX-Z81Sfey', '收藏医生、反复检测'),
 '06': ('BaAwiUSgnTOVnjUsR0axIzXsLNlvflNZsQ22A_uhtTfagPDtPW4-EkznJ7fOqxRd', '消费者真正怕的不是花钱'),
 '07': ('BaAwiUSgnTOVnjUsR0axI6JKqX8G1oKZKZfhN53uow-mHiX0kzf6jwfOhro5eGp6', '获得感可以卖'),
 '08': ('BaAwiUSgnTOVnjUsR0axIwNdyZCBySTiyJsrn3oX4TQ6XwSPeu4Ww58_kWytRxjJ', '医美最稳的均衡'),
}

for n, (mid, prefix) in old.items():
    r = requests.post('https://api.weixin.qq.com/cgi-bin/draft/get?access_token=' + token,
                      json={'media_id': mid})
    g = wjson(r)
    items = g.get('news_item') or []
    title = items[0].get('title', '') if items else ''
    if prefix not in title:
        print(n, 'SKIP mismatch errcode=', g.get('errcode'))
        continue
    d = wjson(requests.post('https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=' + token,
                            json={'media_id': mid}))
    print(n, 'DELETED' if d.get('errcode') == 0 else 'ERR ' + str(d))
