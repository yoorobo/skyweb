"""AI 여행사 고객센터 챗봇 — FastAPI 백엔드.

요청 흐름:
    React → POST /api/chat → OpenAI → JSON 응답 → React
"""

from __future__ import annotations

import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #
MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# GPT에 전달할 이전 대화 최대 개수 (토큰 비용 통제)
MAX_HISTORY_MESSAGES: int = 12

SYSTEM_PROMPT: str = """
<역할>
너는 '하늘길 여행사'의 고객센터 AI 상담원이다.
고객의 여행 계획을 돕고, 필요한 정보를 수집해 맞춤 일정을 추천하는 것이 목표다.
</역할>

<대화_원칙>
- 항상 정중한 존댓말을 사용한다.
- 답변은 5문장 이내로 간결하게 한다.
- 답변 마지막에는 고객이 취할 다음 행동을 한 줄로 제안한다.
</대화_원칙>

<정보_수집_절차>
고객이 여행지를 언급하면, 아래 순서로 하나씩 질문해 정보를 모은다.
1. 여행 시기
2. 인원
3. 출발지
4. 예산
네 가지가 모두 모이면 그때 여행 일정을 추천한다.
한 번에 하나씩 자연스럽게 묻고, 이미 답한 항목은 다시 묻지 않는다.
</정보_수집_절차>

<사실_기준>
- 실시간 가격, 좌석 현황, 예약 가능 여부는 확정적으로 답하지 않고 '직원 확인이 필요하다'고 안내한다.
- 예약이 확정된 것처럼 표현하지 않는다.
- 모르는 내용은 추측하지 않고, 확인이 필요함을 솔직히 밝힌다.
</사실_기준>

<범위_밖_질문>
여행과 무관한 질문(예: 프로그래밍, 일반 상식)에는 답하지 않는다.
정중히 여행 상담 전문 AI임을 밝히고, 여행 관련 질문으로 자연스럽게 유도한다.
</범위_밖_질문>

<안전>
고객의 개인정보(주민번호, 카드번호 등)를 요구하지 않는다.
결제·계약은 직접 처리하지 않고 담당 직원 연결을 안내한다.
</안전>
""".strip()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# --------------------------------------------------------------------------- #
# Schemas
# --------------------------------------------------------------------------- #
class ChatMessage(BaseModel):
    """대화 한 줄 (발화 주체와 내용)."""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """클라이언트 요청 본문."""

    message: str
    messages: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    """서버 응답 본문."""

    reply: str
    messages: list[ChatMessage]


# --------------------------------------------------------------------------- #
# Application
# --------------------------------------------------------------------------- #
app = FastAPI(title="AI 여행사 고객센터 챗봇 API")


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> dict:
    """사용자 메시지를 받아 시스템 프롬프트·대화 맥락과 함께 OpenAI에 전달하고 응답을 반환한다."""
    # 최근 N개 대화만 사용해 컨텍스트 길이를 제한한다.
    history = request.messages[-MAX_HISTORY_MESSAGES:]

    # OpenAI 요청 페이로드: 시스템 프롬프트 → 이전 대화 → 새 질문 순서.
    gpt_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    gpt_messages.extend(
        {"role": msg.role, "content": msg.content} for msg in history
    )
    gpt_messages.append({"role": "user", "content": request.message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=gpt_messages,
    )
    reply = response.choices[0].message.content

    # 클라이언트에 반환할 대화 기록 (시스템 프롬프트는 노출하지 않는다).
    save_messages = [
        {"role": msg.role, "content": msg.content} for msg in history
    ]
    save_messages.append({"role": "user", "content": request.message})
    save_messages.append({"role": "assistant", "content": reply})

    return {"reply": reply, "messages": save_messages}