const LOCAL_BASE_URL = process.env.ARTILLERY_TARGET || "http://127.0.0.1:3000";
const REMOTE_APP_ORIGIN = "https://roadmapse.onrender.com";

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function openPage(page, path) {
  await page.context().clearCookies();

  // Reset state mỗi VU và đổi các request hard-code remote về local app.
  await page.addInitScript((localBase, remoteOrigin) => {
    localStorage.clear();
    sessionStorage.clear();
    window.confirm = () => false;

    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);

      if (url.startsWith(remoteOrigin)) {
        const newUrl = url.replace(remoteOrigin, localBase);
        if (typeof input === "string") {
          return originalFetch(newUrl, init);
        }
        return originalFetch(new Request(newUrl, input), init);
      }

      return originalFetch(input, init);
    };
  }, LOCAL_BASE_URL, REMOTE_APP_ORIGIN);

  await page.goto(path, { waitUntil: "networkidle" });
}

async function learnFlow(page) {
  // Flow học tập: vào trang, chọn môn, mở lesson đầu tiên, thử qua flashcard.
  await openPage(page, "/learn");

  await page.waitForSelector("#v-pills-tab .timeline-item");
  await page.locator("#v-pills-tab .timeline-item").first().click();

  const openMenuButton = page.locator('[data-bs-target^="#menu-"]').first();
  if (await openMenuButton.count()) {
    await openMenuButton.click();
  }

  const lessonButton = page.locator(".btn-view-lesson").first();
  if (await lessonButton.count()) {
    await lessonButton.scrollIntoViewIfNeeded();
    await lessonButton.click();
    await page.waitForSelector("#lessonOffcanvas.show");
  }

  const flashcardNextButton = page
    .locator("#flashcard-container button")
    .last();
  if (await flashcardNextButton.count()) {
    await flashcardNextButton.click().catch(() => {});
  }
}

async function challengeFlow(page) {
  // Flow challenge: vào trang, mở quiz đầu tiên, chọn 1 đáp án và bấm next.
  await openPage(page, "/challenge");

  await page.waitForSelector(".btn-quiz-start");
  const quizButton = page.locator(".btn-quiz-start").first();
  await quizButton.scrollIntoViewIfNeeded();
  await quizButton.click();

  await page.waitForSelector("#quiz-modal .option-btn");
  await page.locator(".option-btn").first().click();
  await page
    .locator("#next-btn")
    .click()
    .catch(() => {});
}

async function contactFlow(page) {
  // Flow contact: điền form hợp lệ và kiểm tra có alert phản hồi sau submit.
  await openPage(page, "/contact");

  const suffix = uniqueSuffix();

  await page.fill("#name", "Artillery Tester");
  await page.fill("#email", `artillery-${suffix}@example.com`);
  await page.fill("#phone", "0912345678");
  await page.fill("#message", `Smoke test feedback ${suffix}`);
  await page.click("button[type='submit']");

  await page.waitForSelector(
    ".form-alert.alert-success, .form-alert.alert-danger",
  );
}

module.exports = {
  learnFlow,
  challengeFlow,
  contactFlow,
};
