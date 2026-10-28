// Round 5: compact probe of the editor controls.
const task = await takeOverTaskSpace(3);
let page = null;
try {
  page = task.userPage();
} catch {
  /* ignore */
}
if (!page) page = task.page("p1");

const info = await page.evaluate(() => {
  const lines = [];
  const title = document.querySelector('input[placeholder*="标题"]');
  lines.push("TITLE=" + (title ? title.value : "NOT FOUND"));

  [...document.querySelectorAll("input, textarea")].forEach((el, i) => {
    if (el.type === "file") return;
    lines.push(
      `IN[${i}] type=${el.type} ph="${el.getAttribute("placeholder") || ""}" cls="${String(el.className).slice(0, 40)}" val="${(el.value || "").slice(0, 30)}"`,
    );
  });

  [...document.querySelectorAll('[contenteditable="true"]')].forEach((el, i) => {
    lines.push(`CE[${i}] cls="${String(el.className).slice(0, 50)}"`);
  });

  // category / declare pickers: look for elements showing the current value
  [...document.querySelectorAll("div, span, button")].forEach((el) => {
    const t = (el.innerText || "").trim();
    if (!t || t.length > 30) return;
    if (/科技数码|游戏|单机游戏|创作声明|自制|转载|封面|标签/.test(t) && el.children.length === 0) {
      lines.push(`PICK "${t}" tag=${el.tagName} cls="${String(el.className).slice(0, 50)}"`);
    }
  });

  return lines.slice(0, 60).join("\n");
});
console.log(info);
