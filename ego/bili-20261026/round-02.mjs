// Round 2: attach the video file and wait for the editor form to appear.
const task = await taskSpace("fc27-bili-upload");
const page = task.page("p1");

const inputs = await page.evaluate(() =>
  [...document.querySelectorAll('input[type="file"]')].map((el) => ({
    accept: el.accept,
    multiple: el.multiple,
    hidden: el.offsetParent === null,
    cls: el.className,
    name: el.name,
  })),
);
console.log("file inputs:", JSON.stringify(inputs, null, 2));

const videoPath = "D:/Software/AI Video/out/fc27-intro.mp4";
await page.setInputFiles('input[type="file"] >> nth=0', [videoPath]);
console.log("file attached, waiting for the editor ...");

// the editor appears once the upload starts: wait for a title field
await page
  .waitForFunction(
    () =>
      Boolean(
        document.querySelector('input[placeholder*="标题"]') ||
          document.querySelector(".video-title input") ||
          document.querySelector('input[class*="title"]'),
      ),
    undefined,
    { timeout: 180000 },
  )
  .catch((error) => console.log("waitForFunction failed:", error.message));

await page.waitForTimeout(3000);

const state = await page.evaluate(() => {
  const text = document.body.innerText.slice(0, 1500);
  const titleInput = document.querySelector('input[placeholder*="标题"]');
  return {
    url: location.href,
    titleValue: titleInput ? titleInput.value : null,
    hasCoverUpload: /上传封面|更换封面|封面/.test(text),
    buttons: [...document.querySelectorAll("button")]
      .map((b) => (b.innerText || "").trim())
      .filter(Boolean)
      .slice(0, 40),
    bodyHead: text,
  };
});
console.log(JSON.stringify(state, null, 2));
