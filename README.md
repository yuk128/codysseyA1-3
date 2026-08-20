# 말동무 (Maldongmu)

> 짧은 글을 남기면, AI가 다정한 댓글로 가장 먼저 반응해주는 SNS.
> 팔로워가 없어도 괜찮아요 — 말동무가 늘 첫 반응을 남겨줍니다.

**배포 URL**: https://codyssey-a1-3-tau.vercel.app
**GitHub**: https://github.com/yuk128/codysseyA1-3

---

## 목차

1. [소개](#소개)
2. [주요 기능](#주요-기능)
3. [기술 스택](#기술-스택)
4. [페이지 구성](#페이지-구성)
5. [프로젝트 구조](#프로젝트-구조)
6. [실행 방법 (로컬)](#실행-방법-로컬)
7. [환경 변수 설정](#환경-변수-설정)
8. [배포 방법 (Vercel)](#배포-방법-vercel)
9. [AI 기능 명세](#ai-기능-명세)
10. [보안 참고](#보안-참고)

---

## 소개

**말동무**는 거창한 소셜 네트워크가 아니라, 혼자서도 부담 없이 오늘 하루를 짧게 남길 수 있는 공간입니다. 팔로워나 좋아요 수에 신경 쓰지 않고 글을 올리면, AI가 그 자리에서 공감하거나 응원하는 짧은 댓글을 달아줘서 "아무도 안 봐도 괜찮은" 기록에도 항상 첫 반응이 도착합니다.

- **타겟 사용자**: 팔로워 없이도 혼자 일상을 기록하고 싶은 사람, 짧은 메모/일기 습관을 만들고 싶은 사람
- **핵심 가치**: 부담 없는 짧은 글쓰기 + 즉각적이고 다정한 AI 반응

## 주요 기능

- Google 계정으로 간편 로그인
- 최대 500자 이내 짧은 글 작성 및 실시간 피드
- 글 작성 시 AI가 자동으로 공감/응원 댓글 생성 (1~2문장, 이모지 최소화)
- 마이페이지에서 내 프로필 및 내가 쓴 글 확인
- 설정 페이지에서 닉네임 수정 및 로그아웃

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | HTML / CSS / JavaScript (프레임워크 미사용, Vanilla) |
| 백엔드 | Vercel Serverless Functions (Python) |
| 데이터베이스 · 인증 | Firebase (Firestore + Authentication, Google 로그인) |
| AI API | Google Gemini API (`gemini-2.5-flash-lite`) |
| 배포 | GitHub → Vercel 연동 (Push 시 자동 재배포) |

## 페이지 구성

내비게이션: 하단 탭바(모바일) / 사이드바(데스크톱)로 이동

| 페이지 | 파일 | 설명 |
|---|---|---|
| 로그인 | `login.html` | Google 계정으로 로그인 |
| 홈 (피드) | `index.html` | 글쓰기 + 실시간 피드 + AI 댓글 |
| 프로필 | `mypage.html` | 내 정보 및 내가 쓴 글 목록 |
| 설정 | `settings.html` | 닉네임 수정, 로그아웃 |

## 프로젝트 구조

```
maldongmu/
├── index.html              # 홈(피드)
├── login.html               # 로그인
├── mypage.html               # 프로필
├── settings.html              # 설정
├── css/
│   └── style.css               # 전체 스타일 (반응형 포함)
├── js/
│   ├── firebase-config.js        # Firebase 초기화
│   ├── auth.js                    # 로그인/로그아웃/인증 가드
│   ├── main.js                     # 피드 · 글쓰기 · AI 댓글 요청 로직
│   ├── mypage.js
│   └── settings.js
├── api/
│   └── comment.py                  # AI 댓글 생성 엔드포인트 (POST)
├── requirements.txt
├── .env.example
└── .gitignore
```

## 실행 방법 (로컬)

정적 프론트 + Vercel 서버리스 함수 구조라, `api/`까지 함께 테스트하려면 Vercel CLI 사용을 권장합니다.

```bash
npm install -g vercel
vercel login
vercel dev
```

`vercel dev` 실행 후 터미널에 뜨는 로컬 주소로 접속하면 프론트와 `/api/comment` 함수가 함께 동작합니다.

## 환경 변수 설정

1. `.env.example`을 복사해 `.env.local` 생성
2. [Google AI Studio](https://aistudio.google.com/apikey)에서 Gemini API 키를 무료로 발급 (카드 등록 불필요)
3. `.env.local`에 아래와 같이 입력:

```dotenv
GEMINI_API_KEY=발급받은_키_값
```

`.env.local`은 로컬 전용이며 절대 커밋하지 않습니다 (`.gitignore`에 포함되어 있음).

## 배포 방법 (Vercel)

1. GitHub 저장소에 프로젝트 푸시
2. [vercel.com](https://vercel.com) → **New Project → GitHub 저장소 선택**
3. Vercel이 `requirements.txt`를 감지해 `api/` 폴더를 Python 서버리스 함수로 자동 배포 (별도 빌드 설정 불필요)
4. **Settings → Environment Variables**에 `GEMINI_API_KEY` 등록 (Production/Preview/Development 모두 체크)
5. Deploy 후 발급된 URL에서 로그인 · 글쓰기 · AI 댓글 · 반응형이 모두 동작하는지 확인
6. 문제가 있으면 코드 수정 후 `git push` — Vercel이 자동으로 재배포

## AI 기능 명세

| 항목 | 내용 |
|---|---|
| 입력 | 사용자가 작성한 게시글 텍스트 (최대 500자) |
| 처리 | `POST /api/comment` → Gemini API 호출, "다정한 SNS 친구" 페르소나로 짧은 댓글 1개 생성 |
| 출력 | 생성된 댓글을 `posts/{postId}/comments`에 저장, 화면에 실시간 반영 |
| 실패 처리 — 빈 입력 | "내용을 입력해주세요" 안내와 함께 게시 자체를 막음 |
| 실패 처리 — API 오류 | "댓글 생성에 실패했어요, 잠시 후 다시 시도해주세요" 안내 (게시글은 이미 저장 완료된 상태라 영향 없음) |
| 처리 중 | 말풍선 자리에 타이핑 애니메이션 표시 |

## 보안 참고

- `GEMINI_API_KEY`는 서버(`api/comment.py`)에서만 사용하며, 프론트 코드에는 포함하지 않습니다.
- `js/firebase-config.js`의 Firebase `apiKey`는 클라이언트 공개용 식별자이며, 실제 접근 제어는 Firestore 보안 규칙으로 처리합니다.
- 키 유출이 의심되면 즉시 발급처(Google AI Studio)에서 키를 폐기·재발급하고, 노출된 커밋이 있다면 히스토리를 정리합니다.