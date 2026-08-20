# 말동무 (Maldongmu)

> 글을 올리면 AI가 다정하게 댓글을 달아주는 SNS.
> 팔로워가 없어도, 짧은 기록에도 늘 첫 반응이 도착합니다.

배포 URL: `TODO — Vercel 배포 후 이 자리에 실제 URL을 채워주세요 (예: https://maldongmu.vercel.app)`

## 소개

- **타겟 사용자**: 팔로워 없이도 혼자 일상을 기록하고 싶은 1인 가구·자취생
- **핵심 기능**: 게시글을 올리면 `api/comment.py`가 Anthropic API(Claude)를 호출해 짧고 다정한 AI 댓글을 자동 생성, Firestore에 저장 후 실시간으로 화면에 표시
- **페이지 구성 (3개, 좌측 사이드바 내비게이션 / 모바일은 하단 탭바)**
  1. 홈 — 글쓰기 + 실시간 피드 + AI 댓글
  2. 마이페이지 — 내 프로필 + 내가 쓴 글 목록
  3. 설정 — 닉네임 수정 / 다크·라이트 모드 / 로그아웃

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | HTML / CSS / JavaScript (프레임워크 미사용) |
| 백엔드 | Vercel Serverless Functions (Python) |
| 데이터베이스 · 인증 | Firebase (Firestore + Authentication, Google 로그인) |
| AI API | Anthropic API (Claude, `claude-sonnet-4-6`) |
| 배포 | GitHub → Vercel 연동 |

## 프로젝트 구조

```
maldongmu/
├── index.html          # 홈(피드)
├── mypage.html          # 마이페이지
├── settings.html         # 설정
├── login.html           # 로그인
├── css/style.css         # 전체 스타일
├── js/
│   ├── firebase-config.js  # Firebase 초기화 (본인 프로젝트 키로 교체 필요)
│   ├── auth.js             # 로그인/로그아웃/인증 가드
│   ├── main.js              # 피드 · AI 댓글 요청 로직
│   ├── mypage.js
│   └── settings.js
├── api/
│   └── comment.py          # AI 댓글 생성 엔드포인트 (POST)
├── requirements.txt
├── .env.example
└── .gitignore
```

## 실행 방법 (로컬)

이 프로젝트는 정적 프론트 + Vercel 서버리스 함수 구조라, 로컬에서 `api/`까지 함께 테스트하려면 Vercel CLI를 쓰는 게 가장 간단합니다.

```bash
npm install -g vercel
vercel login
vercel dev
```

`vercel dev`를 실행하면 프론트와 `/api/comment` 함수가 함께 뜹니다. 브라우저에서 CLI가 알려주는 로컬 주소로 접속하세요.

## 환경 변수 설정

1. `.env.example`을 복사해 `.env.local`을 만듭니다.
2. Anthropic 콘솔([console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys))에서 API 키를 발급받아 넣습니다.

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

3. Vercel에 배포할 때는 **Vercel 대시보드 → 프로젝트 → Settings → Environment Variables**에 동일한 키를 등록해야 합니다. `.env.local`은 로컬 전용이며 절대 커밋하지 않습니다(`.gitignore`에 포함됨).

## Firebase 설정

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트를 만듭니다 (기존 놀이용 프로젝트와 분리).
2. **Authentication → Sign-in method**에서 Google 로그인을 활성화합니다.
3. **Firestore Database**를 생성합니다.
4. **프로젝트 설정 → 내 앱 → 웹 앱 추가**로 나온 설정값을 `js/firebase-config.js`의 `firebaseConfig`에 붙여넣습니다.
5. Firestore 보안 규칙 예시 (초안 — 운영 전 검토 필요):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorUid;
      allow update, delete: if false;

      match /comments/{commentId} {
        allow read: if true;
        allow create: if true; // AI 댓글은 서버(백엔드) 대신 클라이언트에서 저장하는 구조이므로 열어둠
        allow update, delete: if false;
      }
    }
  }
}
```

## 배포 방법 (Vercel)

1. GitHub에 저장소를 만들고 이 프로젝트를 푸시합니다.
2. [vercel.com](https://vercel.com)에서 **New Project → GitHub 저장소 선택**.
3. Vercel이 `requirements.txt`를 감지해 `api/` 폴더를 Python 서버리스 함수로 자동 배포합니다. 별도 빌드 설정은 필요 없습니다.
4. **Settings → Environment Variables**에 `ANTHROPIC_API_KEY`를 등록합니다.
5. Deploy 후 발급된 URL로 접속해 홈/마이페이지/설정 내비게이션, 반응형, AI 댓글 기능이 모두 동작하는지 확인합니다.
6. 문제가 있으면 코드를 수정하고 다시 `git push` — Vercel이 자동으로 재배포합니다.

## AI 기능 명세

| 항목 | 내용 |
|---|---|
| 입력 | 사용자가 작성한 게시글 텍스트 (최대 500자) |
| 처리 | `POST /api/comment` → Anthropic API 호출, "다정한 SNS 친구" 페르소나로 짧은 댓글 1개 생성 |
| 출력 | 생성된 댓글을 `posts/{postId}/comments`에 저장, 화면에 실시간 반영 |
| 실패 처리 | 빈 입력 → "내용을 입력해주세요" (게시 자체를 막음) / API 오류 → "댓글 생성에 실패했어요, 잠시 후 다시 시도해주세요" (게시글 저장은 이미 완료된 상태라 영향 없음) / 생성 중 → 말풍선 자리에 타이핑 애니메이션 표시 |

## 보안 참고

- `ANTHROPIC_API_KEY`는 서버(`api/comment.py`)에서만 사용하며, 프론트 코드에는 절대 포함하지 않습니다.
- `js/firebase-config.js`의 Firebase `apiKey`는 클라이언트 공개용 식별자이며, 실제 접근 제어는 Firestore 보안 규칙으로 처리합니다.
- 키 유출이 의심되면 즉시 Anthropic 콘솔에서 키를 폐기·재발급하고, 노출된 커밋이 있다면 히스토리를 정리합니다.
