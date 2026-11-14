# 美术槽位说明（asset slots）

本目录是原型全部已接入美术与可替换槽位的落点。每个槽位是一张固定画布；替换时放入同名 PNG，再运行优化脚本生成 WebP。

## 画布规格

| 组 | 尺寸 | 安全区 | 用途 | 状态 |
|---|---|---|---|---|
| 角色 characters | 1200 × 840（10:7） | 80 px | 卡片立绘、标题档案卡、人物档案 | neutral 平静 / pressured 施压 / pleased 满意 |
| 场景 scenes | 1600 × 900（16:9） | 80 px | 标题背景、事件空镜 | office / boardroom / gtc |
| 证据 evidence | 1200 × 800（3:2） | 60 px | 标题页「EVIDENCE 01 · 皮衣」 | jacket |
| 报纸 news | 800 × 600（4:3） | 40 px | 结局头版配图 | photo |

角色焦点在画布上方约 36% 处；卡片与档案卡会按 10:7 裁切显示，主体不要出安全区。

## 文件命名与格式

```
assets/characters/jones-neutral.png       ← PNG 源文件（可透明或带底）
assets/characters/jones-neutral.webp      ← 页面实际加载的压缩版
assets/scenes/office.png / .webp
assets/evidence/jacket.png / .webp
assets/news/photo.png / .webp
```

- 加载器顺序：`webp → png → jpg → jpeg → svg`，找到即用。
- 当前 29 个槽位均已接入正式美术并生成 WebP（总计约 **4 MB**，相比 42 MB PNG 约 **9.6%**）。
- PNG 保留为源文件与回退；页面优先请求 WebP；PNG 默认不提交（根目录 `.gitignore`）。
- 替换后请运行 `python tools/optimize_assets.py` 更新 WebP；脚本只重转缺失或比 PNG 旧的图，需要 Python + Pillow。
- `assets.html` 页面会显示每个槽位的实际文件、已替换状态和安全区预览。

## 表情语义

| state | 中文 | 用在什么时候 |
|---|---|---|
| neutral | 平静 | 卡片默认立绘 |
| pressured | 施压 | 选择让该角色/阵营受损时的反应 |
| pleased | 满意 | 选择让对方得利时的反应 |

三张只改眉眼、嘴角、肩线或手中道具，不要改构图、光位和画布留白，切换时才不跳。黄仁勋的三种素材分别是皮衣、信件、GTC 剪影（不出现正脸）。

## 风格方向

延续网页视觉方案 v0.2 的「印刷档案」：半调网点、套色错位、纸边剪裁、档案标签。当前接入的是电影感写实插画；替换时保持人物焦点、光位与安全区一致即可。

## 清单文件

- `manifest.json`：可读的槽位清单（工具用）。
- `manifest.js`：同一份数据，挂到 `window.ART_SLOTS`，原型与 `assets.html` 直接引用（file:// 下无需 fetch）。
- `tools/generate_placeholders.py`：重新生成全部 29 张占位 SVG 与两份 manifest。
- `tools/optimize_assets.py`：PNG → WebP 压缩脚本（默认质量 88）。

## 替换自检

1. 打开 `assets.html`，确认目标槽位显示“已替换”（右上统计 `已替换 n / 29`）。
2. 打开原型，按 `A` 进入坑位模式，确认虚线框与标签对齐、主体没有出安全区。
3. 连选几次，确认同一角色在平静/施压/满意之间切换时构图不跳。
4. 部署前确认页面请求的是 `.webp` 而不是 1–2 MB 的单张 `.png`。
5. PNG 默认不提交（根目录 `.gitignore`）；克隆后只有 WebP + 占位 SVG，替换素材需本地保留 PNG 源。
