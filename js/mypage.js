import { db } from "./firebase-config.js";
import { requireAuth, initial } from "./auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $nick = document.getElementById("sidebarNick");
const $avatar = document.getElementById("sidebarAvatar");
const $profileNick = document.getElementById("profileNick");
const $profileAvatar = document.getElementById("profileAvatar");
const $postCount = document.getElementById("postCount");
const $myPosts = document.getElementById("myPosts");

requireAuth((user) => {
  const displayName = user.displayName || "익명의 기록자";
  $nick.textContent = displayName;
  $avatar.textContent = initial(displayName);
  $profileNick.textContent = displayName;
  $profileAvatar.textContent = initial(displayName);

  const q = query(
    collection(db, "posts"),
    where("authorUid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snap) => {
    $postCount.textContent = snap.size;
    if (snap.empty) {
      $myPosts.innerHTML = `<div class="empty-state"><div class="glyph">✎</div><p>아직 작성한 글이 없어요.</p></div>`;
      return;
    }
    $myPosts.innerHTML = "";
    snap.forEach((docSnap) => {
      const post = docSnap.data();
      const card = document.createElement("article");
      card.className = "post-card";
      card.innerHTML = `
        <div class="post-head">
          <span class="nick">${escapeHtml(displayName)}</span>
          <span class="time">${formatTime(post.createdAt)}</span>
        </div>
        <div class="post-body">${escapeHtml(post.content)}</div>
      `;
      $myPosts.appendChild(card);
    });
  });
});

function formatTime(ts) {
  if (!ts) return "방금 전";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
