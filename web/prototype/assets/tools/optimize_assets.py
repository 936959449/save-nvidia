#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
《拯救英伟达》原型 · 美术资产 WebP 优化
用法：
  python optimize_assets.py            # 只转换缺失或比 PNG 旧的 WebP
  python optimize_assets.py --force    # 全部重转
  python optimize_assets.py --quality 88
说明：
  - 原 PNG 保留，作为回退与源文件；页面加载器优先 WebP。
  - 替换 PNG 后重新运行本脚本即可更新 WebP。
"""
import argparse
import os
import time

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUALITY = 88


def iter_pngs(root):
    for dirpath, _, filenames in os.walk(root):
        if os.path.basename(dirpath) == "tools":
            continue
        for name in filenames:
            if name.lower().endswith(".png"):
                yield os.path.join(dirpath, name)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="忽略时间戳，全部重转")
    parser.add_argument("--quality", type=int, default=QUALITY, help="WebP 质量，默认 88")
    args = parser.parse_args()

    files = sorted(iter_pngs(ROOT))
    total_png = total_webp = 0
    converted = skipped = 0
    started = time.time()

    for png in files:
        webp = os.path.splitext(png)[0] + ".webp"
        total_png += os.path.getsize(png)
        stale = (
            args.force
            or not os.path.exists(webp)
            or os.path.getmtime(webp) < os.path.getmtime(png)
        )
        if not stale:
            skipped += 1
            total_webp += os.path.getsize(webp)
            continue
        with Image.open(png) as im:
            # 保留透明通道；没有 alpha 的图转 RGB，避免无意义的透明层
            if im.mode in ("RGBA", "LA"):
                im = im.convert("RGBA")
            else:
                im = im.convert("RGB")
            im.save(webp, "WEBP", quality=args.quality, method=6)
        converted += 1
        total_webp += os.path.getsize(webp)
        print(f"  {os.path.relpath(png, ROOT)} -> {os.path.basename(webp)} "
              f"({os.path.getsize(png)//1024} KB -> {os.path.getsize(webp)//1024} KB)")

    print(f"\n完成：转换 {converted}，跳过 {skipped}，共 {len(files)} 张")
    print(f"PNG  {total_png/1024/1024:.2f} MB")
    print(f"WebP {total_webp/1024/1024:.2f} MB "
          f"({total_webp/total_png*100:.1f}% of PNG)" if total_png else "WebP 0 MB")
    print(f"耗时 {time.time()-started:.1f}s")
    print("页面加载器按 webp → png → jpg → jpeg → svg 查找；替换 PNG 后请重跑本脚本。")


if __name__ == "__main__":
    main()
