#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
《拯救英伟达》原型 · 美术坑位占位图生成器
用法：python generate_placeholders.py
产物：
  assets/characters/<id>-<state>.svg   角色 1200×840
  assets/scenes/<id>.svg               场景 1600×900
  assets/evidence/<id>.svg             证据图 1200×800
  assets/news/<id>.svg                 报纸配图 800×600
  assets/manifest.json                 槽位清单（工具/引擎共用）
  assets/manifest.js                   manifest 的 JS 版本（file:// 直接打开时用）
替换真实美术：把同名 .png 放到对应目录，再运行 optimize_assets.py 生成 WebP；加载器优先 webp。
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = ROOT
FONT = "Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif"
MONO = "Consolas, Cascadia Mono, monospace"

CHAR_W, CHAR_H, CHAR_SAFE = 1200, 840, 80
SCENE_W, SCENE_H, SCENE_SAFE = 1600, 900, 80
EVID_W, EVID_H, EVID_SAFE = 1200, 800, 60
NEWS_W, NEWS_H, NEWS_SAFE = 800, 600, 40

CHARACTERS = [
    dict(id="jones", name="哈维·琼斯", role="董事会主席", faction="资本", color="#C9A24A",
         note="银发、眼镜、深橄榄西装；视平线略高，像在审视玩家。",
         states=[("neutral", "平静"), ("pressured", "施压"), ("pleased", "满意")]),
    dict(id="kress", name="科莱特·克雷斯", role="临时 CEO 兼 CFO", faction="资本", color="#C9A24A",
         note="深色波波头、蓝西装、珍珠耳环；姿态克制。",
         states=[("neutral", "平静"), ("pressured", "施压"), ("pleased", "满意")]),
    dict(id="admin", name="玛丽", role="行政主管", faction="内部", color="#9AA88F",
         note="发髻、开衫、工牌挂绳；手里常抱一个纸箱。",
         states=[("neutral", "平静"), ("pressured", "施压"), ("pleased", "满意")]),
    dict(id="regulator", name="老周", role="市场监管调查组", faction="中国监管", color="#D4574A",
         note="短黑发、圆框眼镜、暗红夹克；目光不直视。",
         states=[("neutral", "平静"), ("pressured", "施压"), ("pleased", "满意")]),
    dict(id="official", name="许可官", role="出口管制办公室", faction="白宫", color="#6C86A8",
         note="侧分短发、藏蓝西装、国旗别针与耳麦线。",
         states=[("neutral", "平静"), ("pressured", "施压"), ("pleased", "满意")]),
    dict(id="buyer", name="戴维", role="超大规模云厂商采购", faction="客户", color="#5689DA",
         note="短寸、浅蓝衬衫、公司挂绳；手里拿着合同或平板。",
         states=[("neutral", "平静"), ("pressured", "施压"), ("pleased", "满意")]),
    dict(id="supplier", name="林先生", role="台积电产能主管", faction="供应链", color="#76B900",
         note="灰发、工装夹克、厂牌；背景可带晶圆/机台暗示。",
         states=[("neutral", "平静"), ("pressured", "施压"), ("pleased", "满意")]),
    dict(id="huang", name="黄仁勋", role="前任 CEO（不出场）", faction="前任", color="#76B900",
         note="不画正脸。只交付三样东西：皮衣、信件、GTC 剪影。",
         states=[("jacket", "皮衣"), ("letter", "信件"), ("stage", "GTC 剪影")]),
]

SCENES = [
    dict(id="office", name="顶层办公室", note="黄昏落地窗、数据中心剪影、皮衣挂在椅背上（可空镜）。"),
    dict(id="boardroom", name="董事会会议室", note="长桌、绿台灯、空椅子；冷色调。"),
    dict(id="gtc", name="GTC 舞台", note="绿色背光、巨大屏幕、台下只留黑色人海。"),
]
EVIDENCE = [
    dict(id="jacket", name="证据 01 · 皮衣", note="皮衣挂在椅背，办公室暗场，绿色屏幕光。3:2 横构图。"),
]
NEWS = [
    dict(id="photo", name="报纸配图 · 通用", note="半调黑白新闻照；跌幅曲线 / 交易所 / 空椅子任选。"),
]


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def frame(w, h, safe, name, slot_id, tag, note):
    """通用占位底：网格 + 安全区 + 四角裁切线 + 标题。"""
    cols = 8
    rows = 6
    grid = []
    for i in range(1, cols):
        x = round(w * i / cols)
        grid.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{h}" stroke="#FFFFFF" stroke-opacity=".05"/>')
    for j in range(1, rows):
        y = round(h * j / rows)
        grid.append(f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="#FFFFFF" stroke-opacity=".05"/>')
    grid = "".join(grid)
    sx, sy = safe, safe
    sw, sh = w - safe * 2, h - safe * 2
    crop = []
    for (cx, cy, dx, dy) in [(sx, sy, 1, 1), (w - sx, sy, -1, 1), (sx, h - sy, 1, -1), (w - sx, h - sy, -1, -1)]:
        crop.append(f'<path d="M{cx} {cy} l{dx*34} 0 M{cx} {cy} l0 {dy*34}" stroke="#A6E04C" stroke-width="2" opacity=".8"/>')
    return f'''<rect width="{w}" height="{h}" fill="#1B211D"/>
<rect width="{w}" height="{h}" fill="url(#dots)"/>
{grid}
<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" fill="none" stroke="#F2ECDF" stroke-opacity=".28" stroke-width="2" stroke-dasharray="10 10"/>
{''.join(crop)}
<text x="{sx}" y="{sy-24}" font-family="{MONO}" font-size="18" letter-spacing="4" fill="#A6E04C">PLACEHOLDER · {esc(tag)}</text>
<text x="{w-sx}" y="{sy-24}" text-anchor="end" font-family="{MONO}" font-size="16" letter-spacing="2" fill="#8B958A">{slot_id}</text>
<text x="{sx}" y="{h-sy+44}" font-family="{MONO}" font-size="15" letter-spacing="1" fill="#8B958A">{w} × {h} px · safe {safe}px</text>
<text x="{w-sx}" y="{h-sy+44}" text-anchor="end" font-family="{FONT}" font-size="15" fill="#8B958A">{esc(note)}</text>'''


def character_svg(char, state, label):
    w, h, safe = CHAR_W, CHAR_H, CHAR_SAFE
    color = char["color"]
    cx, cy = w // 2, int(h * 0.40)
    # 状态提示色
    tint = {"neutral": "#8B958A", "pressured": "#D4574A", "pleased": "#A6E04C",
            "jacket": "#76B900", "letter": "#C9A24A", "stage": "#A6E04C"}.get(state, "#8B958A")
    # 人物剪影占位
    if char["id"] == "huang":
        if state == "jacket":
            figure = f'''<path d="M470 690 L520 470 L600 430 L680 470 L730 690 Z" fill="#0E0E0E" stroke="#4A4A4A" stroke-width="6"/>
<path d="M560 430 L600 490 L640 430" fill="none" stroke="#5A5A5A" stroke-width="5"/>
<path d="M456 690 L520 470 M744 690 L680 470" stroke="#2A2A2A" stroke-width="8"/>
<path d="M470 690 h260" stroke="#2A2A2A" stroke-width="10"/>'''
        elif state == "letter":
            figure = f'''<rect x="430" y="380" width="340" height="230" rx="6" fill="#EFE8DA" stroke="{color}" stroke-width="4"/>
<path d="M430 380 L600 500 L770 380" fill="none" stroke="#8B7B62" stroke-width="4"/>
<path d="M470 540 h160 M470 570 h110" stroke="#B7A98F" stroke-width="5"/>'''
        else:
            figure = f'''<circle cx="{cx}" cy="430" r="120" fill="#0E0E0E" stroke="{color}" stroke-width="4"/>
<path d="M420 690 c0-110 80-180 180-180 s180 70 180 180" fill="#0E0E0E" stroke="{color}" stroke-width="4"/>
<path d="M360 720 h480" stroke="{color}" stroke-width="3" opacity=".5"/>'''
    else:
        figure = f'''<circle cx="{cx}" cy="{cy}" r="128" fill="#3A423B" stroke="{tint}" stroke-width="4"/>
<path d="M360 760 c0-150 100-240 240-240 s240 90 240 240" fill="#2A302A" stroke="{tint}" stroke-width="4"/>
<path d="M560 {cy+150} v90 M640 {cy+150} v90" stroke="#1B211D" stroke-width="10"/>'''
    body = frame(w, h, safe, char["name"], f'{char["id"]}-{state}', "CHARACTER", char["note"])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="#F2ECDF" opacity=".12"/></pattern></defs>
{body}
<g opacity=".9">{figure}</g>
<rect x="{w//2-190}" y="{safe+20}" width="380" height="44" rx="22" fill="none" stroke="{tint}" stroke-width="2"/>
<text x="{w//2}" y="{safe+49}" text-anchor="middle" font-family="{FONT}" font-size="20" fill="{tint}" letter-spacing="4">表情：{label}</text>
<text x="{cx}" y="600" text-anchor="middle" font-family="{FONT}" font-size="44" font-weight="700" fill="#F2ECDF">{esc(char["name"])}</text>
<text x="{cx}" y="646" text-anchor="middle" font-family="{FONT}" font-size="22" fill="#B7C0B2">{esc(char["role"])} · {esc(char["faction"])}</text>
<text x="{cx}" y="700" text-anchor="middle" font-family="{MONO}" font-size="16" fill="{color}" letter-spacing="2">{char["id"]}-{state} · 替换文件：characters/{char["id"]}-{state}.png</text>
<text x="{cx}" y="{h-120}" text-anchor="middle" font-family="{FONT}" font-size="34" font-weight="800" fill="#F4EFE4" letter-spacing="6">PLACEHOLDER</text>
</svg>'''


def misc_svg(group, item):
    if group == "scenes":
        w, h, safe = SCENE_W, SCENE_H, SCENE_SAFE
        slot = f'scenes/{item["id"]}'
        body = frame(w, h, safe, item["name"], slot, "SCENE", item["note"])
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="#F2ECDF" opacity=".12"/></pattern></defs>
{body}
<rect x="{safe+60}" y="{safe+80}" width="{w-2*safe-120}" height="{h-2*safe-160}" fill="none" stroke="#8B958A" stroke-width="2" stroke-dasharray="6 8" opacity=".5"/>
<text x="{w//2}" y="{h//2-20}" text-anchor="middle" font-family="{FONT}" font-size="52" font-weight="700" fill="#F2ECDF" opacity=".9">{esc(item["name"])}</text>
<text x="{w//2}" y="{h//2+40}" text-anchor="middle" font-family="{MONO}" font-size="22" fill="#A6E04C" letter-spacing="3">SCENE / BACKGROUND</text>
<text x="{w//2}" y="{h//2+92}" text-anchor="middle" font-family="{MONO}" font-size="16" fill="#8B958A">{w}×{h} · 16:9 · safe {safe}px</text>
</svg>'''
    if group == "evidence":
        w, h, safe = EVID_W, EVID_H, EVID_SAFE
        slot = f'evidence/{item["id"]}'
        body = frame(w, h, safe, item["name"], slot, "EVIDENCE", item["note"])
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="#F2ECDF" opacity=".12"/></pattern></defs>
{body}
<rect x="160" y="120" width="{w-320}" height="{h-260}" fill="#0F0F0F" stroke="#3A3A3A" stroke-width="3"/>
<rect x="{w//2-220}" y="220" width="440" height="300" rx="10" fill="#232323" stroke="#3A3A3A" stroke-width="6"/>
<path d="M{w//2-300} 640 l40-300 M{w//2+300} 640 l-40-300" stroke="#2A2A2A" stroke-width="10"/>
<path d="M{w//2-190} 210 h380" stroke="#6A6A6A" stroke-width="8"/>
<path d="M{w//2-120} 250 h240 l50 110 -70 30 -20 140 h-160 l-20-140 -70-30 50-110 Z" fill="#0D0D0D" stroke="#4A4A4A" stroke-width="4"/>
<text x="{w//2}" y="640" text-anchor="middle" font-family="{FONT}" font-size="30" fill="#F2ECDF" opacity=".8">皮衣 · 顶层办公室 · 3:2</text>
</svg>'''
    # news
    w, h, safe = NEWS_W, NEWS_H, NEWS_SAFE
    slot = f'news/{item["id"]}'
    body = frame(w, h, safe, item["name"], slot, "NEWS PHOTO", item["note"])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#F2ECDF" opacity=".14"/></pattern></defs>
{body}
<rect x="{safe+30}" y="{safe+60}" width="{w-2*safe-60}" height="{h-2*safe-120}" fill="none" stroke="#A6E04C" stroke-width="2" stroke-dasharray="6 8" opacity=".5"/>
<path d="M120 420 L250 300 L360 360 L520 210 L660 260 L700 300" fill="none" stroke="#D4574A" stroke-width="8"/>
<circle cx="520" cy="210" r="12" fill="#D4574A"/>
<text x="{w//2}" y="{h-110}" text-anchor="middle" font-family="{MONO}" font-size="18" fill="#8B958A">{w}×{h} · 4:3 · 半调/黑白优先</text>
</svg>'''


def main():
    manifest = {
        "version": "1.0.0",
        "updated": "2026-11-13",
        "project": "拯救英伟达 · 原型美术槽位",
        "notes": "替换时把同名 PNG（源文件）放到对应目录，并运行 tools/optimize_assets.py 生成 WebP；加载器按 webp→png→jpg→jpeg→svg 查找。安全区内的主体不会被 UI 裁掉；焦点默认在画布上方 38% 处。",
        "canvas": {
            "character": {"w": CHAR_W, "h": CHAR_H, "safe": CHAR_SAFE, "focal": [600, 320]},
            "scene": {"w": SCENE_W, "h": SCENE_H, "safe": SCENE_SAFE},
            "evidence": {"w": EVID_W, "h": EVID_H, "safe": EVID_SAFE},
            "news": {"w": NEWS_W, "h": NEWS_H, "safe": NEWS_SAFE}
        },
        "characters": [],
        "misc": []
    }
    for c in CHARACTERS:
        cdir = os.path.join(OUT, "characters")
        os.makedirs(cdir, exist_ok=True)
        states = []
        for state, label in c["states"]:
            fn = f'{c["id"]}-{state}.svg'
            with open(os.path.join(cdir, fn), "w", encoding="utf-8") as f:
                f.write(character_svg(c, state, label))
            states.append({
                "state": state, "label": label,
                "file": f'characters/{c["id"]}-{state}',
                "usage": "卡片默认立绘" if state == "neutral" else "选择后的表情反馈"
            })
        manifest["characters"].append({
            "id": c["id"], "name": c["name"], "role": c["role"],
            "faction": c["faction"], "color": c["color"], "note": c["note"],
            "states": states
        })
    for group, items in [("scenes", SCENES), ("evidence", EVIDENCE), ("news", NEWS)]:
        gdir = os.path.join(OUT, group)
        os.makedirs(gdir, exist_ok=True)
        for item in items:
            fn = f'{item["id"]}.svg'
            with open(os.path.join(gdir, fn), "w", encoding="utf-8") as f:
                f.write(misc_svg(group, item))
            manifest["misc"].append({
                "id": item["id"], "group": group, "name": item["name"],
                "file": f'{group}/{item["id"]}', "note": item["note"],
                "usage": {"scenes": "标题 / 事件背景", "evidence": "标题页证据照片",
                          "news": "结局报纸配图"}[group]
            })
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
        f.write("window.ART_SLOTS = ")
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    total = sum(len(c["states"]) for c in CHARACTERS) + len(SCENES) + len(EVIDENCE) + len(NEWS)
    print(f"generated {total} slots + manifest.json + manifest.js")


if __name__ == "__main__":
    main()
