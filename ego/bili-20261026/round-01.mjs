// Round 1: open the Bilibili upload page and report login state.
const task = await taskSpace("fc27-bili-upload");
console.log("spaceId:", task.spaceId, "name:", task.name);

const page = task.page("p1");
await page.goto("https://member.bilibili.com/platform/upload/video/frame", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(4000);

console.log("url  :", await page.url());
console.log("title:", await page.title());

const probe = await page.evaluate(() => {
  const text = document.body ? document.body.innerText.slice(0, 600) : "";
  return {
    hasLoginForm: Boolean(document.querySelector("#login-app, .login-wrap, .bili-login-card")),
    hasUploadInput: Boolean(document.querySelector('input[type="file"]')),
    fileInputs: document.querySelectorAll('input[type="file"]').length,
    bodyHead: text,
  };
});
console.log(JSON.stringify(probe, null, 2));
