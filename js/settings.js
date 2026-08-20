import { db } from "./firebase-config.js";
import { requireAuth, logout, initial } from "./auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const $nick = document.getElementById("sidebarNick");
const $avatar = document.getElementById("sidebarAvatar");
const $nickInput = document.getElementById("nickInput");
const $saveNickBtn = document.getElementById("saveNickBtn");
const $logoutBtn = document.getElementById("logoutBtn");
const $themeToggle = document.getElementById("themeToggle");
const $saveMsg = document.getElementById("saveMsg");

let currentUser = null;

requireAuth((user) => {
  currentUser = user;
  const displayName = user.displayName || "익명의 기록자";
  $nick.textContent = displayName;
  $avatar.textContent = initial(displayName);
  $nickInput.value = displayName;
});

$saveNickBtn.addEventListener("click", async () => {
  const newNick = $nickInput.value.trim();
  if (!newNick) {
    flash("닉네임을 입력해주세요.", true);
    return;
  }
  try {
    await updateProfile(currentUser, { displayName: newNick });
    await updateDoc(doc(db, "users", currentUser.uid), { nickname: newNick });
    $nick.textContent = newNick;
    $avatar.textContent = initial(newNick);
    flash("닉네임을 저장했어요.");
  } catch (err) {
    console.error(err);
    flash("저장에 실패했어요. 잠시 후 다시 시도해주세요.", true);
  }
});

$logoutBtn.addEventListener("click", () => {
  if (confirm("로그아웃 하시겠어요?")) logout();
});

// ---- 다크모드 토글 ----
const THEME_KEY = "maldongmu-theme";
function applyTheme(light) {
  document.body.classList.toggle("light", light);
  $themeToggle.classList.toggle("on", !light); // "on" = 다크(기본) 강조 표시 유지
}
const savedLight = localStorage.getItem(THEME_KEY) === "light";
document.body.classList.toggle("light", savedLight);
$themeToggle.classList.toggle("on", !savedLight);

$themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  $themeToggle.classList.toggle("on", !isLight);
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
});

function flash(msg, isError = false) {
  $saveMsg.textContent = msg;
  $saveMsg.style.color = isError ? "var(--accent-danger)" : "var(--accent-user)";
  $saveMsg.style.opacity = 1;
  setTimeout(() => ($saveMsg.style.opacity = 0), 2200);
}
