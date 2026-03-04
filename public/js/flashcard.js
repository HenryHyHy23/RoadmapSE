let flashcardData = null;
let currentSubjectCards = []; // Mảng chứa thẻ của môn hiện tại
let currentCardIndex = 0; // Vị trí thẻ đang xem

async function loadFlashcards(subjectId, subjectCode) {
  const fcSection = document.getElementById("flashcard-section");
  const fcContainer = document.getElementById("flashcard-container");
  const fcBadge = document.getElementById("flashcard-badge");

  if (!fcSection || !fcContainer || !fcBadge) return;

  // LẤY DỮ LIỆU
  if (!flashcardData) {
    try {
      const response = await fetch("/data/flashcard.json");
      if (!response.ok) throw new Error("Không tìm thấy file flashcard.json");
      flashcardData = await response.json();
    } catch (err) {
      console.error("Lỗi tải flashcard:", err);
      return;
    }
  }

  // Tìm dữ liệu flashcard của môn tương ứng
  const subjectData = flashcardData.find(
    (item) => item.subjectId === subjectId,
  );

  // Xử lý ẩn/hiện
  if (!subjectData || !subjectData.cards || subjectData.cards.length === 0) {
    fcSection.style.display = "none";
    return;
  }

  // Gán dữ liệu cho biến toàn cục để dùng cho các nút Next/Prev
  currentSubjectCards = subjectData.cards;
  currentCardIndex = 0; // Reset về thẻ đầu tiên mỗi khi chọn môn mới

  fcBadge.innerText = subjectCode;
  fcSection.style.display = "block";

  // Gọi hàm vẽ 1 thẻ
  renderSingleCard();
}

// Hàm vẽ duy nhất 1 thẻ và thanh điều hướng
function renderSingleCard() {
  const fcContainer = document.getElementById("flashcard-container");
  if (currentSubjectCards.length === 0) return;

  const card = currentSubjectCards[currentCardIndex];

  fcContainer.innerHTML = `
        <div class="fc-scene mb-4" onclick="this.querySelector('.fc-card').classList.toggle('is-flipped')">
            <div class="fc-card shadow-sm">
                <div class="fc-face fc-front">
                    ${card.front}
                    <div style="position:absolute; bottom: 12px; font-size: 0.8rem; color: #94a3b8; font-weight: normal; width: 100%; text-align: center;">
                        <i class="bi bi-hand-index-thumb"></i> Click để lật
                    </div>
                </div>
                <div class="fc-face fc-back">
                    ${card.back}
                </div>
            </div>
        </div>

        <div class="d-flex align-items-center justify-content-center gap-4">
            <button class="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center" 
                    onclick="prevFlashcard()" 
                    ${currentCardIndex === 0 ? "disabled" : ""} 
                    style="width: 45px; height: 45px; transition: all 0.2s;">
                <i class="bi bi-chevron-left" style="font-size: 1.2rem;"></i>
            </button>
            
            <span class="fw-bold text-muted fs-5" style="min-width: 80px; text-align: center;">
                ${currentCardIndex + 1} / ${currentSubjectCards.length}
            </span>
            
            <button class="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center" 
                    onclick="nextFlashcard()" 
                    ${currentCardIndex === currentSubjectCards.length - 1 ? "disabled" : ""} 
                    style="width: 45px; height: 45px; transition: all 0.2s;">
                <i class="bi bi-chevron-right" style="font-size: 1.2rem;"></i>
            </button>
        </div>
    `;
}

// Hàm xử lý nút Trở lại
window.prevFlashcard = function () {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    renderSingleCard();
  }
};

// Hàm xử lý nút Tiếp theo
window.nextFlashcard = function () {
  if (currentCardIndex < currentSubjectCards.length - 1) {
    currentCardIndex++;
    renderSingleCard();
  }
};
