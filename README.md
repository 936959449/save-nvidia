# 拯救英伟达 · Save NVIDIA

一款 **Reigns-like 架空历史同人卡牌游戏**的原型：黄仁勋“卸任”后，你成为董事会找来的临时 CEO，在资本、工程、客户、政界的四条线之间做 90 天试用期内的取舍。

> **这不是新闻。** 项目是虚构推演，与 NVIDIA Corporation 及任何现实人物、公司、事件无关，不构成新闻或投资建议。NVIDIA 及相关名称为其权利人所有。详见下方「合规与边界」。

## 入口

- 游戏原型（v0.1）：[`web/prototype/index.html`](web/prototype/index.html)
- 网页视觉方案（v0.2）：[`web/index.html`](web/index.html)
- 美术坑位清单：[`web/prototype/assets.html`](web/prototype/assets.html)
- 玩法设计文档：[`拯救英伟达_玩法设计文档.md`](拯救英伟达_玩法设计文档.md)

本地直接双击 [`index.html`](index.html) 开始，无需构建、无需启动服务。

## 目录结构

```
index.html                     GitHub Pages 入口 / 免责声明页
robots.txt                     默认禁止搜索引擎索引（避免被误读为新闻）
.nojekyll                      GitHub Pages 关闭 Jekyll
web/
  index.html                   网页视觉方案
  styles.css / app.js
  prototype/
    index.html                 可玩原型
    styles.css / game.js / data.js / asset-loader.js
    assets.html                美术坑位清单
    assets/
      manifest.json / .js      槽位清单
      characters|scenes|evidence|news/   29 个槽位的 WebP（页面实际加载）/ SVG 占位 / PNG 本地源
      tools/optimize_assets.py PNG → WebP 压缩脚本
      tools/generate_placeholders.py       生成占位图与清单
    preview-*.png              预览图（文档用）
拯救英伟达_玩法设计文档.md
research/                      新闻与机制调研
```

## 本地运行

- 直接双击根目录 `index.html`，或：
  - `cd web/prototype && python -m http.server 8000`，访问 `http://localhost:8000/`
- 无后端、无数据库；进度只写入浏览器 `localStorage`（最佳任期、新手引导是否看过）。

## 部署到 GitHub Pages

### 推荐：整仓库根目录部署

1. 新建 GitHub 仓库，将本目录推送到 `main`；
2. 仓库 **Settings → Pages → Build and deployment**：
   - Source 选择 **Deploy from a branch**
   - Branch 选择 **main**，目录选择 **`/ (root)`**，保存；
3. 等 Actions 完成，访问 `https://<你的用户名>.github.io/<仓库名>/`。

根目录的 `index.html` 是入口页，`web/` 下两个页面与资源按相对路径可直接访问；`.nojekyll` 已就位。

### 只部署游戏

如果只想发布游戏、不带视觉方案：

- 把 `web/prototype/` 的内容复制到一个独立的 `docs/` 或新仓库根目录；
- 注意 `../index.html`（返回视觉方案）会失效，可改成返回自己的入口；
- 仍保留 `assets/` 相对路径与 `.nojekyll`。

## 资源与性能

当前美术已接入，页面加载的是 **WebP**：

| 项目 | 大小 |
|---|---|
| 29 张源 PNG | **41.78 MB** |
| 29 张 WebP（页面实际加载） | **4.01 MB（约 9.6%）** |
| 首页首屏实际请求 | 约 0.6 MB（3 张图） |
| 开场播放时预热全部角色 | 约 4 MB |

- 加载器顺序：`webp → png → jpg → jpeg → svg`；PNG 保留为本地源与回退。
- 首屏只加载标题/档案卡/证据图；其余角色在开场播放时后台预热，避免挡住首屏。
- 替换 PNG 后运行：
  ```bash
  python web/prototype/assets/tools/optimize_assets.py
  ```
  脚本只重转缺失或比 PNG 新的 WebP。
- `.gitignore` 默认忽略 PNG 源文件与 `art-assets/` 工作目录；部署体积约 **9 MB**（含预览图；预览图不参与游戏加载）。如需把 PNG 也纳入版本库，删除对应 ignore 规则或改用 Git LFS。

## 新手引导

### 首次进入

`开始任期的第一天` → 开场演出（可跳过）→ **入职须知**（首次显示）→ 第一张卡：

1. **怎么操作**：拖动卡片，松手选择；桌面端也支持 `←` / `→` 和右侧按钮。
2. **你要做什么**：撑到第 90 天董事会表决——这是第一个里程碑，之后还能继续刷新任期。
3. **选择会改变四条线**：资本 / 工程 / 客户 / 政界，任一归零或爆表，任期立刻结束。

首次进入游戏还会出现一次操作提示条；做出第一次选择后提示“四条线已变化”。游戏内右上角「玩法 ?」可随时重开引导。

### 相关代码

- 引导结构：`web/prototype/index.html` 的 `#screen-guide`
- 引导显示/跳过/重复查看：`web/prototype/game.js` 的 `openGuide` / `closeGuide` / `hasSeenGuide`
- 首次提示：`showCoach` / `hideCoach`；首轮标记在 `localStorage` 的 `saveNvidia.guideSeen`

## 合规与边界

这不是法律意见；公开传播前建议按你的实际发行范围复核。

- **虚构标识**：入口页、标题页、开场演出、入职须知、新闻终端、报纸结局都标注了 `ALT-HISTORY / 虚构推演 / FICTIONAL`，并说明“不是新闻”。
- **搜索误读**：根目录 `robots.txt` 与页面 `<meta name="robots" content="noindex,nofollow">` 默认不允许索引；如果要做正式宣发，再按需要调整。
- **不使用官方素材**：页面不使用 NVIDIA 官方 Logo、新闻照片或真实人物照片；绿色仅作配色氛围，不复制官方标识。
- **真实人物与名称**：黄仁勋、科莱特·克雷斯、哈维·琼斯等为剧情中的真实姓名/职位；事件、台词、结局均为虚构化演绎。若公开传播或商业化，建议把 A 级真实人物改为化名或做更强的前置说明，避免被理解为真实报道或构成名誉风险。
- **美术权利**：当前 29 张美术来自项目自带素材/生成素材，需自行确认生成工具条款、商用范围与是否含真人相似度；上线前建议保留素材来源与授权记录。
- **不商业化**：建议保持非商业同人原型；不要接广告、付费或把页面包装成真实财经资讯。
- **隐私**：无分析脚本、无第三方追踪、无 Cookies；只用 `localStorage` 保存最佳任期与引导状态，不上传服务器。
- **GitHub Pages**：纯静态、无密钥、无后端注入面；站点上限 1 GB、月带宽软上限约 100 GB、构建软上限 10 次/小时（[GitHub Pages limits](https://docs.github.com/zh/pages/getting-started-with-github-pages/github-pages-limits)）。当前部署体积约 9 MB（含预览图），远低于限制。

如果你希望公开版更稳妥，我可以再加一轮：把真实人物改成化名、把“新闻终端”改成“推演终端”、在入口页加显眼的“虚构作品”首屏确认。

## 已知限制

- 平衡仅做首轮验证，未经过大规模数值测试。
- 无音效/配音；开场与引导为纯前端演出。
- 卡池为第一版（37 张）；叙事弧未覆盖全部设计文档章节。
- 预览图为桌面截图，移动端以实际页面为准。

## License / rights

代码与文案目前未授予开源许可。若公开仓库并希望他人复用代码，建议单独添加代码 LICENSE（如 MIT），美术与剧情文本不自动随代码授权；NVIDIA 商标与相关名称归其权利人所有。
