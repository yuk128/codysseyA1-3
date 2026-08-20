"""
POST /api/comment
입력:  { "content": "게시글 텍스트" }
출력:  { "comment": "AI가 생성한 짧은 댓글" }
실패:  400(빈 입력) / 500(API 오류) 시 JSON 에러 메시지 반환

주의: 게시글 저장 자체는 프론트에서 이 API 호출 전에 이미 끝나 있으므로,
     이 함수가 실패해도 사용자의 글은 사라지지 않는다.
"""
import os
import json
from http.server import BaseHTTPRequestHandler
from anthropic import Anthropic

MAX_INPUT_LEN = 500
SYSTEM_PROMPT = (
    "너는 SNS '말동무'에서 사용자의 글에 반응하는 다정한 친구야. "
    "사용자가 올린 짧은 일상 글을 읽고, 공감하거나 응원하는 톤으로 "
    "1~2문장짜리 짧은 댓글을 정확히 1개만 작성해. "
    "이모지는 0~1개만 사용하고, 설교하거나 질문을 3개 이상 던지지 마. "
    "댓글 텍스트만 출력하고 따옴표나 접두사는 붙이지 마."
)

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b""
            body = json.loads(raw or "{}")
        except (ValueError, json.JSONDecodeError):
            self._send(400, {"error": "bad_request", "message": "요청 형식이 올바르지 않아요."})
            return

        content = (body.get("content") or "").strip()

        # 실패 처리: 빈 입력
        if not content:
            self._send(400, {"error": "empty_input", "message": "내용을 입력해주세요."})
            return

        # 운영 고려사항: 게시글 길이 제한으로 호출 비용 관리
        content = content[:MAX_INPUT_LEN]

        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=150,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": content}],
            )
            reply = "".join(
                block.text for block in message.content if block.type == "text"
            ).strip()

            if not reply:
                raise ValueError("empty completion")

            self._send(200, {"comment": reply})

        except Exception as exc:  # noqa: BLE001 — 사용자에게는 일반 메시지만 노출
            print(f"[api/comment] AI 호출 실패: {exc}")
            self._send(
                500,
                {"error": "ai_error", "message": "댓글 생성에 실패했어요, 잠시 후 다시 시도해주세요."},
            )

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def _send(self, status: int, payload: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
