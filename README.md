# 하늘길 여행사 AI 상담 챗봇 README

## 프로젝트 소개

하늘길 여행사 AI 상담 챗봇은 여행 상담에 특화된 AI 고객센터 웹 애플리케이션입니다. KDT 두드림 1차 프로젝트로 작성된 코드이며, 사용자의 여행지, 여행 시기, 인원, 출발지, 예산 정보를 순서대로 수집한 뒤 여행 일정 추천을 돕는 것을 목표로 합니다.

현재 기준 프로젝트는 `C:\yoo\skyweb`이며, `D:\yoo\skyweb_완성본\skyweb_수업완성본`은 구조와 구현 흐름을 참고하기 위한 비교용으로만 확인했습니다.

## 아키텍처 개요

```text
React 프론트엔드
  -> POST /api/chat
FastAPI 백엔드
  -> OpenAI Chat Completions API
FastAPI 백엔드
  -> JSON 응답(reply, messages)
React 프론트엔드
```

- 프론트엔드는 React + Vite 기반으로 사용자 입력 UI를 제공합니다.
- 백엔드는 FastAPI로 `/api/chat` 엔드포인트를 제공하고, OpenAI API에 시스템 프롬프트와 대화 맥락을 전달합니다.
- OpenAI API 키와 모델명은 `.env` 환경변수를 통해 관리합니다.

## 기술 스택

### Backend

`requirements.txt` 기준입니다. 버전은 고정되어 있지 않습니다.

- `fastapi`
- `uvicorn[standard]`
- `openai`
- `python-dotenv`
- `pydantic`은 FastAPI 의존성 및 코드 import를 통해 사용됩니다.

### Frontend

`frontend/package.json` 기준입니다.

- `react`: `^19.2.7`
- `react-dom`: `^19.2.7`
- `vite`: `^8.1.1`
- `@vitejs/plugin-react`: `^6.0.3`
- `bootstrap`: `^5.3.8`
- `react-bootstrap`: `^2.10.10`
- `eslint`: `^10.6.0`

루트 `package.json`에는 `bootstrap`, `react-bootstrap` 의존성이 별도로 기록되어 있습니다.

## 프로젝트 구조

GitHub 업로드 기준으로 생성물과 개인 환경 파일은 제외해 정리했습니다. 제외 대상: `.env`, `.venv`, `node_modules`, `dist`, `__pycache__`.

```text
skyweb/
├─ requirements.txt
├─ package.json
├─ package-lock.json
├─ backend/
│  ├─ main.py
│  ├─ main1.py
│  ├─ test.py
│  └─ test1.py
└─ frontend/
   ├─ package.json
   ├─ package-lock.json
   ├─ vite.config.js
   ├─ eslint.config.js
   ├─ index.html
   ├─ README.md
   ├─ public/
   │  ├─ favicon.svg
   │  └─ icons.svg
   └─ src/
      ├─ main.jsx
      ├─ App.jsx
      ├─ App.css
      ├─ index.css
      └─ assets/
         ├─ hero.png
         ├─ react.svg
         └─ vite.svg
```

## Backend 분석: `backend/main.py`

### 설정 및 환경변수

- `load_dotenv()`로 `.env` 파일을 로드합니다.
- `MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")`
- `FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")`
- `MAX_HISTORY_MESSAGES = 12`
- `OpenAI(api_key=os.getenv("OPENAI_API_KEY"))`로 OpenAI 클라이언트를 생성합니다.

`FRONTEND_ORIGIN` 변수는 선언되어 있지만 현재 `backend/main.py`에서는 CORS 미들웨어 설정에 사용되지 않습니다.

### SYSTEM_PROMPT 구조

`SYSTEM_PROMPT`는 XML 태그처럼 구역을 나누어 여행 상담 AI의 행동 원칙을 정의합니다.

- `<역할>`: 하늘길 여행사의 고객센터 AI 상담원 역할
- `<대화_원칙>`: 존댓말, 5문장 이내, 다음 행동 제안
- `<정보_수집_절차>`: 여행 시기, 인원, 출발지, 예산 순서로 정보 수집
- `<사실_기준>`: 실시간 가격/좌석/예약 가능 여부는 확정하지 않고 직원 확인 안내
- `<범위_밖_질문>`: 여행 외 질문은 정중히 범위 밖으로 안내
- `<안전>`: 주민번호, 카드번호 등 개인정보를 요구하지 않고 결제/계약은 직원 연결 안내

### Pydantic 모델 3종

- `ChatMessage`
  - `role`: `"user"` 또는 `"assistant"`
  - `content`: 최소 길이 1 이상의 문자열
- `ChatRequest`
  - `message`: 현재 사용자의 새 질문
  - `messages`: 이전 대화 목록, 기본값은 빈 리스트
- `ChatResponse`
  - `reply`: AI 응답 문자열
  - `messages`: 프론트엔드가 저장할 대화 목록

### `/api/chat` 엔드포인트

- 경로: `POST /api/chat`
- 응답 모델: `ChatResponse`
- 처리 흐름:
  1. 프론트에서 받은 이전 대화 중 최근 `MAX_HISTORY_MESSAGES`개만 사용합니다.
  2. OpenAI에 전달할 `gpt_messages`를 만듭니다.
  3. 시스템 프롬프트, 이전 대화, 새 사용자 질문 순서로 메시지를 조립합니다.
  4. `client.chat.completions.create()`로 OpenAI API를 호출합니다.
  5. 응답의 `response.choices[0].message.content`를 `reply`로 꺼냅니다.
  6. 프론트에 돌려줄 `save_messages`에 history, 현재 user 메시지, assistant 응답을 저장합니다.

### History 슬라이싱

```python
history = request.messages[-MAX_HISTORY_MESSAGES:]
```

프론트에서 전달된 이전 대화 중 마지막 12개만 OpenAI 요청에 포함합니다. 토큰 사용량과 불필요한 긴 대화 맥락을 제한하려는 구조입니다.

### `gpt_messages` 조립 방식

```text
1. system 메시지: SYSTEM_PROMPT
2. history 메시지들: request.messages의 최근 12개
3. user 메시지: request.message
```

시스템 프롬프트는 OpenAI 요청에는 포함되지만, 프론트로 반환되는 `messages`에는 포함하지 않습니다.

## Frontend 분석: `frontend/src/App.jsx`

### 컴포넌트 구조

- 단일 `App` 컴포넌트로 구성되어 있습니다.
- `react-bootstrap`의 `Container`, `Row`, `Col`, `Button`, `Form`, `Card`, `InputGroup`를 사용합니다.
- 좌측 사이드바에는 서비스명, 안내 문구, 대화 초기화 버튼이 배치되어 있습니다.
- 우측 영역에는 상담 제목, 안내 문구, 메시지 카드 목록, 입력 폼이 배치되어 있습니다.

### 상태 관리

`useState`로 3가지 상태를 선언합니다.

- `input`: textarea 입력값
- `messages`: 화면에 표시할 대화 목록
- `isLoading`: 로딩 상태. 현재 선언되어 있지만 화면 표시나 버튼 상태 제어에는 아직 사용되지 않습니다.

### Fetch 연동 상태

현재 `handleSubmit()`에서 `/api/chat`으로 `fetch` 요청을 보내는 골격은 구현되어 있습니다.

```js
fetch(`${API_BASE_URL}/api/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: input,
    messages: [],
  }),
})
```

진행 중인 부분은 다음과 같습니다.

- `messages: []`로 고정 전송하고 있어 기존 대화 history가 백엔드로 전달되지 않습니다.
- 서버 응답 `data`는 `console.log(data)`만 하고, assistant 응답을 `messages` 상태에 추가하지 않습니다.
- 화면에는 현재 사용자가 입력한 메시지만 카드로 표시됩니다.
- `isLoading` 상태는 선언되어 있지만 `setIsLoading()` 호출 및 UI 반영이 없습니다.
- 대화 초기화 버튼은 표시되어 있으나 현재 `onClick` 핸들러가 연결되어 있지 않습니다.
- API 주소는 `http://127.0.0.1:8000`으로 고정되어 있습니다.
- 백엔드 기준 파일에는 CORS 미들웨어가 없어, 브라우저에서 프론트-백 연동 시 CORS 설정이 추가로 필요할 수 있습니다.

## 설치 및 실행 방법

아래 명령은 프로젝트 루트 `C:\yoo\skyweb` 기준입니다.

### 1. 백엔드 가상환경 생성 및 패키지 설치

```bash
cd C:\yoo\skyweb
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 환경변수 파일 준비

프로젝트 루트에 `.env` 파일을 준비합니다. 실제 값은 README나 GitHub에 올리지 않습니다.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
FRONTEND_ORIGIN=http://localhost:5173
```

필수 항목은 `OPENAI_API_KEY`입니다. `OPENAI_MODEL`, `FRONTEND_ORIGIN`은 코드상 기본값이 있습니다.

### 3. 백엔드 실행

```bash
uvicorn backend.main:app --reload
```

기본 실행 주소는 보통 `http://127.0.0.1:8000`입니다.

### 4. 프론트엔드 패키지 설치 및 실행

```bash
cd C:\yoo\skyweb\frontend
npm install
npm run dev
```

Vite 개발 서버 기본 주소는 보통 `http://localhost:5173`입니다.

## 환경변수 안내

`.env` 파일은 GitHub에 올리면 안 됩니다. 아래 변수 이름만 공유합니다.

- `OPENAI_API_KEY`: OpenAI API 호출용 키
- `OPENAI_MODEL`: 사용할 OpenAI 모델명, 기본값 `gpt-4.1-mini`
- `FRONTEND_ORIGIN`: 프론트엔드 개발 서버 주소, 기본값 `http://localhost:5173`

## 현재 상태 / 남은 작업

- 백엔드 `/api/chat` 엔드포인트와 OpenAI 연동 구조는 구현되어 있습니다.
- 백엔드에는 여행 상담용 `SYSTEM_PROMPT`, Pydantic 요청/응답 모델, history 슬라이싱, OpenAI 메시지 조립 로직이 있습니다.
- 프론트엔드는 React Bootstrap 기반 UI와 입력 폼, `fetch` 요청 골격이 구현되어 있습니다.
- 프론트-백 대화 연동은 진행 중입니다. 현재 assistant 응답을 화면에 표시하지 않고, 이전 대화 history도 서버로 전달하지 않습니다.
- 백엔드 CORS 설정은 기준 파일 `backend/main.py`에서 미확인입니다. 프론트 개발 서버와 연동하려면 CORS 미들웨어 추가가 필요할 수 있습니다.
- `.env`, `.venv`, `node_modules`, `dist`, `__pycache__`는 GitHub 업로드 대상에서 제외해야 합니다.
- 테스트 자동화는 확인되지 않았습니다.

## 한글 깨짐 확인 파일 목록

UTF-8로 읽은 `backend/main.py`와 `frontend/src/App.jsx`의 주요 한글 문자열은 정상으로 확인했습니다. 다만 아래 파일은 대체 문자로 보이는 `?`가 한글 제목/문장 근처에 있어 원문 확인 대상으로 따로 기록합니다.

```text
C:\yoo\skyweb\backend\main1.py
```

## 참고 비교 메모

강사 완성본(`D:\yoo\skyweb_완성본\skyweb_수업완성본`)에는 다음 구현이 추가로 확인됩니다. 기준 프로젝트에 이미 있다고 단정하지 않고, 남은 작업 참고로만 봅니다.

- 백엔드: `CORSMiddleware` 설정
- 프론트엔드: assistant 응답 화면 표시, history 전달, 로딩 Spinner, 대화 초기화 핸들러, Enter 전송 처리, 메시지 하단 자동 스크롤
