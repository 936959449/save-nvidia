# 拯救英伟达 · Save NVIDIA

**v1.0** · 一款 Reigns-like 架空历史同人卡牌游戏。

黄仁勋“卸任”后，你成为董事会找来的临时 CEO，在资本、工程、客户、政界的四条线之间做 90 天试用期内的取舍。

> **这不是新闻。** 本作是虚构推演，与 NVIDIA Corporation 及任何现实人物、公司、事件无关，不构成新闻或投资建议。NVIDIA 及相关名称为其权利人所有。

## 在线游玩

- **游戏**：https://936959449.github.io/save-nvidia/
- **GitHub**：https://github.com/936959449/save-nvidia

首页只有一个「开始任期的第一天」按钮；点击后进入开场演出，首次游玩会看到「入职须知」。

## 玩法

- **操作**：按住卡面左右拖动，松手选择；桌面端也支持 `←` / `→` 与右侧按钮。
- **目标**：撑到第 90 天董事会表决——第一个里程碑；之后还能继续刷新任期。
- **四条线**：资本 / 工程 / 客户 / 政界。任一归零或爆表，任期立刻结束。
- **选择有代价**：每个选择都会推动参数，通常一边涨、一边跌，没有绝对正确的选项。
- **底牌**：现金储备、CUDA 生态、长期合约、政府订单，各能在对应线归零时救一次。
- **结局**：8 个标准结局 + 隐藏结局「他回来了」。
- **100 张卡、7 条弧线**：每局随机抽 4 条弧线，各自的起始与推进节奏不同；随机池按阶段与角色冷却抽取，危机在临界时优先出现。
- **新手引导**：首次进入的「入职须知」、首张卡操作提示、第一次选择后的四条线提示；游戏内右上角「玩法 ?」可随时重看。

## 目录结构

```
index.html                     GitHub Pages 入口 / 免责声明
robots.txt                     当前默认禁止搜索引擎索引
.nojekyll                      GitHub Pages 关闭 Jekyll
web/
  index.html                   网页视觉设定（内部参考）
  styles.css / app.js
  game/
    index.html                 游戏
    styles.css / game.js / data.js / asset-loader.js
    assets.html                美术资源清单（内部）
    assets/
      manifest.json / .js      资源清单
      characters|scenes|evidence|news/   45 个槽位（29 个正式 WebP + 16 个预留 SVG）
      tools/optimize_assets.py PNG → WebP 压缩脚本
拯救英伟达_玩法设计文档.md
research/
```

## 本地运行

直接双击根目录 `index.html`，或：

```bash
cd web/game
python -m http.server 8000
```

访问 `http://localhost:8000/`。无后端、无数据库；最佳任期与引导状态只保存在浏览器 `localStorage`。

## 部署

GitHub Pages 已启用：

- 仓库：`936959449/save-nvidia`
- Source：`main` / `/ (root)`
- 构建方式：Jekyll 关闭（`.nojekyll`）
- 站点：https://936959449.github.io/save-nvidia/

更新内容后提交到 `main`，Pages 会自动重新构建。也可以直接用 GitHub API 更新。

## 资源与性能

| 项目 | 大小 |
|---|---|
| 29 张源 PNG | **41.78 MB** |
| 29 张 WebP（页面实际加载） | **4.01 MB（约 9.6%）** |
| 16 个扩展预留槽位 | SVG 占位，约 0.1 MB |
| 首页首屏实际请求 | 约 0.6 MB |
| 开场期间后台预热角色素材 | 约 4 MB |
| 当前部署站点 | 约 5 MB |

- 加载器顺序：`webp → png → jpg → jpeg → svg`；PNG 为源文件/回退。
- 首屏仅加载当前可见的 3 张图；其余素材在开场播放时预热。
- 替换 PNG 后运行：
  ```bash
  python web/game/assets/tools/optimize_assets.py
  ```
  需要 Python + Pillow；脚本只重转缺失或比 PNG 新的 WebP。
- `.gitignore` 默认忽略 PNG 源文件与 `art-assets/` 工作目录；部署时只带 WebP。如需把 PNG 纳入版本库，删除对应 ignore 规则或改用 Git LFS。

## 合规与边界

以下为工程检查，不构成法律意见。

- **虚构标识**：入口、标题、开场、入职须知、新闻终端、报纸结局都标注 `ALT-HISTORY / 虚构推演 / FICTIONAL`，并写明“不是新闻”。
- **搜索误读**：`robots.txt` 与页面 `<meta name="robots" content="noindex,nofollow">` 默认禁止索引；如需公开宣发，再按需要调整。
- **不使用官方素材**：不使用 NVIDIA 官方 Logo、新闻照片或真实人物照片；绿色仅作配色氛围。
- **真实人物与名称**：黄仁勋、科莱特·克雷斯、哈维·琼斯等为剧情中的真实姓名/职位，事件、台词、结局均为虚构化演绎。公开传播或商业化前，建议按玩法文档 §10.3 使用化名，或做更强的虚构声明，避免被理解为真实报道。
- **美术权利**：当前美术为项目自带/生成素材，需自行确认生成工具条款、商用范围与真人相似度；上线前建议保留素材来源与授权记录。
- **非商业**：建议保持非商业同人作品；不要接广告、付费，或把页面包装成真实财经资讯。
- **隐私**：无分析脚本、无第三方追踪、无 Cookies；仅用 `localStorage` 保存最佳任期与引导状态。
- **GitHub Pages**：纯静态、无密钥、无后端注入面；站点上限 1 GB、月带宽软上限约 100 GB（[GitHub Pages limits](https://docs.github.com/zh/pages/getting-started-with-github-pages/github-pages-limits)）。当前部署体积远低于限制。

## License / rights

代码与文案目前未授予开源许可；如需允许复用代码，请单独添加 LICENSE。美术与剧情文本不自动随代码授权；NVIDIA 商标与相关名称归其权利人所有。
