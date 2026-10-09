const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

const DRAFT_KEY = "draft";
const THEME_KEY = "theme";

function updateCounts() {
  const length = noteText.value.length;
  const trimmed = noteText.value.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

  charCount.textContent = `${length} / 200 characters`;
  wordCount.textContent = `${words} words`;

  charCount.classList.toggle("warning", length > 180);
  charCount.classList.toggle("over", length > 200);
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, noteText.value);
}

function clearAll() {
  noteText.value = "";
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
  noteText.focus();
}

function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

noteText.addEventListener("input", function () {
  updateCounts();
  saveDraft();
});

noteText.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearAll();
  }
});

clearBtn.addEventListener("click", clearAll);

themeToggle.addEventListener("click", function () {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
});

// On page load: restore the draft and the theme then update the counters
noteText.value = localStorage.getItem(DRAFT_KEY) || "";
applyTheme(localStorage.getItem(THEME_KEY) === "dark");
updateCounts();