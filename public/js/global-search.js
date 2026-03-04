document.addEventListener("DOMContentLoaded", function () {
  let allCourseData = [];

  // Trạng thái tìm kiếm hiện tại
  let searchFilters = {
    subjectCode: null, // Bước 1: Mã môn
    lessonName: null, // Bước 2: Tên bài học
    keyword: "", // Bước 3: Từ khóa nội dung
  };

  // Tải dữ liệu JSON
  fetch("/data/searchGlobal.json")
    .then((response) => {
      if (!response.ok) throw new Error("Lỗi tải data");
      return response.json();
    })
    .then((data) => {
      allCourseData = data;
      renderSuggestions();
    })
    .catch((err) => console.error("Lỗi:", err));

  const searchInput = document.getElementById("globalSearchInput");
  const resultsContainer = document.getElementById("globalSearchResults");
  const defaultState = document.getElementById("defaultState");
  const badgeContainer = document.getElementById("searchBadges");
  const suggestionContainer = document.getElementById("searchSuggestions");

  if (!searchInput || !resultsContainer || !badgeContainer) return;

  function updateBadges() {
    badgeContainer.innerHTML = "";

    if (searchFilters.subjectCode) {
      badgeContainer.innerHTML += `
                <span class="badge d-flex align-items-center gap-2 shadow-sm" style="background-color: #f97316; color: white; font-size: 0.9rem; padding: 7px 12px; border-radius: 50px;">
                    ${searchFilters.subjectCode} 
                    <i class="bi bi-x-circle-fill text-white" style="cursor:pointer; opacity: 0.8; transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" onclick="removeFilter('subject')"></i>
                </span>`;
    }

    if (searchFilters.lessonName) {
      badgeContainer.innerHTML += `
                <span class="badge d-flex align-items-center gap-2 shadow-sm" style="background-color: #0ea5e9; color: white; font-size: 0.9rem; padding: 7px 12px; border-radius: 50px;">
                    ${searchFilters.lessonName} 
                    <i class="bi bi-x-circle-fill text-white" style="cursor:pointer; opacity: 0.8; transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" onclick="removeFilter('lesson')"></i>
                </span>`;
    }
  }

  function renderSuggestions() {
    suggestionContainer.innerHTML = "";

    if (!searchFilters.subjectCode) {
      // Badge gợi ý chọn Môn học
      suggestionContainer.innerHTML = `<span class="text-muted fw-bold small me-2">Chọn môn:</span>`;
      allCourseData.forEach((subject) => {
        suggestionContainer.innerHTML += `
                    <span class="badge rounded-pill border px-3 py-2 me-1 mb-2 shadow-sm" 
                          style="background-color: #ffffff; color: #64748b; border-color: #e2e8f0; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;"
                          onclick="applyFilter('subject', '${subject.code}')"
                          onmouseover="this.style.backgroundColor='#f97316'; this.style.color='white'; this.style.borderColor='#f97316'; this.style.transform='translateY(-2px)';"
                          onmouseout="this.style.backgroundColor='#ffffff'; this.style.color='#64748b'; this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)';">
                        ${subject.code}
                    </span>`;
      });
    } else if (!searchFilters.lessonName) {
      // Bước 2: Badge gợi ý chọn Bài học
      suggestionContainer.innerHTML = `<span class="text-muted fw-bold small me-2">Chọn chủ đề:</span>`;
      let activeSubject = allCourseData.find(
        (s) => s.code === searchFilters.subjectCode,
      );

      if (activeSubject && activeSubject.subLessons) {
        activeSubject.subLessons.forEach((group) => {
          if (group.subLessons) {
            group.subLessons.forEach((lesson) => {
              suggestionContainer.innerHTML += `
                                <span class="badge rounded-pill border px-3 py-2 me-1 mb-2 shadow-sm" 
                                      style="background-color: #ffffff; color: #64748b; border-color: #e2e8f0; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;"
                                      onclick="applyFilter('lesson', '${lesson.name}')"
                                      onmouseover="this.style.backgroundColor='#0ea5e9'; this.style.color='white'; this.style.borderColor='#0ea5e9'; this.style.transform='translateY(-2px)';"
                                      onmouseout="this.style.backgroundColor='#ffffff'; this.style.color='#64748b'; this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)';">
                                    ${lesson.name}
                                </span>`;
            });
          }
        });
      }
    } else {
      // Bước 3: Đã khoanh vùng xong
      suggestionContainer.innerHTML = `<span class="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill border border-success"><i class="bi bi-check-circle-fill me-1"></i> Đã khoanh vùng. Hãy gõ từ khóa vào ô bên trên!</span>`;
    }
  }

  // Khi User click vào nút Gợi ý
  window.applyFilter = function (type, value) {
    if (type === "subject") searchFilters.subjectCode = value;
    if (type === "lesson") searchFilters.lessonName = value;

    searchInput.value = ""; // Xóa text đang gõ dở
    searchFilters.keyword = ""; // Reset keyword

    updateBadges();
    renderSuggestions();
    executeSearch(); // Chạy lại hàm tìm kiếm
    searchInput.focus(); // Tự động trỏ lại vào ô nhập
  };

  // Khi User click dấu X để xóa Badge
  window.removeFilter = function (type) {
    if (type === "subject") {
      searchFilters.subjectCode = null;
      searchFilters.lessonName = null; // Xóa môn thì bay luôn bài
    }
    if (type === "lesson") searchFilters.lessonName = null;

    searchInput.value = "";
    searchFilters.keyword = "";

    updateBadges();
    renderSuggestions();
    executeSearch();
  };

  // Khi User gõ phím
  searchInput.addEventListener("input", function (e) {
    searchFilters.keyword = e.target.value.toLowerCase().trim();
    executeSearch();
  });

  function executeSearch() {
    if (
      !searchFilters.subjectCode &&
      !searchFilters.lessonName &&
      !searchFilters.keyword
    ) {
      defaultState.style.display = "block";
      resultsContainer.style.display = "none";
      resultsContainer.innerHTML = "";
      return;
    }

    defaultState.style.display = "none";
    resultsContainer.style.display = "flex";

    let htmlRender = "";
    let matchCount = 0;

    //  băm nhỏ câu search thành mảng các chữ cái (Vd: "JPD113 Bảng" -> ["jpd113", "bảng"])
    let searchTerms = searchFilters.keyword
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    allCourseData.forEach((subject) => {
      // 1. Kiểm tra filter môn học (qua Badge click)
      if (
        searchFilters.subjectCode &&
        subject.code !== searchFilters.subjectCode
      )
        return;
      if (!subject.subLessons) return;

      function processLessons(lessons) {
        lessons.forEach((item) => {
          if (item.subLessons) {
            processLessons(item.subLessons);
            return;
          }

          // Kiểm tra filter bài học (qua Badge click)
          if (
            searchFilters.lessonName &&
            item.name !== searchFilters.lessonName
          )
            return;
          if (!item.content) return;

          let parser = new DOMParser();
          let doc = parser.parseFromString(item.content, "text/html");

          let mainBlocks = doc.querySelectorAll(
            ".content-card, .info-box, .warning-box, .success-box",
          );
          let blocksArray =
            mainBlocks.length > 0 ? Array.from(mainBlocks) : [doc.body];

          blocksArray.forEach((block) => {
            //  Gộp Mã môn + Tên bài + Nội dung thành 1 chuỗi duy nhất để quét
            let combinedText = (
              subject.code +
              " " +
              item.name +
              " " +
              block.textContent
            ).toLowerCase();

            // Kiểm tra xem TẤT CẢ các từ khóa người dùng gõ có nằm trong chuỗi gộp này không
            // Hàm every() sẽ tự động trả về true nếu searchTerms rỗng (lúc chưa gõ gì)
            let isMatch = searchTerms.every((term) =>
              combinedText.includes(term),
            );

            if (isMatch) {
              matchCount++;
              let contentToRender =
                block === doc.body ? block.innerHTML : block.outerHTML;
              htmlRender += createCardTemplate(
                subject.code,
                item.name,
                contentToRender,
              );
            }
          });
        });
      }

      processLessons(subject.subLessons);
    });

    // Xuất kết quả
    if (matchCount === 0) {
      resultsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-emoji-frown text-danger" style="font-size: 3rem;"></i>
                    <h5 class="text-danger mt-3">Không tìm thấy nội dung phù hợp</h5>
                </div>`;
    } else {
      resultsContainer.innerHTML =
        `<div class="col-12 mb-3"><span class="badge bg-success px-3 py-2" style="font-size: 0.9rem;">Tìm thấy ${matchCount} kết quả</span></div>` +
        htmlRender;
    }
  }

  function createCardTemplate(subCode, lessonName, htmlContent) {
    return `
            <div class="col-md-6 mb-4 d-flex align-items-stretch">
                <div class="card w-100 shadow-sm" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    
                    <div class="card-header d-flex align-items-center" style="background: #334155; padding: 12px 15px;">
                        <span class="badge shadow-sm flex-shrink-0" style="background-color: #f97316; color: #ffffff !important; padding: 6px 12px; margin-right: 12px; font-size: 0.85rem; border-radius: 6px;">
                            ${subCode}
                        </span>
                        <strong style="color: #ffffff; line-height: 1.4; white-space: normal; word-break: break-word;">
                            ${lessonName}
                        </strong>
                    </div>
                    
                    <div class="card-body custom-scrollbar" style="max-height: 350px; overflow-y: auto; overflow-x: auto; padding: 15px; background: #ffffff;">
                        <div style="max-width: 100%; box-sizing: border-box;">
                            ${htmlContent}
                        </div>
                    </div>

                </div>
            </div>
        `;
  }
});
