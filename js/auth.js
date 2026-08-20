// =========================================================
// 인증 공통 로직
// - login.html: signInWithGoogle()
// - index.html / mypage.html / settings.html: requireAuth()로 보호
// =========================================================
import { auth, googleProvider, db } from "./firebase-config.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 로그인 안 되어 있으면 login.html로 보내고, 되어 있으면 콜백에 user를 넘긴다.
export function requireAuth(onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    await ensureUserDoc(user);
    onReady(user);
  });
}

// login.html 전용: 이미 로그인돼 있으면 바로 메인으로.
export function redirectIfLoggedIn() {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "index.html";
  });
}

async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      nickname: user.displayName || "익명의 기록자",
      profileImage: user.photoURL || "",
      createdAt: serverTimestamp(),
    });
  }
}

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("로그인 실패:", err);
    alert("로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
  }
}

export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}

export function initial(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}
