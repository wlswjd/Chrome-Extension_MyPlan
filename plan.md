# My Plan - 향후 업데이트 및 고도화 계획 (Roadmap & Implementation Plan)

현재 버전(`v0.1.0`)은 초기 실행 시 `src/App.jsx` 상단에 정의된 **더미(샘플) 데이터(`seedTasks`, `seedEvents`, `seedWeeklyEvents`, `seedFocusSessions`)**를 불러오며, 이후 사용자가 수정하거나 추가한 내용은 브라우저의 **`localStorage`에 로컬로 저장**되는 방식입니다.

앞으로 실제 서비스 수준의 크롬 확장 프로그램으로 발전시키기 위한 단계별 추가 기능 계획과 구현 방법입니다.

---

## 0. 더미 데이터 제거 및 실제 데이터 초기화 전환
- **목표**: 테스트용 더미 데이터를 제거하고, 첫 설치 시 깔끔한 빈 상태(Empty State)에서 시작하거나 샘플 데이터 불러오기 옵션을 제공
- **구현 방법**:
  - `src/App.jsx`의 `seedTasks`, `seedEvents`, `seedWeeklyEvents`, `seedFocusSessions` 기본값을 빈 배열(`[]`)로 변경
  - 설정(Settings) 메뉴에 **"샘플 데이터 채우기"** 및 **"전체 데이터 초기화(Reset)"** 버튼 추가
  - 크롬 브라우저 간 동기화를 위해 `localStorage` 대신 `chrome.storage.local` / `chrome.storage.sync` 래퍼 함수로 마이그레이션

---

## 1. 구글 로그인 & 구글 캘린더 / 구글 Tasks 연동

### 1-1) 구글 계정 / 이메일 로그인
- **목표**: 크롬 확장 프로그램에서 흔히 사용하는 간편 구글 로그인 및 이메일 로그인 지원
- **어떻게 구현할지**:
  1. **Chrome Identity API (`chrome.identity.getAuthToken` 또는 `launchWebAuthFlow`) 활용**:
     - `public/manifest.json`에 `"permissions": ["identity", "storage"]` 및 Google Cloud Console에서 발급받은 `oauth2.client_id` 등록
     - 사용자가 설정 또는 상단 프로필 버튼에서 **"Google로 계속하기"** 클릭 시 크롬 브라우저에 로그인된 구글 계정으로 원클릭 OAuth 토큰 발급
  2. **이메일 로그인 (선택 사항 - Firebase Auth 또는 Supabase Auth)**:
     - 백엔드 서버를 직접 구축하지 않고 **Supabase**나 **Firebase Authentication**을 연결하면 구글 OAuth 로그인과 이메일/비밀번호(또는 매직링크) 로그인을 동시에 처리 가능
     - 로그인된 유저의 `user_id`를 기준으로 시간표·할 일·집중 기록을 클라우드 DB에 백업 및 기기 간 동기화

### 1-2) 구글 캘린더(Google Calendar) & 구글 할 일(Google Tasks) 양방향 연동
- **목표**: 구글 캘린더의 일정을 `Daily Schedule` / `주간 계획표`에 자동으로 불러오고, 확장 프로그램에서 추가한 일정도 구글 캘린더에 반영
- **어떻게 구현할지**:
  1. **Google Calendar API v3 연동**:
     - OAuth 스코프에 `https://www.googleapis.com/auth/calendar.events` 추가
     - **불러오기(GET)**: 오늘 날짜(`timeMin` ~ `timeMax`) 또는 이번 주 날짜 범위의 일정을 조회(`GET /calendar/v3/calendars/primary/events`)하여 타임라인 시간대에 자동 매핑
     - **내보내기(POST/PATCH)**: 타임라인에서 일정을 저장할 때 구글 캘린더에도 함께 생성 (구글 캘린더의 `colorId`와 확장 프로그램의 7가지 파스텔 색상 매핑)
  2. **Google Tasks API 연동 (선택)**:
     - `To-Do List` 탭의 할 일 목록과 구글 Tasks 목록을 동기화하여 모바일 구글 캘린더/Tasks 앱에서도 확인 가능하도록 구성

---

## 2. 설정(Settings) 내 'Rate Us (별점 남기기)' 옵션 추가

- **목표**: 사용자가 확장 프로그램에 만족했을 때 손쉽게 크롬 웹 스토어 리뷰/별점을 남길 수 있도록 유도
- **어떻게 구현할지**:
  1. **UI 구성**:
     - 상단 톱니바퀴(`Settings`) 팝오버 메뉴 안에 `⭐ Rate Us (별점 남기기)` 행(Row) 추가
  2. **동작 방식**:
     - 클릭 시 크롬 웹 스토어 리뷰 페이지 URL(`https://chromewebstore.google.com/detail/<EXTENSION_ID>/reviews`)을 새 탭(`window.open` 또는 `chrome.tabs.create`)으로 열기
     - (선택) 팝오버 안에서 별 1~5개(`★★★★★`)를 먼저 클릭하게 한 뒤, 4~5점이면 크롬 웹 스토어 리뷰 페이지로 이동하고, 1~3점이면 개선 의견을 적을 수 있는 간단한 피드백 폼(Google Forms 등)으로 연결하는 스마트 리뷰 유도 방식 적용 가능

---

## 3. 설정 하단 `?` (도움말 / 정보) 버튼 및 모달 추가

- **목표**: 설정 메뉴 맨 아래에 `?` 아이콘 버튼을 배치하고, 클릭 시 프로젝트 정보·라이선스·GitHub 링크 등을 깔끔하게 표시
- **어떻게 구현할지**:
  1. **UI 위치**:
     - `settings-popover` 하단 우측(또는 하단 바)에 `?` (`HelpCircle` 아이콘) 버튼 배치
  2. **표시할 상세 정보 (모달 또는 아코디언 뷰)**:
     - **앱 버전**: `My Plan v0.1.0`
     - **GitHub 저장소**: 아이콘과 함께 클릭 시 공식 GitHub Repository 새 탭 이동 (`https://github.com/<username>/my-plan-extension`)
     - **라이선스 정보 (License)**: MIT License 명시 및 오픈소스 라이브러리(React, Lucide Icons, Vite 등) 고지
     - **문의 / 버그 제보**: GitHub Issues 링크 또는 개발자 이메일 주소 표시

---

## 4. 개발자 후원 기능 (Buy Me a Coffee / 간편 페이 후원)

- **목표**: 무료로 확장 프로그램을 배포하면서 사용자들이 자발적으로 개발자에게 커피 한 잔을 후원할 수 있는 창구 마련
- **어떻게 구현할지**:
  1. **UI 배치 (부담스럽지 않고 자연스러운 위치)**:
     - 설정(`Settings`) 메뉴 하단(`?` 버튼 옆) 또는 전체 분석 페이지 하단에 `☕ 개발자에게 커피 사주기 (Buy Me a Coffee)` 버튼 배치
  2. **연동 플랫폼 후보 (코드 한 줄/링크나 QR 모달로 바로 적용 가능)**:
     - **글로벌**: [Buy Me a Coffee](https://www.buymeacoffee.com/) 또는 **GitHub Sponsors**, **Ko-fi** 링크 연결
     - **국내 사용자용**: **카카오페이 송금 QR 코드** 또는 **토스(Toss) 익명 송금 링크/QR**을 작은 팝업 이미지로 띄워주기
  3. **구현 방식**:
     - 커피 아이콘 버튼을 누르면 작은 모달이 열리면서 *"My Plan이 도움이 되셨다면 따뜻한 커피 한 잔으로 응원해 주세요!"* 문구와 함께 `[Buy Me a Coffee 이동]` 버튼 + `[카카오페이/토스 QR 보기]` 탭을 표시

---

## 5. 추천 구현 순서 (우선순위)

1. **1단계 (UI/설정 마감)**: 설정 메뉴에 `Rate Us`, `? (GitHub/라이선스 정보)`, `☕ 커피 후원하기` 버튼 및 모달 추가 + 더미 데이터 초기화 버튼 추가
2. **2단계 (인증 연동)**: `manifest.json` OAuth 설정 및 Google 계정 로그인 UI 연결
3. **3단계 (데이터 연동)**: Google Calendar API를 통한 일일/주간 스케줄 동기화
