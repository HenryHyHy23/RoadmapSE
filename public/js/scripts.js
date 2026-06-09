document.addEventListener("DOMContentLoaded", function () {
  const downloadBtn = document.getElementById("btn-download-dynamic");
  const timelineItems = document.querySelectorAll(".timeline-item");

  if (!downloadBtn || timelineItems.length === 0) {
    return;
  }

  function updateDownloadLink(item) {
    const fileLink = item.getAttribute("data-file");

    if (fileLink) {
      downloadBtn.setAttribute("href", fileLink);
      downloadBtn.classList.remove("disabled");
      downloadBtn.innerHTML =
        '<div class="d-inline-block bi bi-download me-2"></div> Download Material';
      return;
    }

    downloadBtn.setAttribute("href", "#");
    downloadBtn.classList.add("disabled");
    downloadBtn.innerHTML =
      '<div class="d-inline-block bi bi-x-circle me-2"></div> No Material';
  }

  timelineItems.forEach((item) => {
    item.addEventListener("click", function () {
      updateDownloadLink(this);
    });
  });

  const activeItem = document.querySelector(".timeline-item.active");
  if (activeItem) {
    updateDownloadLink(activeItem);
  }
});

let subjectsData = [];
const subjectContentCache = new Map();
let mathJaxLoader = null;

function buildLessonButtons(subject) {
  let html = "";

  (subject.subLessons || []).forEach((sub) => {
    if (sub.subLessons && sub.subLessons.length > 0) {
      html += `<div class="fw-bold mt-2 mb-1 text-primary small"><i class="bi ${sub.icon} me-2"></i>${sub.name}</div>`;
      sub.subLessons.forEach((child) => {
        html += `
                                <button class="btn btn-sub-lesson bg-white text-start btn-view-lesson ms-3 mb-1 border-light shadow-sm" 
                                        data-content-id="${subject.id}-${child.type}">
                                    <i class="bi ${child.icon || "bi-dot"} me-2"></i>${child.name}
                                </button>`;
      });
      return;
    }

    html += `
                            <button class="btn btn-sub-lesson bg-white text-start btn-view-lesson mb-1 shadow-sm" 
                                    data-content-id="${subject.id}-${sub.type}">
                                <i class="bi ${sub.icon} me-2"></i>${sub.name}
                            </button>`;
  });

  return html;
}

async function ensureSubjectContentLoaded(subjectId) {
  if (subjectContentCache.has(subjectId)) {
    return subjectContentCache.get(subjectId);
  }

  const response = await fetch(`/api/subjects/${subjectId}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Không tải được nội dung môn học");
  }

  subjectContentCache.set(subjectId, result.data);
  subjectsData = subjectsData.map((subject) =>
    subject.id === subjectId ? result.data : subject,
  );

  return result.data;
}

function lessonMayContainMath(content = "") {
  return /\\\(|\\\[|\\begin\{/.test(content);
}

function ensureMathJaxLoaded() {
  if (window.MathJax && window.MathJax.typesetPromise) {
    return Promise.resolve(window.MathJax);
  }

  if (mathJaxLoader) {
    return mathJaxLoader;
  }

  window.MathJax = {
    tex: {
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"]],
    },
  };

  mathJaxLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "MathJax-script";
    script.src =
      "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    script.onload = () => resolve(window.MathJax);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return mathJaxLoader;
}

async function loadSubjectsFromJSON() {
  const menuContainer = document.getElementById("v-pills-tab");
  const contentContainer = document.getElementById("v-pills-tabContent");

  if (!menuContainer || !contentContainer) {
    return;
  }

  try {
    const response = await fetch("/api/subjects");
    const result = await response.json();
    const data = result.data || [];
    const downloadBtn = document.getElementById("btn-download-dynamic");

    subjectsData = data;
    subjectContentCache.clear();
    menuContainer.innerHTML = "";
    contentContainer.innerHTML = "";

    data.forEach((subject, index) => {
      const isActive = index === 0 ? "active" : "";
      const isShowActive = index === 0 ? "show active" : "";
      const menuItem = document.createElement("a");

      menuItem.className = `timeline-item list-group-item-action ${isActive}`;
      menuItem.id = `tab-${subject.id}`;
      menuItem.setAttribute("data-bs-toggle", "pill");
      menuItem.setAttribute("data-bs-target", `#content-${subject.id}`);
      menuItem.setAttribute("data-file", subject.file || "");
      menuItem.setAttribute("role", "tab");

      menuItem.addEventListener("click", function () {
        if (downloadBtn) {
          downloadBtn.href = subject.file;
        }

        if (typeof loadFlashcards === "function") {
          loadFlashcards(subject.id, subject.code);
        }
      });

      menuItem.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content-mini">
                    <h5 class="fw-bolder mb-0">${subject.code}</h5>
                    <small class="text-muted">${subject.name}</small>
                </div>`;
      menuContainer.appendChild(menuItem);

      contentContainer.innerHTML += `
                <div class="tab-pane fade ${isShowActive}" id="content-${subject.id}" role="tabpanel">
                    <div class="d-flex align-items-center mb-3">
                        <span class="badge bg-gradient-primary-to-secondary me-3 p-2">${subject.code}</span>
                        <h2 class="fw-bolder mb-0 text-primary">${subject.name}</h2>
                    </div>
                    <p class="lead text-muted">${subject.desc}</p>
                    <hr>
                    <div class="mb-3">
                        <button class="btn btn-outline-orange w-100 d-flex justify-content-between align-items-center" 
                                type="button" data-bs-toggle="collapse" data-bs-target="#menu-${subject.id}">
                            <span><i class="bi bi-collection-play me-2"></i>Chọn nội dung học</span>
                            <i class="bi bi-chevron-down"></i>
                        </button>
                        <div class="collapse mt-2" id="menu-${subject.id}">
                            <div class="card card-body bg-light border-0"><div class="d-grid">${buildLessonButtons(subject)}</div></div>
                        </div>
                    </div>
                    <div class="alert alert-${subject.noteColor} border-start bg-opacity-10">
                        <strong><i class="bi ${subject.noteIcon} me-2"></i>Ghi chú:</strong>
                        <p class="mb-0 small">${subject.note}</p>
                    </div>
                </div>`;
    });

    if (data.length > 0) {
      if (downloadBtn) {
        downloadBtn.href = data[0].file;
      }

      if (typeof loadFlashcards === "function") {
        setTimeout(() => loadFlashcards(data[0].id, data[0].code), 150);
      }
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadSubjectsFromJSON);

function findLessonDeep(lessons, targetType) {
  for (const lesson of lessons) {
    if (lesson.type === targetType) return lesson;

    if (lesson.subLessons && lesson.subLessons.length > 0) {
      const found = findLessonDeep(lesson.subLessons, targetType);
      if (found) return found;
    }
  }
  return null;
}

document.addEventListener("click", async function (e) {
  const btn = e.target.closest(".btn-view-lesson");
  if (!btn) {
    return;
  }

  const contentId = btn.getAttribute("data-content-id");
  const dashIndex = contentId.indexOf("-");
  const subjectId = contentId.substring(0, dashIndex);
  const lessonType = contentId.substring(dashIndex + 1);

  try {
    const subject = await ensureSubjectContentLoaded(subjectId);
    const lesson = findLessonDeep(subject.subLessons || [], lessonType);

    if (!lesson) {
      return;
    }

    const contentContainer = document.getElementById("offcanvasContent");
    document.getElementById("offcanvasTitle").textContent = lesson.name;
    contentContainer.innerHTML = lesson.content || "<p>Chưa có nội dung.</p>";

    if (lessonMayContainMath(lesson.content)) {
      try {
        await ensureMathJaxLoaded();
        await window.MathJax.typesetPromise([contentContainer]);
      } catch (err) {
        console.error("MathJax error:", err.message);
      }
    }

    const offcanvasElement = document.getElementById("lessonOffcanvas");
    const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
    offcanvas.show();
  } catch (error) {
    console.error("Lỗi tải bài học:", error);
  }
});

window.addEventListener(
  "scroll",
  function () {
    const navbar = document.querySelector(".navbar");
    if (!navbar) {
      return;
    }

    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  },
  { passive: true },
);

function activateChallengeContent(contentId) {
  document
    .querySelectorAll(".timeline-node")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll("#challenge-tabContent .tab-pane")
    .forEach((el) => el.classList.remove("show", "active"));

  const node = document.querySelector(`[data-content-target="${contentId}"]`);
  const contentEl = document.getElementById(contentId);

  if (node) {
    node.classList.add("active");
  }

  if (!contentEl) {
    return;
  }

  contentEl.classList.add("show", "active");

  const image = contentEl.querySelector("img[data-src]");
  if (image && !image.getAttribute("src")) {
    image.setAttribute("src", image.dataset.src);
  }
}

async function loadChallengesFromJSON() {
  const tabContainer = document.getElementById("challenge-tab");
  const contentContainer = document.getElementById("challenge-tabContent");

  if (!tabContainer || !contentContainer) return;

  try {
    const response = await fetch("/api/challenges");
    const result = await response.json();
    const data = result;

    tabContainer.innerHTML = `
            <div class="timeline-container">
                <div class="timeline-wrapper">
                    <div class="timeline-line"></div>
                    <div id="nodes-render-area" class="d-flex w-100 justify-content-between"></div>
                </div>
            </div>
        `;

    const nodesArea = document.getElementById("nodes-render-area");
    contentContainer.innerHTML = "";

    data.forEach((item, index) => {
      const isActive = index === 0 ? "active" : "";
      const isShowActive = index === 0 ? "show active" : "";
      const contentId = `content-${item.id}`;
      const nodeItem = document.createElement("div");
      const quizCategory = item.category || "GEN";
      const imgUrl =
        item.image || `https://placehold.co/650x450?text=${item.code}`;

      nodeItem.className = `timeline-node ${isActive}`;
      nodeItem.dataset.contentTarget = contentId;
      nodeItem.onclick = function () {
        activateChallengeContent(contentId);
      };

      nodeItem.innerHTML = `
                <div class="node-card-wrapper">
                    <div class="card" style="width: 12rem;"> 
                        <img src="${imgUrl}" class="card-img-top" alt="${item.name}" style="height: 140px; object-fit: cover;" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" ${index === 0 ? 'fetchpriority="high"' : ""}>
                        <div class="card-body text-center">
                            <h6 class="card-title text-primary">${item.code}</h6>
                            <p class="card-text text-muted text-truncate" style="font-size: 0.8rem;">${item.name}</p>
                            
                        <button onclick="event.stopPropagation(); fetchQuestions('${quizCategory}')" 
                            class="btn btn-quiz-start btn-primary px-4 py-2 rounded-pill shadow-sm" style="font-weight: 600; min-width: 120px;">
                            Làm Quiz
                        </button>
                        </div>
                    </div>
                </div>
                <div class="node-circle"></div>
            `;
      nodesArea.appendChild(nodeItem);

      const mindmapImage =
        index === 0
          ? `<img src="${item.mindmap}" loading="eager" decoding="async" fetchpriority="high" alt="${item.name} mindmap">`
          : `<img data-src="${item.mindmap}" loading="lazy" decoding="async" alt="${item.name} mindmap">`;

      contentContainer.innerHTML += `
                <div class="tab-pane fade ${isShowActive}" id="${contentId}">
                    <div class="card shadow border-0 rounded-4 mt-5">
                        <div class="card-body p-5">
                            <span class="badge bg-primary bg-gradient-primary-to-secondary mb-3 px-3 py-2 rounded-pill">${item.code}</span>
                            <h2 class="fw-bolder mb-3">${item.name}</h2>
                            <p class="lead text-muted mb-4">Xem lại kiến thức môn học qua mindmap</p>
                            <hr>
                            ${mindmapImage}
                        </div>
                    </div>
                </div>
            `;
    });

    if (data.length > 0) {
      activateChallengeContent(`content-${data[0].id}`);
    }
  } catch (error) {
    console.error("Lỗi tải data JSON:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadChallengesFromJSON);

// === PHAN 6: QUIZ SYSTEM ===
const API_URL = "/api/quiz";

let questions = [];
let currentIdx = 0;
let score = 0;
let hasAnswered = false;
let userQuizHistory = [];
let currentCategory = "";

function getHighScore(category) {
  const scores = JSON.parse(
    localStorage.getItem("roadmap_high_scores") || "{}",
  );
  return scores[category] || 0;
}

function saveHighScore(category, newScore) {
  const scores = JSON.parse(
    localStorage.getItem("roadmap_high_scores") || "{}",
  );
  if (!scores[category] || newScore > scores[category]) {
    scores[category] = newScore;
    localStorage.setItem("roadmap_high_scores", JSON.stringify(scores));
  }
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchQuestions(categoryCode) {
  questions = [];
  currentIdx = 0;
  score = 0;
  userQuizHistory = [];
  currentCategory = categoryCode;

  const quizContentEl = document.getElementById("quiz-content");
  document.getElementById("subject-title").innerText = "Quiz: " + categoryCode;
  document.getElementById("quiz-modal").style.display = "flex";
  document.body.style.overflow = "hidden";

  const saved = loadQuizProgress(categoryCode);
  if (saved) {
    const resume = confirm(
      `Bạn đang làm dở Quiz ${categoryCode} ở câu ${saved.currentIdx + 1}. Tiếp tục không?`,
    );
    if (resume) {
      questions = saved.questions;
      currentIdx = saved.currentIdx;
      score = saved.score;
      userQuizHistory = saved.userQuizHistory;
      loadQuestion();
      return;
    }
    clearQuizProgress(categoryCode);
  }

  quizContentEl.innerHTML =
    '<div class="text-center mt-5"><div class="spinner-border text-primary"></div><p>Đang tải câu hỏi...</p></div>';

  try {
    const res = await fetch(`${API_URL}/${categoryCode}`);
    const rawData = await res.json();
    const questionsData = rawData.data || rawData;

    const allQuestions = questionsData.map((item) => ({
      id: item.id,
      text: item.question_text,
      options: [item.option_a, item.option_b, item.option_c, item.option_d],
      correct: item.correct_answer.trim().toUpperCase(),
      explanation: item.explanation,
    }));

    questions = shuffleArray(allQuestions).slice(0, 30);
    loadQuestion();
  } catch (error) {
    quizContentEl.innerHTML =
      '<h5 class="text-center text-danger mt-5">Lỗi kết nối Server!</h5>';
  }
}

function loadQuestion() {
  if (typeof resetQuizTimer === "function") resetQuizTimer();
  const q = questions[currentIdx];
  const labels = ["A", "B", "C", "D"];
  hasAnswered = false;

  const nextBtn = document.getElementById("next-btn");
  nextBtn.disabled = true;
  nextBtn.innerText =
    currentIdx === questions.length - 1 ? "Kết thúc" : "Tiếp theo";

  const optionsWithLabels = q.options.map((opt, idx) => ({
    text: opt,
    originalLabel: labels[idx],
  }));
  const shuffledOptions = shuffleArray(optionsWithLabels);
  q.shuffledCorrect =
    labels[shuffledOptions.findIndex((opt) => opt.originalLabel === q.correct)];
  q.displayOptions = shuffledOptions;

  document.getElementById("quiz-content").innerHTML = `
        <div class="question-text"><h4>Câu ${currentIdx + 1}/${questions.length}: ${q.text}</h4></div>
        <div id="options-container">
            ${shuffledOptions
              .map(
                (opt, i) => `
                <div class="option-btn" id="opt-${labels[i]}" onclick="selectAnswer('${labels[i]}')">
                    <span class="option-label">${labels[i]}</span><span class="option-text">${opt.text}</span>
                </div>`,
              )
              .join("")}
        </div>
        <div id="explanation" class="explanation-box" style="display:none">
            <strong>Giải thích:</strong> <span>${q.explanation || "Không có giải thích."}</span>
        </div>`;

  document.getElementById("question-status").innerText =
    `Tiến độ: ${currentIdx + 1}/${questions.length}`;
  if (typeof createQuizTimerUI === "function") {
    createQuizTimerUI();
    startQuizTimer();
  }
}

function closeQuiz() {
  if (questions.length > 0 && currentIdx < questions.length) {
    saveQuizProgress();
  }
  document.getElementById("quiz-modal").style.display = "none";
  document.body.style.overflow = "";
  questions = [];
  currentIdx = 0;
  score = 0;
  hasAnswered = false;
  userQuizHistory = [];
  const footer = document.querySelector(".quiz-footer");
  if (footer) footer.style.display = "";
}

function nextQuestion() {
  currentIdx++;
  if (currentIdx < questions.length) {
    saveQuizProgress();
    loadQuestion();
  } else {
    clearQuizProgress(currentCategory);
    showResult();
  }
}

function selectAnswer(userPick) {
  if (hasAnswered) return;
  hasAnswered = true;
  if (typeof pauseQuizTimer === "function") pauseQuizTimer();

  const q = questions[currentIdx];
  const userBtn = document.getElementById(`opt-${userPick}`);
  document.getElementById("next-btn").disabled = false;

  userQuizHistory.push({
    question: q.text,
    userPick,
    correctLabel: q.shuffledCorrect,
    isCorrect: userPick === q.shuffledCorrect,
    explanation: q.explanation,
    options: q.displayOptions,
  });

  if (userPick === q.shuffledCorrect) {
    userBtn.classList.add("correct");
    score++;
  } else {
    userBtn.classList.add("wrong");
    document
      .getElementById(`opt-${q.shuffledCorrect}`)
      .classList.add("correct");
    document.getElementById("explanation").style.display = "block";
  }
}

function saveQuizProgress() {
  if (questions.length === 0 || currentIdx >= questions.length) return;

  const allProgress = JSON.parse(
    localStorage.getItem("roadmap_quiz_progress") || "{}",
  );

  allProgress[currentCategory] = {
    category: currentCategory,
    questions,
    currentIdx,
    score,
    userQuizHistory,
    lastUpdated: Date.now(),
  };
  localStorage.setItem("roadmap_quiz_progress", JSON.stringify(allProgress));
}

function loadQuizProgress(categoryCode = null) {
  try {
    const allProgress = JSON.parse(
      localStorage.getItem("roadmap_quiz_progress") || "{}",
    );
    if (categoryCode) {
      return allProgress[categoryCode] || null;
    }
    return allProgress;
  } catch {
    return null;
  }
}

function clearQuizProgress(categoryCode) {
  const allProgress = JSON.parse(
    localStorage.getItem("roadmap_quiz_progress") || "{}",
  );
  if (categoryCode && allProgress[categoryCode]) {
    delete allProgress[categoryCode];
    localStorage.setItem("roadmap_quiz_progress", JSON.stringify(allProgress));
  }
}

window.addEventListener("beforeunload", function () {
  if (questions.length > 0 && currentIdx < questions.length) {
    saveQuizProgress();
  }
});

function showResult() {
  if (typeof stopQuizTimer === "function") stopQuizTimer();
  saveHighScore(currentCategory, score);

  const percent = Math.round((score / questions.length) * 100);
  const highScore = getHighScore(currentCategory);

  document.getElementById("quiz-content").innerHTML = `
        <div class="text-center mt-4">
            <h1 class="display-3 fw-bold ${percent >= 50 ? "text-success" : "text-danger"}">${score}/${questions.length}</h1>
            <p class="text-muted">Điểm cao nhất môn này: ${highScore}/${questions.length}</p>
            <div class="my-4">
                <button onclick="renderReviewMode()" class="btn btn-primary rounded-pill px-4 me-2">Xem lại câu sai</button>
                <button onclick="closeQuiz()" class="btn btn-outline-dark rounded-pill px-4">Đóng</button>
            </div>
        </div>`;
  document.querySelector(".quiz-footer").style.display = "none";
}

function renderReviewMode() {
  let reviewHTML = `<div class="review-container p-3" style="max-height: 60vh; overflow-y: auto;">
        <h5 class="mb-4 text-primary">Chi tiết bài làm:</h5>`;

  userQuizHistory.forEach((item, index) => {
    reviewHTML += `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-body">
                    <h6>Câu ${index + 1}: ${item.question}</h6>
                    <p class="small mb-1">Đáp án của bạn: <span class="${item.isCorrect ? "text-success fw-bold" : "text-danger fw-bold"}">${item.userPick}</span></p>
                    <p class="small mb-2 text-success">Đáp án đúng: <strong>${item.correctLabel}</strong></p>
                    <div class="p-2 bg-light rounded small"><strong>Giải thích:</strong> ${item.explanation || "Không có."}</div>
                </div>
            </div>`;
  });

  reviewHTML += `</div><div class="text-center mt-3"><button onclick="closeQuiz()" class="btn btn-dark rounded-pill px-5">Hoàn tất</button></div>`;
  document.getElementById("quiz-content").innerHTML = reviewHTML;
}

const FEEDBACK_URL = "/api/feedback";
const contactForm = document.getElementById("contactForm");

const patterns = {
  name: /^[\p{L}\s]{3,50}$/u,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
  message: /^[\s\S]{10,500}$/,
};

const errorMessages = {
  name: "Tên phải từ 3-50 ký tự chữ cái.",
  email: "Email không hợp lệ.",
  phone: "Số điện thoại không đúng định dạng VN.",
  message: "Tin nhắn cần dài từ 10-500 ký tự.",
};

function showError(input, message) {
  const feedbackDiv = input.parentElement.querySelector(".invalid-feedback");

  input.classList.add("is-invalid");
  input.classList.remove("is-valid");

  if (feedbackDiv) {
    feedbackDiv.textContent = message;
    feedbackDiv.style.display = "block";
  }
}

function showSuccess(input) {
  const feedbackDiv = input.parentElement.querySelector(".invalid-feedback");

  input.classList.remove("is-invalid");
  input.classList.add("is-valid");

  if (feedbackDiv) {
    feedbackDiv.style.display = "none";
  }
}

function validateField(input) {
  const value = input.value.trim();
  const fieldName = input.id;

  if (fieldName === "phone" && value === "") {
    input.classList.remove("is-invalid", "is-valid");
    return true;
  }

  if (input.hasAttribute("required") && value === "") {
    showError(input, "Trường này không được để trống.");
    return false;
  }

  if (patterns[fieldName]) {
    const isValid = patterns[fieldName].test(value);

    if (!isValid) {
      showError(input, errorMessages[fieldName]);
      return false;
    }
  }

  showSuccess(input);
  return true;
}

if (contactForm) {
  const inputs = contactForm.querySelectorAll("input, textarea");

  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this);
    });

    input.addEventListener("input", function () {
      if (this.classList.contains("is-invalid")) {
        const feedbackDiv =
          this.parentElement.querySelector(".invalid-feedback");
        if (feedbackDiv) {
          feedbackDiv.style.display = "none";
        }
        this.classList.remove("is-invalid");
      }
    });
  });

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let isFormValid = true;
    inputs.forEach((input) => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      e.stopPropagation();
      contactForm.classList.add("was-validated");

      const firstInvalid = contactForm.querySelector(".is-invalid");
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    const submitBtn = contactForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

      const data = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        message: document.getElementById("message").value.trim(),
      };

      const res = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const successAlert = document.createElement("div");
        successAlert.className = "alert alert-success form-alert mt-3";
        successAlert.innerHTML = `
                    <strong>Gửi thành công!</strong> Cảm ơn bạn đã kết nối với Cạp nha.
                `;
        submitBtn.parentElement.appendChild(successAlert);

        contactForm.reset();
        inputs.forEach((i) => i.classList.remove("is-valid", "is-invalid"));
        contactForm.classList.remove("was-validated");

        setTimeout(() => {
          successAlert.style.transition = "opacity 0.5s";
          successAlert.style.opacity = "0";
          setTimeout(() => successAlert.remove(), 500);
        }, 5000);
      } else {
        throw new Error("Lỗi Server");
      }
    } catch (err) {
      console.error(err);

      const errorAlert = document.createElement("div");
      errorAlert.className = "alert alert-danger form-alert mt-3";
      errorAlert.innerHTML = `
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Có lỗi xảy ra!</strong> Vui lòng thử lại sau.
            `;
      submitBtn.parentElement.appendChild(errorAlert);

      setTimeout(() => {
        errorAlert.style.transition = "opacity 0.5s";
        errorAlert.style.opacity = "0";
        setTimeout(() => errorAlert.remove(), 500);
      }, 5000);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const allSaved = loadQuizProgress();
  if (!allSaved || Object.keys(allSaved).length === 0) return;

  let mostRecent = null;
  for (const key in allSaved) {
    if (!mostRecent || allSaved[key].lastUpdated > mostRecent.lastUpdated) {
      mostRecent = allSaved[key];
    }
  }

  if (!mostRecent) return;
  const saved = mostRecent;

  const banner = document.createElement("div");
  banner.id = "resume-banner";
  banner.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        background: #fff; border-radius: 16px; padding: 16px 20px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15); max-width: 300px;
        border-left: 4px solid #f97316;
    `;
  banner.innerHTML = `
        <p class="mb-2 fw-bold">Quiz đang dở!</p>
        <p class="mb-3 text-muted small">Bạn đang làm <strong>${saved.category}</strong> - Câu ${saved.currentIdx + 1}/${saved.questions.length}</p>
        <div class="d-flex gap-2">
            <button onclick="resumeQuiz('${saved.category}')" class="btn btn-primary btn-sm rounded-pill px-3">Tiếp tục</button>
            <button onclick="dismissResume('${saved.category}')" class="btn btn-outline-secondary btn-sm rounded-pill px-3">Bỏ qua</button>
        </div>
    `;
  document.body.appendChild(banner);
});

function resumeQuiz(category) {
  const saved = loadQuizProgress(category);
  if (!saved) return;

  document.getElementById("resume-banner")?.remove();

  questions = saved.questions;
  currentIdx = saved.currentIdx;
  score = saved.score;
  userQuizHistory = saved.userQuizHistory;
  currentCategory = saved.category;

  document.getElementById("subject-title").innerText =
    "Quiz: " + saved.category;
  document.getElementById("quiz-modal").style.display = "flex";
  document.body.style.overflow = "hidden";

  const footer = document.querySelector(".quiz-footer");
  if (footer) footer.style.display = "";

  loadQuestion();
}

function dismissResume(category) {
  clearQuizProgress(category);
  document.getElementById("resume-banner")?.remove();
}
