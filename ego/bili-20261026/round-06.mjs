// Round 6: description, content declaration, tags.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

const DESC = [
  "一个 EA SPORTS FC 27 Squads 存档编辑器，中文 Web 界面，本地运行、不联网。",
  "主要功能：球员编辑（搜索球员，直接改总评、潜力、位置、能力值和身体数据）｜球队编辑（查看阵容，批量改球衣号码）｜快捷转会与精确转会（选两支球队，点一下完成转会，支持自由球员）｜国家队选拔（按国籍筛选，名单自动补满，男足 26 人 / 女足 23 人，号码一键分配）｜快捷功能（全员年龄调整、老将回巅峰、补齐缺失球员、添加缺失传奇）｜Excel 导出。",
  "安全性：所有修改先暂存在内存，确认后另存为新的 Squads 文件，原存档永远不会被覆盖，保存后自动重读校验。",
  "原创代码 Apache-2.0 开源。",
].join("\n");

// 1) description (Quill editor)
try {
  const editors = await page.evaluate(() =>
    [...document.querySelectorAll(".ql-editor")].map((el, i) => ({

      i,
      blank: el.classList.contains("ql-blank"),
      visible: el.offsetParent !== null,
    })),
  );
  console.log("editors:", JSON.stringify(editors));

  const target = editors.find((e) => e.visible && e.blank) || editors.find((e) => e.visible);
  if (target) {
    await page.click(`.ql-editor >> nth=${target.i}`);
    await page.keyboard.insertText(DESC);
    await page.waitForTimeout(500);
    const got = await page.evaluate(() => {
      const el = [...document.querySelectorAll(".ql-editor")].find((e) => e.innerText.trim().length > 10);
      return el ? el.innerText.trim().slice(0, 120) : "";
    });
    console.log("desc length in page:", got.length, "| head:", got.slice(0, 60));
  }
} catch (error) {
  console.log("desc failed:", error.message);
}

// 2) content declaration (required)
try {
  await page.click('input[placeholder="请选择符合您视频内容的创作声明"]');
  await page.waitForTimeout(600);
  await page.click('text="内容为自制：未经作者允许，禁止转载"');
  await page.waitForTimeout(500);
  const declared = await page.evaluate(() => {
    const el = document.querySelector('input[placeholder*="创作声明"]');
    return el ? el.value : "";
  });
  console.log("declaration:", JSON.stringify(declared));
} catch (error) {
  console.log("declaration failed:", error.message);
}

// 3) tags
const TAGS = ["FC27", "EA SPORTS FC", "存档编辑器", "足球游戏", "单机游戏", "修改器", "Python", "开源"];
try {
  const tagInput = 'input[placeholder="按回车键Enter创建标签"] >> nth=0';
  for (const tag of TAGS) {
    await page.fill(tagInput, tag);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
  }
  const tagsNow = await page.evaluate(() =>
    [...document.querySelectorAll('[class*="tag"]')]
      .map((el) => (el.innerText || "").trim())
      .filter((t) => t && t.length < 20)
      .slice(0, 20),
  );
  console.log("tags now:", JSON.stringify(tagsNow));
} catch (error) {
  console.log("tags failed:", error.message);
}

// 4) report category control candidates
const cat = await page.evaluate(() => {
  const hits = [];
  [...document.querySelectorAll("div, span, input")].forEach((el) => {
    const t = (el.innerText || el.value || "").trim();
    if (t === "科技数码" || t === "分区") {
      hits.push({ tag: el.tagName, cls: String(el.className).slice(0, 60), txt: t, kids: el.children.length });
    }
  });
  return hits.slice(0, 10);
});
console.log("category candidates:", JSON.stringify(cat, null, 2));
