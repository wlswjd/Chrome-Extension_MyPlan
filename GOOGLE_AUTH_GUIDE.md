# Google 로그인 & 캘린더·할일 연동 완벽 가이드 (`GOOGLE_AUTH_GUIDE.md`)

이 문서는 **1) 지금 내 컴퓨터(로컬)에서 테스트할 때 설정하는 방법**과, **2) 나중에 Chrome 웹 스토어에 정식 배포했을 때 일반 사용자들이 복잡한 Client ID 입력 없이 '버튼 클릭 한 번'으로 바로 구글 로그인을 쓰게 만드는 방법**을 단계별로 설명합니다.

---

## 왜 지금은 내가 직접 Client ID를 넣어야 하나요?

구글은 보안상 **"어느 앱(확장프로그램 주소)에서 구글 캘린더/할 일 데이터를 요청하는지"**를 미리 등록된 `Client ID`로 검사합니다.
현재는 아직 스토어에 출시하기 전이라 개발자님만의 Google Cloud 프로젝트가 연결되어 있지 않기 때문에, **최초 1회 Google Cloud Console에서 무료로 Client ID를 발급받아 연결**해 주시면 됩니다.

한 번 발급받아 코드(`manifest.json` 및 `src/googleSync.js`)에 넣어두고 웹 스토어에 배포하면, **일반 사용자들은 Client ID가 뭔지 전혀 몰라도 `[Google 계정으로 연동하기]` 버튼만 누르면 즉시 로그인됩니다!**

---

## Part 1. 내 로컬 환경에서 테스트하기 (최초 5분 설정)

### 1단계: Google Cloud 프로젝트 생성 및 API 2개 켜기
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 구글 계정으로 로그인합니다.
2. 좌측 상단의 프로젝트 선택 드롭다운을 눌러 **[새 프로젝트]**를 만들고 이름(예: `My Plan Extension`)을 지정합니다.
3. 좌측 메뉴에서 **[API 및 서비스] → [라이브러리]**로 이동합니다.
4. 검색창에 아래 2개의 API를 각각 검색해서 **[사용(Enable)]** 버튼을 누릅니다.
   - **`Google Calendar API`** (일정 연동용)
   - **`Google Tasks API`** (할 일 연동용)

### 2단계: OAuth 동의 화면(Consent Screen) 설정하기
1. 좌측 메뉴에서 **[API 및 서비스] → [OAuth 동의 화면]**으로 이동합니다.
2. User Type에서 **`외부(External)`**를 선택하고 **[만들기]**를 누릅니다.
3. 필수 항목 3가지만 입력하고 **[저장 후 계속]**을 누릅니다.
   - **앱 이름**: `My Plan - Daily Planner`
   - **사용자 지원 이메일**: 본인 이메일 선택
   - **개발자 연락처 정보**: 본인 이메일 입력
4. **범위(Scopes)** 단계에서는 **[범위 추가 또는 삭제]**를 누르고 아래 항목들을 체크한 뒤 업데이트합니다 (건너뛰어도 로컬 테스트는 가능하지만, 정식 배포 시 필요합니다):
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/tasks`
5. **테스트 사용자(Test users)** 단계에서 **[+ ADD USERS]**를 눌러 **본인이 로그인 테스트에 사용할 구글 이메일 주소**를 추가하고 저장합니다.
   - *주의: 앱이 '테스트(Testing)' 상태일 때는 여기에 등록된 이메일로만 로그인이 허용됩니다.*

### 3단계: OAuth 클라이언트 ID 발급받기 (로컬 테스트용)
로컬에서 빠르게 테스트할 때는 **`웹 애플리케이션`** 유형으로 발급받는 것이 가장 편리합니다 (`localhost`와 크롬 확장프로그램 둘 다 호환됨).

1. 우리 확장프로그램을 열고 우측 상단 **⚙️ 설정 → `Google 계정으로 연동하기`** (또는 열쇠 아이콘 `🔑`)를 클릭합니다.
2. 모달 창 첫 번째 줄에 표시된 **`1. 승인된 리디렉션 URI`** 옆의 **[복사]** 버튼을 누릅니다.
   - 크롬 확장프로그램에서 열었을 때: `https://<확장프로그램ID>.chromiumapp.org/` 형태가 복사됩니다.
   - `npm run dev` 웹에서 열었을 때: `http://localhost:5173/` 형태가 복사됩니다.
3. 다시 Google Cloud Console의 **[API 및 서비스] → [사용자 인증 정보]**로 이동합니다.
4. 상단의 **[+ 사용자 인증 정보 만들기] → [OAuth 클라이언트 ID]**를 클릭합니다.
5. **애플리케이션 유형**을 **`웹 애플리케이션`**으로 선택합니다.
6. 하단의 **[승인된 리디렉션 URI]**에서 **[+ URI 추가]**를 누르고, 방금 복사한 주소를 붙여넣습니다.
   - *(팁: 확장프로그램 주소 `https://<ID>.chromiumapp.org/`와 로컬 주소 `http://localhost:5173/` 두 개를 모두 추가해 두면 어디서든 작동합니다!)*
7. **[만들기]**를 누르면 `xxxx...apps.googleusercontent.com` 형태의 **클라이언트 ID**가 발급됩니다.
8. 이 클라이언트 ID를 복사해서 우리 확장프로그램의 **Google 설정 모달 2번 칸**에 붙여넣고 **[저장 후 Google 로그인]**을 누르면 즉시 내 구글 캘린더·할 일과 연동됩니다!

---

## Part 2. 크롬 웹 스토어 배포 시 일반 사용자가 '원클릭'으로 로그인하게 만드는 법

스토어에서 다운받은 사용자들은 당연히 Client ID를 입력할 필요가 없어야 합니다. 배포 전에 개발자님이 **코드에 Client ID를 박아두기만 하면**, 사용자들에게는 Client ID 입력 창이 아예 뜨지 않고 **구글 계정 선택 창만 깔끔하게 뜹니다.**

### 1) 코드에 내 Client ID 고정하기
발급받은 Client ID를 아래 두 파일에 복사해 넣어두세요.

1. **`src/googleSync.js` (7번째 줄)**:
   ```js
   export const DEFAULT_GOOGLE_CLIENT_ID =
     "여기에_발급받은_클라이언트_ID.apps.googleusercontent.com";
   ```
2. **`public/manifest.json` (28번째 줄)**:
   ```json
   "oauth2": {
     "client_id": "여기에_발급받은_클라이언트_ID.apps.googleusercontent.com",
     ...
   }
   ```

이렇게 `DEFAULT_GOOGLE_CLIENT_ID`에 실제 값이 들어가 있으면, 우리 코드는 자동으로 그것을 감지하여 **일반 사용자가 `[Google 계정으로 연동하기]` 버튼을 누르는 즉시 Client ID 설정 모달을 건너뛰고 구글 로그인 창을 바로 띄웁니다.**

### 2) 크롬 확장프로그램 전용 `chrome.identity.getAuthToken` (가장 매끄러운 원클릭 방식)
크롬 웹 스토어에 확장프로그램을 업로드하면 **고정된 확장프로그램 ID(32자리 영문 소문자, 예: `abcdefghijklmnopqrstuvwxyzabcdef`)**가 부여됩니다.

1. Google Cloud Console → **[사용자 인증 정보] → [+ 사용자 인증 정보 만들기] → [OAuth 클라이언트 ID]**로 이동합니다.
2. 애플리케이션 유형을 **`Chrome 확장 프로그램(Chrome Extension)`**으로 선택합니다.
3. **애플리케이션 ID(Item ID)** 칸에 크롬 웹 스토어 대시보드에서 확인한 32자리 확장프로그램 ID를 입력합니다.
4. 생성된 클라이언트 ID를 `public/manifest.json`의 `oauth2.client_id`와 `src/googleSync.js`의 `DEFAULT_GOOGLE_CLIENT_ID`에 넣고 `npm run build`를 실행합니다.
5. 이 방식(`getAuthToken`)이 활성화되면 사용자는 별도의 웹 로그인 창에 비밀번호를 다시 칠 필요도 없이, **현재 크롬 브라우저에 로그인되어 있는 구글 계정으로 1초 만에 원클릭 권한 승인**이 완료됩니다!

### 3) 모든 구글 사용자가 로그인할 수 있도록 '프로덕션 게시' 전환하기
- Google Cloud Console → **[OAuth 동의 화면]**에서 **"게시 상태(Publishing status)"**가 `테스트(Testing)`로 되어 있으면 내가 등록한 테스트 이메일만 로그인할 수 있습니다.
- 스토어에 배포할 때는 **[앱 게시(Publish App)]** 버튼을 눌러 **`프로덕션(In production)`** 상태로 전환해 주세요.
- *(참고: `calendar.events` 및 `tasks` 권한은 민감한 범위이므로, 프로덕션 전환 후 구글 측의 간단한 앱 확인(Verification) 절차를 거치면 "확인되지 않은 앱" 경고 화면 없이 전 세계 모든 사용자가 깔끔하게 로그인할 수 있습니다.)*
