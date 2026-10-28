// Round 3: take the space back, attach the video, wait for the editor form.
const task = await takeOverTaskSpace(3);
console.log("spaceId:", task.spaceId, "name:", task.name);

let page = null;
try {
  page = task.userPage();
} catch (error) {
  console.log("no user page:", error.message);
}
if (!page) page = task.page("p1");

console.log("url  :", await page.url());
console.log("title:", await page.title());

const info = await page.evaluate(() => ({
  fileInputs: document.querySelectorAll('input[type="file"]').length,
  hasTitle: Boolean(document.querySelector('input[placeholder*="标题"]')),
  text: document.body ? document.body.innerText.slice(0, 300) : "",
}));
console.log("state:", JSON.stringify(info));

if (info.fileInputs > 0 && !info.hasTitle) {
  const videoPath = "D:/Software/AI Video/out/fc27-intro.mp4";
  await page.setInputFiles('input[type="file"] >> nth=0', [videoPath]);
  console.log("file attached, waiting for editor ...");
}

await page
  .waitForFunction(
    () =>
      Boolean(
        document.querySelector('input[placeholder*="标题"]') ||
          document.querySelector(".video-title input"),
      ),
    undefined,
    { timeout: 180000 },
  )
  .catch((error) => console.log("wait for editor failed:", error.message));

await page.waitForTimeout(4000);

const state = await page.evaluate(() => {
  const text = document.body.innerText;
  const titleInput = document.querySelector('input[placeholder*="标题"]');
  return {
    url: location.href,
    titleValue: titleInput ? titleInput.value : null,
    uploadProgressText: (text.match(/\d+%/g) || []).slice(0, 5),
    hasCover: /上传封面|更换封面/.test(text),
    buttons: [...document.querySelectorAll("button")]
      .map((b) => (b.innerText || "").trim())
      .filter(Boolean)
      .slice(0, 30),
    bodyHead: text.slice(0, 1200),
  };
});
console.log(JSON.stringify(state, null, 2));
