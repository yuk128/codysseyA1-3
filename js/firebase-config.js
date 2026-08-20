// =========================================================
// Firebase 초기화
// -----------------------------------------------------
// 아래 firebaseConfig 값을 본인의 Firebase 프로젝트 값으로 교체하세요.
// 위치: Firebase Console > 프로젝트 설정 > 일반 > 내 앱 > SDK 설정 및 구성
//
// ⚠️ 주의: 이 apiKey는 "비밀 키"가 아니라 클라이언트에 공개되는 식별자입니다.
//    (백엔드에서 쓰는 ANTHROPIC_API_KEY와는 성격이 다릅니다.)
//    실제 보안은 Firestore 보안 규칙(rules)으로 걸어야 합니다.
// =========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBxHREvHSzhsauvBDCVmKXqMhNN1oClg8",
  authDomain: "playground-63b42.firebaseapp.com",
  projectId: "playground-63b42",
  storageBucket: "playground-63b42.firebasestorage.app",
  messagingSenderId: "893802332562",
  appId: "1:893802332562:web:bb7ab9bc1c9731312f814b",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
