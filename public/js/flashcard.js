let flashcardData = null;

// Chuyển hàm thành async để có thể đợi fetch dữ liệu
async function loadFlashcards(subjectId, subjectCode) {
  const fcSection = document.getElementById("flashcard-section");
  const fcContainer = document.getElementById("flashcard-container");
  const fcBadge = document.getElementById("flashcard-badge");

  if (!fcSection || !fcContainer || !fcBadge) return;

  // LẤY DỮ LIỆU (Chỉ fetch 1 lần duy nhất)
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

  // Nếu môn này không có trong file flashcard.json thì ẩn khu vực đi
  if (!subjectData || !subjectData.cards || subjectData.cards.length === 0) {
    fcSection.style.display = "none";
    return;
  }

  // Có dữ liệu -> Bật khu vực hiển thị lên
  fcBadge.innerText = subjectCode;
  fcSection.style.display = "block";
  fcContainer.innerHTML = "";

  // Vẽ các thẻ Flashcard ra màn hình
  subjectData.cards.forEach((card) => {
    const cardHTML = `
            <div class="fc-scene" onclick="this.querySelector('.fc-card').classList.toggle('is-flipped')">
                <div class="fc-card shadow-sm">
                    <div class="fc-face fc-front">
                        ${card.front}
                        <div style="position:absolute; bottom: 12px; font-size: 0.75rem; color: #94a3b8; font-weight: normal; width: 100%; text-align: center;">
                            <i class="bi bi-hand-index-thumb"></i> Click để lật
                        </div>
                    </div>
                    <div class="fc-face fc-back">
                        ${card.back}
                    </div>
                </div>
            </div>
        `;
    fcContainer.insertAdjacentHTML("beforeend", cardHTML);
  });
}
