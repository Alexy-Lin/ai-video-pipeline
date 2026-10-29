---
name: publish-video-cn
description: 用 Playwright + CDP 驱动一台独立 Edge，把视频发到国内三平台（B站投稿 / 小红书笔记 / 抖音），含各站上传入口、文件选择拦截、标题标签简介填法、封面设置（B站 4:3、小红书 3:4、抖音横竖双封面）、必填项与坑、发布后验证。当需要自动投稿/发笔记/发短视频，或排查平台发布卡住时使用。
metadata:
  version: "2.0.0"
  date: "2026-10-29"
---

# 国内三平台视频发布（Playwright + CDP · v2）

## 零、铁律

1. **最后的「发布 / 立即投稿 / 提交修改」按钮，必须用户明确批准（或用户自己点）才能执行。**
   自动化做到「填完、封面设好、停在发布按钮前」为止；包括「编辑已发布作品」里的 `提交修改`。
2. **不要在用户正在编辑的页面里导航。** 用户可能正在手动改封面/点发布，切页面会把他的操作弄丢。
   要用新标签页：`ctx.newPage()`。
3. 用户接管/操作浏览器期间不要抢控制权；等他明确说继续再动。
4. 每一步都打日志（`log()` 带时间戳）并截图核对，避免「看起来卡住」——这是 EP04 最大的时间浪费来源。

## 一、为什么换掉 ego（2026-10-29 EP04 实测）

ego 会把控制权交还用户、并有「任务结束」状态机。EP04 当晚连续三次卡住，全部是状态问题不是通信问题：

| 现象 | 真实原因 | 处理 |
| --- | --- | --- |
| `Control of this task space is with the user` | 用户点了控制条「接管」，ego 暂停所有浏览器命令 | 只能等用户明确说继续，再 `takeOverTaskSpace(id)` |
| `This task space is no longer assigned to the agent: its task has ended` | 任务被结束，`takeOver` 无效 | 只能 `claimTaskSpace(id)` 重新认领 |
| 浏览器两三分钟没动作 | 我在本地写下一个脚本，页面空等着 | 一个脚本里连续做完「上传 + 填表」，不要分步空等 |

结论：**发布类长流程用 Playwright 直连一台独立 Edge**，生命周期自己控，没有浮层遮挡、没有接管状态机。
ego 仍可用于只读浏览/调研。

## 二、环境搭建（一次性）

```powershell
# 1) 起一台独立 Edge（独立 user-data-dir，带 CDP 端口），进程独立于脚本，脚本退出浏览器还在
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$args=@("--remote-debugging-port=9333","--user-data-dir=C:\Users\Lin\ego-edge-your",
        "--no-first-run","--no-default-browser-check","--start-maximized",
        "https://member.bilibili.com/platform/upload/video/frame")
Start-Process -FilePath $edge -ArgumentList $args
Start-Sleep -Seconds 6
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:9333/json/version).Content
```

```js
// 2) 每轮脚本只做连接，不启动/关闭浏览器
import { chromium } from "playwright-core";           // 项目根 node_modules 里已有 1.49.1
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const ctx = browser.contexts()[0];
const page = (await Promise.all(ctx.pages().map(async (p) => ({ p, u: await p.url() }))))
  .find((x) => x.u.includes("member.bilibili.com"))?.p;   // 按 URL 找标签页，别用 pages()[0]
await page.bringToFront();
```

**登录态**：新 profile 首次要扫码（B站/小红书/抖音各一次），之后 profile 里一直有效。
不要试图从正在运行的 Edge 复制 Cookies——文件被独占锁（复制报「正由另一进程使用」），
`robocopy /B` 又需要「备份和还原文件」权限（报 `You do not have the Backup and Restore Files user rights`）。
把登录页 `bringToFront()` 打开给用户扫一眼，比绕这些坑快得多。

脚本统一放 `D:\Software\AI Video\scripts\pw-<site>-<step>.mjs`，用
`node scripts\pw-xx.mjs`（要边跑边看就 `run_in_background: true` + `job_output`）。

## 三、通用关键技巧

### 3.1 文件选择：CDP 拦截（B站必需）

`page.setInputFiles()` 对 **B 站无效**：input 存在、value 也写进去了，但 B 站的上传组件根本不触发，页面永远停在空上传页。
小红书 / 抖音用 `setInputFiles` 可以；B 站必须走真实文件选择框 + CDP 拦截：

```js
const client = await ctx.newCDPSession(page);
await client.send("Page.enable");
await client.send("Page.setInterceptFileChooserDialog", { enabled: true });

const chooserEvent = new Promise((resolve) => client.once("Page.fileChooserOpened", resolve));
await page.evaluate(() => document.querySelector(".upload-area").click()); // 或 page.mouse.click 到上传区
const ev = await chooserEvent;                       // { frameId, mode, backendNodeId }
await client.send("DOM.setFileInputFiles", { files: [VIDEO], backendNodeId: ev.backendNodeId });
```

注意：playwright-core 1.49 通过 `connectOverCDP` 连上的 Page **没有** `page.waitForFileChooser`（undefined），
只能用上面的 CDP 事件；`Page.fileChooserOpened` 必须**在点击之前**注册监听。

### 3.2 点不到元素时

- 元素在视口外时 `getBoundingClientRect()` 会给**负 y**（如 `y=-145`）。先 `el.scrollIntoView({block:"center"})`，等 400ms 再取 rect。
- 点之前用 `document.elementFromPoint(x, y)` 确认命中目标；被遮住时会返回遮罩层（例如 B站 `.upload-area` 挡住「上传视频」按钮）。
- 按钮常常是 `div/span` 不是 `button`（B 站封面「完成」、小红书「完成」都是 div）→ 按文字精确匹配 + 尺寸过滤取中心坐标，`page.mouse.click(x, y)`。
- 同一文案可能命中多个节点（嵌套 + 弹窗里的副本）→ `.first()` / 取 `.last()` / 用 `w>40` 这种尺寸过滤。
- 滚动/切 tab 后坐标会变，**同一个脚本里现算现点**，不要跨轮复用硬编码坐标（截图预览还会被缩放，别拿预览像素当坐标）。

### 3.3 等待条件

用可观测条件代替固定 sleep：`waitForSelector('input[placeholder="请输入稿件标题"]')`、`waitForFunction(() => /上传完成/.test(document.body.innerText))`。
B 站上传完成后会整页切到「发布视频」编辑页，等标题输入框出现即可。

## 四、B 站（member.bilibili.com）

1. 进 `https://member.bilibili.com/platform/upload/video/frame`，`innerText` 含「成为UP主的第 N 天」= 已登录。
2. 上传：见 3.1（`.upload-area` + 文件选择拦截）。4s 内出表单。
3. 填表（选择器均实测可用）：
   - 标题：`input[placeholder="请输入稿件标题"]`（上传后默认填成文件名，如 `ep04-v4`，要覆盖）
   - 标签：`input[placeholder*="回车"]` → **`.first()`**（页面里还有一个在「批量填写」弹窗里，直接 fill 会 strict mode violation），逐条 `fill` + `keyboard.press("Enter")`
     - 小心 B 站会**自动塞两个不相关标签**（EP04 出现了「舞蹈翻跳」「韩国女主播」）；填完检查 `.label-item-v2` 文字，鼠标 hover 到 chip 的关闭图标再点掉。
   - 简介：`.ql-editor` 先 `click` 再 `keyboard.insertText(DESC)`（多行用 `\n`）
   - 分区：默认会猜错（EP04 被猜成 `vlog`）。点分区下拉选「知识」；2026-10 实测只选一级不阻塞投稿。
   - 创作声明：默认「内容无需标注」即可。
4. 封面（必填，2026-10-29 打通）：B 站要 **4:3**（首页推荐用 4:3，个人空间是 16:9）。
   - 点 `.cover-empty-pill`（`.cover-empty` 才是可点区域，「添加封面」文字只是 label）→ 打开「封面制作」弹窗
   - 点弹窗底部 `上传封面`（文字精确匹配）→ 文件选择拦截（同上 CDP）→ 塞 `ep04-cover-43.png`
   - 弹窗里会同时预览 4:3 / 16:9 两个比例；满意后点右下 **`完成`**（div `.button.submit`，鼠标点坐标）
   - 成功后封面区缩略图变成设计图
5. 投稿前核对：封面缩略图、标题、分区、标签、简介都在；**把「立即投稿」留给用户点**（EP04 就是用户自己点的）。
6. 投稿后验证：`https://member.bilibili.com/platform/upload-manager/article`
   → 列表第一条出现新稿件（时长/标题/时间戳），`已发布` 计数 +1。

## 五、小红书（creator.xiaohongshu.com）

1. 进 `https://creator.xiaohongshu.com/publish/publish?source=official`，右上出现账号名 = 已登录；
   否则会跳 `/login`（只有短信登录入口，让用户自己登）。
2. 上传：`page.setInputFiles('input[type="file"]', [VIDEO])` 直接可用；等标题输入框出现。
3. 填表：标题 `input[placeholder*="填写标题"]`（**≤20 字**）；正文 `.tiptap, .ProseMirror` 里 `click` + `keyboard.insertText`，
   话题直接写在正文里（`#Excel #Excel技巧 …`）。输入 `#` 会弹话题联想框，填完按 `Escape` 关掉。
4. 封面（3:4 竖版）：
   - hover `.cover-plugin-preview` → 出现 `编辑封面`（`.cover-edit-entry`）→ 点它（JS click 不触发，用 `page.mouse.click` 坐标）
   - 「设置封面」弹窗里：先点左侧 **`裁剪`**，再点 **比例 `3:4`**（默认是 4:3，必须手动切；这是 EP04 的坑：不切就是 4:3 框，图被放大截掉标题）
   - 上传：弹窗底部 `+ 上传` tile → 文件选择拦截 → 塞 `ep04-cover-34.png`
   - 点右下红色 `完成` → 回到表单，出现「封面效果评估通过」
5. 发布按钮（底部固定条）留给用户点。发布后验证：左侧「笔记管理」。

## 六、抖音（creator.douyin.com）

1. 进 `https://creator.douyin.com/creator-micro/content/upload`；未登录会停在扫码页，`bringToFront()` 让用户扫。
2. 上传：点上传区后再 `page.setInputFiles('input[type="file"]', [VIDEO])`（EP04 实测可用；文件选择拦截这里反而没事件）。
3. 填表：标题 `input[placeholder*="作品标题"]`（**≤30 字**）；描述 `div.zone-container` 里 click + `insertText`，话题直接写进描述。
4. 封面 **横竖两张都要**：
   - `选择封面` → 打开「设置封面」编辑器（顶部 tab：设置横封面 / 设置竖封面）
   - 点 `上传封面`（文字精确匹配，坐标约在弹窗中间）→ 文件选择拦截 → 塞 `ep04-cover-43.png`（横 4:3）
   - 点右下黑底 **`设置竖封面`** 按钮 → 进入竖封面 tab → 再点 `上传封面` → 塞 `ep04-cover-34.png`（竖 3:4）
   - 主按钮变成黑底 **`完成`**（`.semi-button.semi-button-primary`）→ 点它
   - 判成功看两处：封面区出现 `横封面4:3` + `竖封面3:4` 两张缩略图；右侧「发文助手」变成「封面检测通过」。
     `设置封面 *(必填)` 的星号设好了也不会消失，别用它判断。
5. 发布按钮（底部固定条，滚到底才在视口内）留给用户点；发布后验证 `content/manage` 的 `作品 (N)` +1。

## 七、EP04 实际用的文案（模板）

```text
标题：预测工作表，一图帮你看未来
简介/描述：
选中 24 个月销售数据，数据 → 预测工作表 → 点创建，Excel 自动补出未来 6 个月的预测曲线和 95% 置信区间，不用写公式。
Excel 2016 及以后版本自带这个入口（「数据」选项卡里）；WPS 暂无同名功能。
每天一个 Excel 小技巧。

B站标签：Excel技巧 / Excel教程 / 预测工作表 / 办公软件 / 数据分析
小红书话题：#Excel #Excel技巧 #办公软件 #数据分析 #职场技能
```

## 八、交付前检查清单

- [ ] 发布/提交修改按钮没被我点（用户批准或用户自己点）
- [ ] 视频、标题、简介/描述、标签/话题、封面全部到位（抽 `innerText` + 截图核对）
- [ ] B 站：封面是 4:3 且缩略图已是设计图；标签里没有平台自动塞的无关词
- [ ] 小红书：封面裁剪比例切到 3:4（默认 4:3 会截掉标题）
- [ ] 抖音：横/竖两张封面都在，发文助手「封面检测通过」
- [ ] 发布后到各平台内容管理页确认稿件存在，把时间/计数报给用户
- [ ] 发布后 1–2 分钟列表缩略图可能还是视频帧（还在转码），不要立刻判断封面失败

## 九、遗留注意

- 用户可能随时接管浏览器手工调整，脚本再用 `page.goto()` 会打断他 → 先问，或新开标签页。
- 小红书封面编辑器有已知 bug：上传后画布会放大到 100%+ 看不清全图，点「裁剪 → 3:4」就恢复正常。
- 抖音封面检测偶发 toast「啊哦，服务器打瞌睡了」，不阻塞。
- 后台任务列表里的「进行中」可能只是历史录音服务（如 EP04 的 `recorder-ep04.py` 占 8798 端口），与新命令无关；
  真卡住时先 `job_list` / `Get-CimInstance Win32_Process` 查进程，别急着重新跑。
