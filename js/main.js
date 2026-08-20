// =========================================================
// 메인 피드
// 흐름: 글 작성 → Firestore 저장 → /api/comment 호출
//      → AI 댓글을 posts/{id}/comments 서브컬렉션에 저장 → 실시간 반영
// =========================================================
import { db } from "./firebase-config.js";
import { requireAuth, initial } from "./auth.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const MAX_LEN = 500;

const $feed = document.getElementById("feed");
const $textarea = document.getElementById("postInput");
const $postBtn = document.getElementById("postBtn");
const $charCount = document.getElementById("charCount");
const $inlineError = document.getElementById("inlineError");
const $nick = document.getElementById("sidebarNick");
const $avatar = document.getElementById("sidebarAvatar");

let currentUser = null;

requireAuth((user) => {
  currentUser = user;
  $nick.textContent = user.displayName || "익명의 기록자";
  $avatar.textContent = initial(user.displayName);
  listenFeed();
});

// ---- 글자 수 표시 ----
$textarea.addEventListener("input", () => {
  const len = $textarea.value.length;
  $charCount.textContent = `${len} / ${MAX_LEN}`;
  $charCount.classList.toggle("warn", len > MAX_LEN);
  $postBtn.disabled = len === 0 || len > MAX_LEN;
});

// ---- 게시 ----
$postBtn.addEventListener("click", submitPost);
$textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitPost();
});

async function submitPost() {
  const content = $textarea.value.trim();

  // 실패 처리 1: 빈 입력
  if (!content) {
    showError("내용을 입력해주세요.");
    return;
  }
  if (content.length > MAX_LEN) {
    showError(`${MAX_LEN}자 이내로 작성해주세요.`);
    return;
  }
  hideError();
  $postBtn.disabled = true;

  try {
    const postRef = await addDoc(collection(db, "posts"), {
      authorUid: currentUser.uid,
      authorNick: currentUser.displayName || "익명의 기록자",
      content,
      createdAt: serverTimestamp(),
    });

    $textarea.value = "";
    $charCount.textContent = `0 / ${MAX_LEN}`;

    requestAiComment(postRef.id, content);
  } catch (err) {
    console.error(err);
    showError("게시에 실패했어요. 잠시 후 다시 시도해주세요.");
  } finally {
    $postBtn.disabled = false;
  }
}

// ---- AI 댓글 요청 (게시글 저장 실패는 여기 영향 없음: 이미 저장 완료된 뒤 호출) ----
async function requestAiComment(postId, content) {
  const bubbleHost = document.querySelector(`[data-ai-host="${postId}"]`);
  if (bubbleHost) bubbleHost.innerHTML = typingHtml();

  try {
    const res = await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();

    await addDoc(collection(db, "posts", postId, "comments"), {
      type: "ai",
      content: data.comment,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("AI 댓글 생성 실패:", err);
    if (bubbleHost) {
      bubbleHost.innerHTML = `<p class="ai-fail">💬 댓글 생성에 실패했어요, 잠시 후 다시 시도해주세요.</p>`;
    }
  }
}

// ---- 피드 실시간 구독 ----
function listenFeed() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      $feed.innerHTML = emptyStateHtml();
      return;
    }
    $feed.innerHTML = "";
    snap.forEach((docSnap) => renderPost(docSnap.id, docSnap.data()));
  });
}

function renderPost(id, post) {
  const card = document.createElement("article");
  card.className = "post-card";
  card.innerHTML = `
    <div class="post-head">
      <span class="nick">${escapeHtml(post.authorNick || "익명의 기록자")}</span>
      <span class="time">${formatTime(post.createdAt)}</span>
    </div>
    <div class="post-body">${escapeHtml(post.content)}</div>
    <div class="ai-reply" data-ai-host="${id}">${typingHtml()}</div>
  `;
  $feed.appendChild(card);
  listenComments(id, card.querySelector(`[data-ai-host="${id}"]`));
}

function listenComments(postId, host) {
  const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
  onSnapshot(q, (snap) => {
    if (snap.empty) return; // 아직 생성 중 — typing 유지
    let html = "";
    snap.forEach((c) => {
      const data = c.data();
      if (data.type === "ai") html += aiBubbleHtml(data.content);
    });
    if (html) host.innerHTML = html;
  });
}

function aiBubbleHtml(content) {
  return `
    <div class="ai-reply-row">
      <div class="ai-avatar">${aiIcon()}</div>
      <div class="ai-bubble">
        <span class="ai-tag">AI 댓글</span>
        ${escapeHtml(content)}
      </div>
    </div>`;
}

function typingHtml() {
  return `
    <div class="ai-reply-row">
      <div class="ai-avatar">${aiIcon()}</div>
      <div class="ai-bubble ai-typing" style="padding:0;">
        <span class="ai-typing" style="padding:12px 14px;"><span></span><span></span><span></span></span>
      </div>
    </div>`;
}

function emptyStateHtml() {
  return `
    <div class="empty-state">
      <div class="glyph">✎</div>
      <p>아직 아무도 글을 남기지 않았어요. 첫 기록을 남겨보세요.</p>
    </div>`;
}

function aiIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>`;
}

function showError(msg) {
  $inlineError.textContent = msg;
  $inlineError.classList.add("show");
}
function hideError() {
  $inlineError.classList.remove("show");
}

function formatTime(ts) {
  if (!ts) return "방금 전";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
