#!/usr/bin/env python3
"""腹壁整形系列 SVG→PNG 批量转换 + 字体渲染校验

用途：
  在远端执行，将 images-poster/*.svg 批量转 PNG（900 宽），并校验
  汉字渲染未出现方框/乱码（字体缺失是主因）。

执行（远端）：
  python3 convert-posters-with-check.py <系列目录>

校验逻辑：
  1. fc-list 确认远端存在中文字体（Noto Sans CJK / WenQuanYi）
  2. fc-match 确认 SVG 字体族可正确解析
  3. 批量转换全部 SVG → PNG
  4. 每张 PNG 统计暗像素密度（正常 0.3%～30%；空白/大面积异常会告警）
  5. 输出第一张海报顶部标题区的 ASCII 渲染，供人工目检笔画结构
     （汉字=密集不规则笔画簇；方框=规则空心矩形）
"""
import os
import sys
import glob
import subprocess

from PIL import Image


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else '.'
    poster_dir = os.path.join(base, 'images-poster')
    if not os.path.isdir(poster_dir):
        print('[FAIL] 找不到目录:', poster_dir)
        sys.exit(1)

    # 1. 中文字体环境
    fonts = subprocess.run(['fc-list', ':lang=zh'], capture_output=True, text=True).stdout
    if 'Noto Sans CJK' not in fonts and 'WenQuanYi' not in fonts:
        print('[FAIL] 远端缺少中文字体，请先安装 fonts-noto-cjk')
        sys.exit(1)
    print('[OK] 中文字体已安装（Noto Sans CJK / WenQuanYi）')

    # 2. fontconfig 匹配（SVG 字体链: Microsoft YaHei -> Noto Sans CJK SC -> sans-serif）
    for fam in ['Microsoft YaHei', 'Noto Sans CJK SC', 'sans-serif:lang=zh']:
        m = subprocess.run(['fc-match', fam], capture_output=True, text=True).stdout.strip()
        print('[OK] fc-match %-22s -> %s' % (fam, m))
        if 'CJK' not in m and 'WQY' not in m and 'WenQuanYi' not in m:
            print('[WARN] 该字体族未命中 CJK 字体，可能渲染方框')

    # 3. 批量转换
    import cairosvg
    svgs = sorted(glob.glob(os.path.join(poster_dir, '*.svg')))
    for s in svgs:
        png = s[:-4] + '.png'
        cairosvg.svg2png(url=s, write_to=png, output_width=900)
    print('[OK] 转换完成 %d 张 SVG -> PNG' % len(svgs))

    # 4. 每张像素密度校验
    bad = 0
    for s in svgs:
        png = s[:-4] + '.png'
        img = Image.open(png).convert('L')
        w, h = img.size
        px = img.load()
        dark = sum(1 for y in range(0, h, 2) for x in range(0, w, 2) if px[x, y] < 128)
        ratio = 100.0 * dark / ((w // 2) * (h // 2))
        flag = 'OK'
        if not (0.3 < ratio < 30):
            flag = 'CHECK'
            bad += 1
        print('[%s] %-14s %dx%d dark=%.2f%%' % (flag, os.path.basename(png), w, h, ratio))
    if bad:
        print('[FAIL] %d 张密度异常，请人工检查' % bad)
        sys.exit(1)
    print('[OK] 全部 %d 张密度正常' % len(svgs))

    # 5. ASCII 抽样（第一张海报标题区，供人工目检）
    first_png = svgs[0][:-4] + '.png'
    img = Image.open(first_png).convert('L')
    top = img.crop((0, 0, 900, 160)).resize((150, 26))
    px = top.load()
    chars = ' .:-=+*#%@'
    print('---- ASCII 抽样（%s 标题区，人工确认汉字笔画）----' % os.path.basename(first_png))
    for y in range(26):
        print(''.join(chars[min(9, px[x, y] * 10 // 256)] for x in range(150)))


if __name__ == '__main__':
    main()
