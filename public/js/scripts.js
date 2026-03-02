document.addEventListener("DOMContentLoaded", function() {
    // === PHẦN 1: DOWNLOAD BUTTON  ===
    const downloadBtn = document.getElementById('btn-download-dynamic');
    const timelineItems = document.querySelectorAll('.timeline-item');

    if (downloadBtn && timelineItems.length > 0) {
        function updateDownloadLink(item) {
            const fileLink = item.getAttribute('data-file');
            
            if (fileLink) {
                downloadBtn.setAttribute('href', fileLink);
                downloadBtn.classList.remove('disabled');
                downloadBtn.innerHTML = '<div class="d-inline-block bi bi-download me-2"></div> Download Material';
            } else {
                downloadBtn.setAttribute('href', '#');
                downloadBtn.classList.add('disabled');
                downloadBtn.innerHTML = '<div class="d-inline-block bi bi-x-circle me-2"></div> No Material';
            }
        }

        timelineItems.forEach(item => {
            item.addEventListener('click', function() { 
                updateDownloadLink(this);
            });
        });

        const activeItem = document.querySelector('.timeline-item.active');
        if (activeItem) {
            updateDownloadLink(activeItem);
        }
    }
});

let subjectsData = [];

// === PHẦN 2: LOAD SUBJECTS ===
async function loadSubjectsFromJSON() {
    const menuContainer = document.getElementById('v-pills-tab');
    const contentContainer = document.getElementById('v-pills-tabContent');
    
    
    if (!menuContainer || !contentContainer) {
        return; 
    }

    try {
        const response = await fetch('/api/subjects');
        const result = await response.json();
        const data = result.data;
        subjectsData = data;
        const downloadBtn = document.getElementById('btn-download-dynamic');
        
        menuContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        data.forEach((subject, index) => {
            const isActive = index === 0 ? 'active' : '';
            const menuItem = document.createElement('a');
            menuItem.className = `timeline-item list-group-item-action ${isActive}`;
            menuItem.id = `tab-${subject.id}`;
            menuItem.setAttribute('data-bs-toggle', 'pill');
            menuItem.setAttribute('data-bs-target', `#content-${subject.id}`);
            menuItem.setAttribute('role', 'tab');
            if (downloadBtn) {
                menuItem.onclick = () => { downloadBtn.href = subject.file; };
            }
            menuItem.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content-mini">
                    <h5 class="fw-bolder mb-0">${subject.code}</h5>
                    <small class="text-muted">${subject.name}</small>
                </div>`;
            menuContainer.appendChild(menuItem);

            let subButtonsHTML = '';
            if (subject.subLessons) {
                subject.subLessons.forEach(sub => {
                    if (sub.subLessons && sub.subLessons.length > 0) {
                        subButtonsHTML += `<div class="fw-bold mt-2 mb-1 text-primary small"><i class="bi ${sub.icon} me-2"></i>${sub.name}</div>`;
                        sub.subLessons.forEach(child => {
                            subButtonsHTML += `
                                <button class="btn btn-sub-lesson bg-white text-start btn-view-lesson ms-3 mb-1 border-light shadow-sm" 
                                        data-content-id="${subject.id}-${child.type}">
                                    <i class="bi ${child.icon || 'bi-dot'} me-2"></i>${child.name}
                                </button>`;
                        });
                    } else {
                        subButtonsHTML += `
                            <button class="btn btn-sub-lesson bg-white text-start btn-view-lesson mb-1 shadow-sm" 
                                    data-content-id="${subject.id}-${sub.type}">
                                <i class="bi ${sub.icon} me-2"></i>${sub.name}
                            </button>`;
                    }
                });
            }

            const isShowActive = index === 0 ? 'show active' : '';
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
                            <div class="card card-body bg-light border-0"><div class="d-grid">${subButtonsHTML}</div></div>
                        </div>
                    </div>
                    <div class="alert alert-${subject.noteColor} border-start bg-opacity-10">
                        <strong><i class="bi ${subject.noteIcon} me-2"></i>Ghi chú:</strong>
                        <p class="mb-0 small">${subject.note}</p>
                    </div>
                </div>`;
        });
        if(data.length > 0 && downloadBtn) downloadBtn.href = data[0].file;
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadSubjectsFromJSON);


// === PHẦN 3: TÌM KIẾM BÀI HỌC ===
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

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-view-lesson');
    if (btn) {
        const contentId = btn.getAttribute('data-content-id');
        const [subjectId, lessonType] = contentId.split('-');
        
        const subject = subjectsData.find(s => s.id === subjectId);
        
        if (subject && subject.subLessons) {
            const lesson = findLessonDeep(subject.subLessons, lessonType);
            
            if (lesson) {
                // Đổ dữ liệu vào Offcanvas
                const contentContainer = document.getElementById('offcanvasContent');
                document.getElementById('offcanvasTitle').textContent = lesson.name;
                contentContainer.innerHTML = lesson.content;
                
                // Gọi MathJax để render lại công thức toán học
                // Chúng ta đợi nội dung HTML được nạp xong rồi mới ra lệnh render
                if (window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise([contentContainer]).catch(function (err) {
                        console.error('MathJax error:', err.message);
                    });
                }
                
                // Hiển thị Offcanvas
                const offcanvasElement = document.getElementById('lessonOffcanvas');
                const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
                offcanvas.show();
            }
        }
    }
});

// === PHẦN 4: NAVBAR SCROLL ===
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// === PHẦN 5: LOAD CHALLENGES ===
async function loadChallengesFromJSON() {
    const tabContainer = document.getElementById('challenge-tab');
    const contentContainer = document.getElementById('challenge-tabContent');

    if (!tabContainer || !contentContainer) return; 

    try {
        const response = await fetch('/api/challenges');
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

        const nodesArea = document.getElementById('nodes-render-area');
        contentContainer.innerHTML = '';

        data.forEach((item, index) => {
            const isActive = index === 0 ? 'active' : '';
            const isShowActive = index === 0 ? 'show active' : '';

            const nodeItem = document.createElement('div');
            nodeItem.className = `timeline-node ${isActive}`;

            nodeItem.onclick = function() {
                document.querySelectorAll('.timeline-node').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('show', 'active'));
                this.classList.add('active');
                const contentEl = document.getElementById(`content-${item.id}`);
                if (contentEl) contentEl.classList.add('show', 'active');
            };

            const quizCategory = item.category || 'GEN';
            const imgUrl = item.image || `https://placehold.co/650x450?text=${item.code}`;

            nodeItem.innerHTML = `
                <div class="node-card-wrapper">
                    <div class="card" style="width: 12rem;"> 
                        <img src="${imgUrl}" class="card-img-top" alt="${item.name}" style="height: 140px; object-fit: cover;">
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

            const contentItem = `
                <div class="tab-pane fade ${isShowActive}" id="content-${item.id}">
                    <div class="card shadow border-0 rounded-4 mt-5">
                        <div class="card-body p-5">
                            <span class="badge bg-primary bg-gradient-primary-to-secondary mb-3 px-3 py-2 rounded-pill">${item.code}</span>
                            <h2 class="fw-bolder mb-3">${item.name}</h2>
                            <p class="lead text-muted mb-4">Xem lại kiến thức môn học qua mindmap</p>
                            <hr>
                            <img src="${item.mindmap}"> 
                        </div>
                    </div>
                </div>
            `;
            contentContainer.innerHTML += contentItem;
        });

    } catch (error) {
        console.error('Lỗi tải data JSON:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadChallengesFromJSON);

// === PHẦN 6: QUIZ SYSTEM ===
const API_URL = "https://roadmapse.onrender.com/api/quiz"; 

let questions = [];     
let currentIdx = 0;     
let score = 0;          
let hasAnswered = false;
let userQuizHistory = []; 
let currentCategory = ""; 

// Hàm lấy điểm cao nhất từ localStorage
function getHighScore(category) {
    const scores = JSON.parse(localStorage.getItem('roadmap_high_scores') || '{}');
    return scores[category] || 0;
}

// Hàm lưu điểm cao nhất
function saveHighScore(category, newScore) {
    const scores = JSON.parse(localStorage.getItem('roadmap_high_scores') || '{}');
    if (!scores[category] || newScore > scores[category]) {
        scores[category] = newScore;
        localStorage.setItem('roadmap_high_scores', JSON.stringify(scores));
    }
}

async function fetchQuestions(categoryCode) {
    questions = []; currentIdx = 0; score = 0; userQuizHistory = [];
    currentCategory = categoryCode;

    const quizContentEl = document.getElementById('quiz-content');
    document.getElementById('subject-title').innerText = "Quiz: " + categoryCode;
    document.getElementById('quiz-modal').style.display = 'flex';
    quizContentEl.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary"></div><p>Đang tải câu hỏi...</p></div>';
    document.body.style.overflow = 'hidden'; 

    try {
        const res = await fetch(`${API_URL}/${categoryCode}`);
        const rawData = await res.json();
        const questionsData = rawData.data || rawData; 

        // TRỘN VÀ LẤY TỐI ĐA 30 CÂU
        let allQuestions = questionsData.map(item => ({
            id: item.id,
            text: item.question_text,
            options: [item.option_a, item.option_b, item.option_c, item.option_d],
            correct: item.correct_answer.trim().toUpperCase(),
            explanation: item.explanation
        }));

        questions = shuffleArray(allQuestions).slice(0, 30); 
        loadQuestion(); 
    } catch (error) { 
        quizContentEl.innerHTML = '<h5 class="text-center text-danger mt-5">Lỗi kết nối Server!</h5>'; 
    }
}

function loadQuestion() {
    if (typeof resetQuizTimer === 'function') resetQuizTimer();
    const q = questions[currentIdx];
    const labels = ['A', 'B', 'C', 'D'];
    hasAnswered = false;
    
    const nextBtn = document.getElementById('next-btn');
    nextBtn.disabled = true;
    nextBtn.innerText = (currentIdx === questions.length - 1) ? 'Kết thúc' : 'Tiếp theo';

    // Shuffle đáp án
    const optionsWithLabels = q.options.map((opt, idx) => ({ text: opt, originalLabel: labels[idx] }));
    const shuffledOptions = shuffleArray(optionsWithLabels);
    q.shuffledCorrect = labels[shuffledOptions.findIndex(opt => opt.originalLabel === q.correct)];
    q.displayOptions = shuffledOptions; // Lưu lại để review

    document.getElementById('quiz-content').innerHTML = `
        <div class="question-text"><h4>Câu ${currentIdx + 1}/${questions.length}: ${q.text}</h4></div>
        <div id="options-container">
            ${shuffledOptions.map((opt, i) => `
                <div class="option-btn" id="opt-${labels[i]}" onclick="selectAnswer('${labels[i]}')">
                    <span class="option-label">${labels[i]}</span><span class="option-text">${opt.text}</span>
                </div>`).join('')}
        </div>
        <div id="explanation" class="explanation-box" style="display:none">
            <strong>💡 Giải thích:</strong> <span>${q.explanation || 'Không có giải thích.'}</span>
        </div>`;
    
    document.getElementById('question-status').innerText = `Tiến độ: ${currentIdx + 1}/${questions.length}`;
    if (typeof createQuizTimerUI === 'function') {
        createQuizTimerUI();
        startQuizTimer();
    }
}

function selectAnswer(userPick) {
    if (hasAnswered) return;
    hasAnswered = true;
    if (typeof pauseQuizTimer === 'function') pauseQuizTimer();

    const q = questions[currentIdx];
    const userBtn = document.getElementById(`opt-${userPick}`);
    document.getElementById('next-btn').disabled = false;

    // Lưu lịch sử
    userQuizHistory.push({
        question: q.text,
        userPick: userPick,
        correctLabel: q.shuffledCorrect,
        isCorrect: userPick === q.shuffledCorrect,
        explanation: q.explanation,
        options: q.displayOptions
    });

    if (userPick === q.shuffledCorrect) {
        userBtn.classList.add('correct'); score++;
    } else {
        userBtn.classList.add('wrong');
        document.getElementById(`opt-${q.shuffledCorrect}`).classList.add('correct');
        document.getElementById('explanation').style.display = 'block';
    }
}

function showResult() {
    if (typeof stopQuizTimer === 'function') stopQuizTimer();
    saveHighScore(currentCategory, score); // Lưu điểm cao nhất
    
    const percent = Math.round((score / questions.length) * 100);
    const highScore = getHighScore(currentCategory);

    document.getElementById('quiz-content').innerHTML = `
        <div class="text-center mt-4">
            <h1 class="display-3 fw-bold ${percent >= 50 ? 'text-success' : 'text-danger'}">${score}/${questions.length}</h1>
            <p class="text-muted">Điểm cao nhất môn này: ${highScore}/${questions.length}</p>
            <div class="my-4">
                <button onclick="renderReviewMode()" class="btn btn-primary rounded-pill px-4 me-2">Xem lại câu sai</button>
                <button onclick="closeQuiz()" class="btn btn-outline-dark rounded-pill px-4">Đóng</button>
            </div>
        </div>`;
    document.querySelector('.quiz-footer').style.display = 'none';
}

// Hàm hiển thị chế độ Review
function renderReviewMode() {
    let reviewHTML = `<div class="review-container p-3" style="max-height: 60vh; overflow-y: auto;">
        <h5 class="mb-4 text-primary">Chi tiết bài làm:</h5>`;
    
    userQuizHistory.forEach((item, index) => {
        reviewHTML += `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-body">
                    <h6>Câu ${index + 1}: ${item.question}</h6>
                    <p class="small mb-1">Đáp án của bạn: <span class="${item.isCorrect ? 'text-success fw-bold' : 'text-danger fw-bold'}">${item.userPick}</span></p>
                    <p class="small mb-2 text-success">Đáp án đúng: <strong>${item.correctLabel}</strong></p>
                    <div class="p-2 bg-light rounded small"><strong>💡 Giải thích:</strong> ${item.explanation || 'Không có.'}</div>
                </div>
            </div>`;
    });
    
    reviewHTML += `</div><div class="text-center mt-3"><button onclick="closeQuiz()" class="btn btn-dark rounded-pill px-5">Hoàn tất</button></div>`;
    document.getElementById('quiz-content').innerHTML = reviewHTML;
}

// === PHẦN 7: CONTACT FORM ===
const FEEDBACK_URL = "https://roadmapse.onrender.com/feedback";
const contactForm = document.getElementById("contactForm");

const patterns = {
    name: /^[\p{L}\s]{3,50}$/u,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
    message: /^[\s\S]{10,500}$/
};

// Thông báo lỗi tương ứng
const errorMessages = {
    name: "Tên phải từ 3-50 ký tự chữ cái (không bao gồm số).",
    email: "Email không hợp lệ.",
    phone: "Số điện thoại không đúng định dạng VN.",
    message: "Tin nhắn cần dài từ 10-500 ký tự."
};

function showError(input, message) {
    const feedbackDiv = input.parentElement.querySelector('.invalid-feedback');
    
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    
    if (feedbackDiv) {
        feedbackDiv.textContent = message;
        feedbackDiv.style.display = 'block';
    }
}

function showSuccess(input) {
    const feedbackDiv = input.parentElement.querySelector('.invalid-feedback');
    
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    
    if (feedbackDiv) {
        feedbackDiv.style.display = 'none';
    }
}

function validateField(input) {
    const value = input.value.trim();
    const fieldName = input.id;
    
    // Trường phone là optional
    if (fieldName === 'phone' && value === '') {
        input.classList.remove('is-invalid', 'is-valid');
        return true;
    }
    
    // Kiểm tra required fields
    if (input.hasAttribute('required') && value === '') {
        showError(input, "Trường này không được để trống.");
        return false;
    }
    
    // Kiểm tra pattern
    if (patterns[fieldName]) {
        const isValid = patterns[fieldName].test(value);
        
        if (!isValid) {
            showError(input, errorMessages[fieldName]);
            return false;
        } else {
            showSuccess(input);
            return true;
        }
    }
    
    showSuccess(input);
    return true;
}

if (contactForm) {
    console.log("Contact Form Script Loaded!");

    const inputs = contactForm.querySelectorAll('input, textarea');

    // Validate khi blur (rời khỏi input)
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Xóa lỗi khi bắt đầu gõ lại
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                const feedbackDiv = this.parentElement.querySelector('.invalid-feedback');
                if (feedbackDiv) {
                    feedbackDiv.style.display = 'none';
                }
                this.classList.remove('is-invalid');
            }
        });
    });

    // Xử lý submit
    contactForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("Submitting...");

        // Validate tất cả các fields
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        // Nếu form không hợp lệ, dừng lại và HIỂN THỊ LỖI
        if (!isFormValid) {
            e.stopPropagation();
            contactForm.classList.add("was-validated");
            
            // Scroll đến field đầu tiên có lỗi
            const firstInvalid = contactForm.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            return;
        }

        // Gửi dữ liệu khi mọi thứ OK
        const submitBtn = contactForm.querySelector("button[type='submit']");
        const originalBtnText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

            const data = {
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                message: document.getElementById("message").value.trim()
            };

            const res = await fetch(FEEDBACK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok && result.success) {
                // Hiển thị thông báo thành công
                const successAlert = document.createElement('div');
                successAlert.className = 'alert alert-success form-alert mt-3';
                successAlert.innerHTML = `
                    <strong>Gửi thành công!</strong> Cảm ơn bạn đã kết nối với Cạp nha.
                `;
                submitBtn.parentElement.appendChild(successAlert);
                
                // Reset form
                contactForm.reset();
                inputs.forEach(i => i.classList.remove('is-valid', 'is-invalid'));
                contactForm.classList.remove("was-validated");
                
                // Tự động ẩn sau 5 giây
                setTimeout(() => {
                    successAlert.style.transition = 'opacity 0.5s';
                    successAlert.style.opacity = '0';
                    setTimeout(() => successAlert.remove(), 500);
                }, 5000);
            } else {
                throw new Error("Lỗi Server");
            }
        } catch (err) {
            console.error(err);
            
            // Hiển thị thông báo lỗi
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger form-alert mt-3';
            errorAlert.innerHTML = `
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Có lỗi xảy ra!</strong> Vui lòng thử lại sau.
            `;
            submitBtn.parentElement.appendChild(errorAlert);
            
            // Tự động ẩn sau 5 giây
            setTimeout(() => {
                errorAlert.style.transition = 'opacity 0.5s';
                errorAlert.style.opacity = '0';
                setTimeout(() => errorAlert.remove(), 500);
            }, 5000);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}