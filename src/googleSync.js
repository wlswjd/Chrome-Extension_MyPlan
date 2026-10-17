/* ==========================================================================
   [Google OAuth 2.0 인증 & Google Calendar / Google Tasks 실시간 연동 모듈]
   - Google Cloud Console에서 발급받은 OAuth 클라이언트 ID를 아래 DEFAULT_GOOGLE_CLIENT_ID에
     넣거나, 확장프로그램 내 [구글 연동 설정] 모달에서 직접 입력해 바로 사용할 수 있습니다.
   ========================================================================== */

export const DEFAULT_GOOGLE_CLIENT_ID =
  "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks",
];

// My Plan 7가지 파스텔 색상 <-> Google Calendar colorId (1~11) 매핑
const MYPLAN_TO_GCAL_COLOR = {
  rose: "4",       // Flamingo (분홍/로즈)
  peach: "6",      // Tangerine (피치/오렌지)
  butter: "5",     // Banana (옐로우)
  sage: "2",       // Sage (민트그린)
  sky: "7",        // Peacock (스카이 블루)
  periwinkle: "9", // Blueberry (블루/퍼리윙클)
  stone: "8",      // Graphite (그레이)
};

const GCAL_TO_MYPLAN_COLOR = {
  "1": "periwinkle", // Lavender
  "2": "sage",       // Sage
  "3": "rose",       // Grape
  "4": "rose",       // Flamingo
  "5": "butter",     // Banana
  "6": "peach",      // Tangerine
  "7": "sky",        // Peacock
  "8": "stone",      // Graphite
  "9": "periwinkle", // Blueberry
  "10": "sage",      // Basil
  "11": "rose",      // Tomato
};

/**
 * 현재 사용할 Google OAuth Client ID 반환 (사용자 입력값 우선 -> 기본 상수)
 */
export function getActiveClientId(customClientId) {
  const trimmed = (customClientId || "").trim();
  if (trimmed && !trimmed.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
    return trimmed;
  }
  if (!DEFAULT_GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
    return DEFAULT_GOOGLE_CLIENT_ID;
  }
  return "";
}

/**
 * 현재 실행 환경의 Redirect URI 반환
 * - 크롬 확장프로그램: https://<EXTENSION_ID>.chromiumapp.org/
 * - 로컬 웹(localhost): 현재 origin
 */
export function getRedirectUri() {
  if (typeof chrome !== "undefined" && chrome.identity?.getRedirectURL) {
    return chrome.identity.getRedirectURL();
  }
  return window.location.origin + window.location.pathname;
}

/**
 * 1) 구글 OAuth 로그인 (액세스 토큰 발급)
 * - manifest.json에 유효한 client_id가 있으면 chrome.identity.getAuthToken을 먼저 시도하고,
 *   UI에서 입력한 Client ID를 쓰거나 웹 환경이면 launchWebAuthFlow / 팝업 OAuth를 사용합니다.
 */
export async function loginWithGoogle(customClientId) {
  const clientId = getActiveClientId(customClientId);

  // 방법 A: 크롬 확장프로그램 네이티브 getAuthToken 시도 (manifest.json에 client_id를 넣은 경우)
  if (
    typeof chrome !== "undefined" &&
    chrome.identity?.getAuthToken &&
    !customClientId
  ) {
    try {
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (tok) => {
          if (chrome.runtime.lastError || !tok) {
            reject(
              new Error(
                chrome.runtime.lastError?.message ||
                  "getAuthToken 토큰 발급 실패"
              )
            );
          } else {
            resolve(tok);
          }
        });
      });
      if (token) return token;
    } catch {
      // manifest.json의 client_id가 아직 기본값이면 아래 WebAuthFlow로 자동 전환
    }
  }

  if (!clientId) {
    throw new Error("NEED_CLIENT_ID");
  }

  const redirectUri = getRedirectUri();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  authUrl.searchParams.set("prompt", "select_account");

  // 방법 B: 크롬 확장프로그램 launchWebAuthFlow (UI에서 Client ID를 입력한 경우 포함)
  if (typeof chrome !== "undefined" && chrome.identity?.launchWebAuthFlow) {
    const responseUrl = await new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive: true },
        (redirectedTo) => {
          if (chrome.runtime.lastError || !redirectedTo) {
            reject(
              new Error(
                chrome.runtime.lastError?.message ||
                  "구글 인증 창이 닫혔거나 실패했습니다."
              )
            );
          } else {
            resolve(redirectedTo);
          }
        }
      );
    });

    const hashParams = new URLSearchParams(
      new URL(responseUrl).hash.replace(/^#/, "")
    );
    const accessToken = hashParams.get("access_token");
    if (!accessToken) {
      throw new Error("액세스 토큰을 가져오지 못했습니다.");
    }
    return accessToken;
  }

  // 방법 C: 일반 브라우저(npm run dev 로컬호스트) 팝업 인증
  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl.toString(),
      "google-oauth-popup",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      reject(new Error("팝업 차단을 해제해 주세요."));
      return;
    }

    const timer = window.setInterval(() => {
      try {
        if (popup.closed) {
          window.clearInterval(timer);
          reject(new Error("구글 로그인 창이 닫혔습니다."));
          return;
        }
        if (popup.location.origin === window.location.origin) {
          const hash = popup.location.hash.replace(/^#/, "");
          const params = new URLSearchParams(hash);
          const token = params.get("access_token");
          window.clearInterval(timer);
          popup.close();
          if (token) {
            resolve(token);
          } else {
            reject(new Error("토큰이 반환되지 않았습니다."));
          }
        }
      } catch {
        // Cross-origin 상태일 때는 무시하고 리다이렉트될 때까지 대기
      }
    }, 400);
  });
}

/**
 * 2) 구글 로그아웃 및 캐시된 토큰 해제
 */
export async function logoutGoogle(token) {
  if (!token) return;
  if (typeof chrome !== "undefined" && chrome.identity?.removeCachedAuthToken) {
    await new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => resolve());
    });
  }
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: "POST",
      headers: { "Content-type": "application/x-www-form-urlencoded" },
    });
  } catch {
    // 네트워크 오류 무시
  }
}

/**
 * 공통 Google API 호출 헬퍼
 */
async function googleApiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    const err = new Error("TOKEN_EXPIRED");
    err.code = 401;
    throw err;
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google API 오류 (${res.status}): ${errText}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * 3) 로그인된 구글 프로필 정보 조회 (이메일, 이름, 프로필 사진)
 */
export async function fetchGoogleUserProfile(token) {
  return googleApiFetch("https://www.googleapis.com/oauth2/v2/userinfo", token);
}

/* ==========================================================================
   [Google Calendar API v3 연동]
   ========================================================================== */

/**
 * 오늘의 일정 & 이번 주(월~일) 구글 캘린더 일정 불러오기
 */
export async function fetchGoogleCalendarEvents(token) {
  const now = new Date();

  // 이번 주 월요일 00:00:00 ~ 일요일 23:59:59 계산
  const dayOfWeek = now.getDay(); // 0(일) ~ 6(토)
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.set("timeMin", weekStart.toISOString());
  url.searchParams.set("timeMax", weekEnd.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const data = await googleApiFetch(url.toString(), token);
  const items = data?.items || [];

  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const dailyEvents = [];
  const weeklyEvents = [];

  items.forEach((item) => {
    if (item.status === "cancelled") return;
    // 시간 지정 일정(dateTime) 위주로 타임라인에 매핑 (종일 일정은 09:00~10:00 기본 매핑)
    const startRaw = item.start?.dateTime || item.start?.date;
    const endRaw = item.end?.dateTime || item.end?.date;
    if (!startRaw) return;

    const startDate = new Date(startRaw);
    const endDate = endRaw ? new Date(endRaw) : new Date(startDate.getTime() + 3600000);

    const startHour = item.start?.dateTime ? startDate.getHours() : 9;
    let endHour = item.end?.dateTime ? endDate.getHours() : 10;
    if (item.end?.dateTime && endDate.getMinutes() > 0 && endHour < 24) {
      endHour = Math.min(24, endHour + 1);
    }
    if (endHour <= startHour) {
      endHour = Math.min(24, startHour + 1);
    }

    const color = GCAL_TO_MYPLAN_COLOR[item.colorId] || "sky";
    const title = item.summary || "(제목 없음)";

    // 요일 인덱스: 월(0) ~ 일(6)
    const jsDay = startDate.getDay();
    const weekDayIdx = jsDay === 0 ? 6 : jsDay - 1;

    weeklyEvents.push({
      id: `gcal-${item.id}`,
      googleEventId: item.id,
      day: weekDayIdx,
      start: startHour,
      end: endHour,
      title,
      color,
      done: endDate < now,
    });

    // 오늘 날짜인 경우 Daily Schedule에도 반영
    if (
      startDate.getFullYear() === todayY &&
      startDate.getMonth() === todayM &&
      startDate.getDate() === todayD
    ) {
      dailyEvents.push({
        id: `gcal-${item.id}`,
        googleEventId: item.id,
        title,
        start: startHour,
        end: endHour,
        color,
      });
    }
  });

  return { dailyEvents, weeklyEvents };
}

/**
 * My Plan에서 일정 추가 시 구글 캘린더에 생성
 * @param {string} token
 * @param {{ title: string, start: number, end: number, color: string, dateObj?: Date }} ev
 */
export async function createGoogleCalendarEvent(token, ev) {
  const baseDate = ev.dateObj ? new Date(ev.dateObj) : new Date();
  const startDt = new Date(baseDate);
  startDt.setHours(ev.start, 0, 0, 0);

  const endDt = new Date(baseDate);
  endDt.setHours(ev.end, 0, 0, 0);

  const body = {
    summary: ev.title,
    start: { dateTime: startDt.toISOString() },
    end: { dateTime: endDt.toISOString() },
    colorId: MYPLAN_TO_GCAL_COLOR[ev.color] || "7",
  };

  return googleApiFetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    token,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

/**
 * My Plan에서 일정 수정 시 구글 캘린더 이벤트 업데이트
 */
export async function updateGoogleCalendarEvent(token, googleEventId, ev) {
  if (!googleEventId) return null;
  const baseDate = ev.dateObj ? new Date(ev.dateObj) : new Date();
  const startDt = new Date(baseDate);
  startDt.setHours(ev.start, 0, 0, 0);

  const endDt = new Date(baseDate);
  endDt.setHours(ev.end, 0, 0, 0);

  const body = {
    summary: ev.title,
    start: { dateTime: startDt.toISOString() },
    end: { dateTime: endDt.toISOString() },
    colorId: MYPLAN_TO_GCAL_COLOR[ev.color] || "7",
  };

  return googleApiFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
      googleEventId
    )}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

/**
 * My Plan에서 일정 삭제 시 구글 캘린더 이벤트 삭제
 */
export async function deleteGoogleCalendarEvent(token, googleEventId) {
  if (!googleEventId) return;
  return googleApiFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
      googleEventId
    )}`,
    token,
    {
      method: "DELETE",
    }
  );
}

/* ==========================================================================
   [Google Tasks API v1 연동]
   - 할 일 제목 또는 notes 필드에 태그(#학습 등)를 함께 저장하여 양방향 복원
   ========================================================================== */

const VALID_TAGS = ["학습", "운동", "공부", "업무", "휴식", "식사", "기타"];

function parseTaskFromGoogle(gTask) {
  let rawTitle = (gTask.title || "").trim();
  let tag = "학습";

  // notes에 [tag:운동] 형식이 있거나 제목 앞에 [#운동] 이 있으면 태그로 추출
  const noteMatch = (gTask.notes || "").match(/\[tag:([^\]]+)\]/);
  if (noteMatch && VALID_TAGS.includes(noteMatch[1])) {
    tag = noteMatch[1];
  } else {
    const prefixMatch = rawTitle.match(/^\[#([^\]]+)\]\s*(.+)$/);
    if (prefixMatch && VALID_TAGS.includes(prefixMatch[1])) {
      tag = prefixMatch[1];
      rawTitle = prefixMatch[2];
    }
  }

  return {
    id: `gtask-${gTask.id}`,
    googleTaskId: gTask.id,
    title: rawTitle || "(할 일)",
    tag,
    done: gTask.status === "completed",
  };
}

/**
 * Google Tasks 기본 목록(@default)에서 할 일 전체 불러오기
 */
export async function fetchGoogleTasks(token) {
  const url = new URL(
    "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks"
  );
  url.searchParams.set("showCompleted", "true");
  url.searchParams.set("showHidden", "true");
  url.searchParams.set("maxResults", "100");

  const data = await googleApiFetch(url.toString(), token);
  const items = (data?.items || []).filter(
    (item) => !item.deleted && (item.title || "").trim() !== ""
  );

  return items.map(parseTaskFromGoogle);
}

/**
 * My Plan에서 새 할 일 추가 시 Google Tasks에 생성
 */
export async function createGoogleTask(token, { title, tag, done }) {
  const body = {
    title,
    notes: `[tag:${tag || "학습"}]`,
    status: done ? "completed" : "needsAction",
  };

  return googleApiFetch(
    "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
    token,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

/**
 * My Plan에서 할 일 완료/미완료 체크 시 Google Tasks 상태 업데이트
 */
export async function updateGoogleTaskStatus(token, googleTaskId, done) {
  if (!googleTaskId) return null;
  const body = {
    status: done ? "completed" : "needsAction",
    completed: done ? new Date().toISOString() : null,
  };

  return googleApiFetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(
      googleTaskId
    )}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

/**
 * My Plan에서 할 일 삭제 시 Google Tasks에서도 삭제
 */
export async function deleteGoogleTask(token, googleTaskId) {
  if (!googleTaskId) return;
  return googleApiFetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(
      googleTaskId
    )}`,
    token,
    {
      method: "DELETE",
    }
  );
}
