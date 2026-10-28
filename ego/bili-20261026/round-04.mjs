// Round 4: fill the title and map the remaining form controls.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* no user page */
}
if (!page) page = task.page("p1");

const TITLE = "FC27 存档编辑器：中文 Web 界面，直接改球员能力值和转会";
await page.fill('input[placeholder*="标题"]', TITLE);
console.log("title filled");

const map = await page.evaluate(() => {
  const brief = (el) => ({
    tag: el.tagName,
    type: el.getAttribute("type") || "",
    ph: el.getAttribute("placeholder") || "",
    cls: String(el.className || "").slice(0, 70),
    txt: (el.innerText || el.value || "").trim().slice(0, 40),
  });
  return {
    inputs: [...document.querySelectorAll("input, textarea")].map(brief).slice(0, 30),
    editables: [...document.querySelectorAll('[contenteditable="true"]')].map(brief).slice(0, 10),
    sections: [...document.querySelectorAll('.form-item, .video-upload-item, [class*="form-item"]')]
      .map((el) => (el.innerText || "").split("\n")[0].trim())
      .filter(Boolean)
      .slice(0, 20),
  };
});
console.log(JSON.stringify(map, null, 2));
