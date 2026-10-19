/* ==========================================================================
   [Google OAuth 2.0 인증 & Google Calendar / Google Tasks 실시간 연동 모듈]
   - Google Cloud Console에서 발급받은 OAuth 클라이언트 ID를 아래 DEFAULT_GOOGLE_CLIENT_ID에
     넣거나, 확장프로그램 내 [구글 연동 설정] 모달에서 직접 입력해 바로 사용할 수 있습니다.
   ========================================================================== */

export const DEFAULT_GOOGLE_CLIENT_ID =
  "361625898849-q26bk8vkgtghucrbn9g314l1qpms622g.apps.googleusercontent.com";

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
 * @param {string} customClientId
 * @param {{ interactive?: boolean, loginHint?: string }} options
 */
export async function loginWithGoogle(customClientId, options = {}) {
  const interactive = options.interactive !== undefined ? options.interactive : true;
  const clientId = getActiveClientId(customClientId);

  if (!clientId) {
    throw new Error("NEED_CLIENT_ID");
  }

  const redirectUri = getRedirectUri();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  if (interactive) {
    authUrl.searchParams.set("prompt", "select_account");
  } else {
    authUrl.searchParams.set("prompt", "none");
    if (options.loginHint) {
      authUrl.searchParams.set("login_hint", options.loginHint);
    }
  }

  // 방법 A: 크롬 확장프로그램 launchWebAuthFlow (웹 애플리케이션 Client ID + chromiumapp.org 리디렉션 URI 방식)
  if (typeof chrome !== "undefined" && chrome.identity?.launchWebAuthFlow) {
    const responseUrl = await new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive },
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

    const isRecurring = Boolean(item.recurringEventId);

    weeklyEvents.push({
      id: `gcal-${item.id}`,
      googleEventId: item.id,
      recurringEventId: item.recurringEventId || null,
      isWeekdayRoutine: isRecurring,
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
        recurringEventId: item.recurringEventId || null,
        isWeekdayRoutine: isRecurring,
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
 * - isWeekdayRoutine이 true이면 이번 주 월~금(BYDAY=MO,TU,WE,TH,FR)에만 반복되도록
 *   이번 주 금요일 23:59:59 UTC를 UNTIL로 지정하여 다음 주/내년까지 무한 반복되지 않고 깔끔하게 유지됩니다.
 * @param {string} token
 * @param {{ title: string, start: number, end: number, color: string, dateObj?: Date, isWeekdayRoutine?: boolean }} ev
 */
export async function createGoogleCalendarEvent(token, ev) {
  const baseDate = ev.dateObj ? new Date(ev.dateObj) : new Date();

  // 평일 반복 일정인 경우 해당 주의 월요일을 시작 기준일로 맞추고, 해당 주 금요일을 종료일(UNTIL)로 계산
  let untilRulePart = "";
  if (ev.isWeekdayRoutine) {
    const day = baseDate.getDay(); // 0(일) ~ 6(토)
    const diffToMon = day === 0 ? -6 : 1 - day;
    baseDate.setDate(baseDate.getDate() + diffToMon);

    const fridayEnd = new Date(baseDate);
    fridayEnd.setDate(baseDate.getDate() + 4);
    fridayEnd.setHours(23, 59, 59, 0);
    const untilUtc = fridayEnd
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
    untilRulePart = `;UNTIL=${untilUtc}`;
  }

  const startDt = new Date(baseDate);
  startDt.setHours(ev.start, 0, 0, 0);

  const endDt = new Date(baseDate);
  endDt.setHours(ev.end, 0, 0, 0);

  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

  const body = {
    summary: ev.title,
    start: { dateTime: startDt.toISOString(), timeZone },
    end: { dateTime: endDt.toISOString(), timeZone },
    colorId: MYPLAN_TO_GCAL_COLOR[ev.color] || "7",
    ...(ev.isWeekdayRoutine
      ? {
          recurrence: [
            `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR${untilRulePart}`,
          ],
        }
      : {}),
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

  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

  const body = {
    summary: ev.title,
    start: { dateTime: startDt.toISOString(), timeZone },
    end: { dateTime: endDt.toISOString(), timeZone },
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
 * - 반복 일정(recurringEventId 또는 master ID)인 경우 단일 인스턴스가 아닌
 *   전체 반복 시리즈(모든 주·모든 연도)를 한 번에 완전히 삭제합니다.
 * - 로컬 이벤트에 googleEventId가 유실되었더라도 title/start가 전달되면
 *   구글 캘린더에서 동일한 제목의 반복/단일 일정을 찾아 함께 삭제합니다.
 */
export async function deleteGoogleCalendarEvent(
  token,
  googleEventId,
  options = {}
) {
  if (!token) return;
  const deletedIds = new Set();

  // 1) recurringEventId 또는 인스턴스 ID(xxxx_20261012T...)에서 마스터 이벤트 ID 추출
  const candidateIds = [];
  if (options.recurringEventId) {
    candidateIds.push(options.recurringEventId);
  }
  if (googleEventId) {
    const cleanId = String(googleEventId).replace(/^gcal-/, "");
    if (cleanId.includes("_")) {
      candidateIds.push(cleanId.split("_")[0]);
    }
    candidateIds.push(cleanId);
  }

  for (const cid of candidateIds) {
    if (!cid || deletedIds.has(cid)) continue;
    deletedIds.add(cid);
    try {
      await googleApiFetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
          cid
        )}`,
        token,
        { method: "DELETE" }
      );
    } catch {
      // 이미 삭제되었거나 존재하지 않는 ID는 무시
    }
  }

  // 2) 제목(title) 기준으로 남아있는 동일 반복 시리즈(RRULE) 또는 동일 시간대 일정 검색 후 완전 삭제
  if (options.title) {
    try {
      const url = new URL(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events"
      );
      // singleEvents=false 로 조회하면 모든 연도/주에 걸친 마스터 반복 일정(RRULE)이 직접 반환됨
      url.searchParams.set("singleEvents", "false");
      url.searchParams.set("q", options.title);
      url.searchParams.set("maxResults", "100");

      const data = await googleApiFetch(url.toString(), token);
      const items = data?.items || [];

      for (const item of items) {
        if (!item?.id || deletedIds.has(item.id) || item.status === "cancelled") {
          continue;
        }
        const sameTitle =
          (item.summary || "").trim() === String(options.title).trim();
        if (!sameTitle) continue;

        const startRaw = item.start?.dateTime || item.start?.date;
        const itemStartHour = startRaw ? new Date(startRaw).getHours() : null;
        const isRecurringMaster =
          Array.isArray(item.recurrence) && item.recurrence.length > 0;

        // 반복 일정이거나 시작 시각(시)이 일치하면 마스터 이벤트를 삭제하여 모든 연도/주에서 제거
        if (
          isRecurringMaster ||
          options.start === undefined ||
          itemStartHour === Number(options.start)
        ) {
          deletedIds.add(item.id);
          try {
            await googleApiFetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
                item.id
              )}`,
              token,
              { method: "DELETE" }
            );
          } catch {
            // 무시
          }
        }
      }
    } catch (err) {
      console.warn("반복 시리즈 추가 검색 삭제 중 오류:", err);
    }
  }
}

/* ==========================================================================
   [Google Tasks API v1 연동]
   - 할 일 제목 또는 notes 필드에 태그(#학습 등)를 함께 저장하여 양방향 복원
   ========================================================================== */

const VALID_TAGS = ["학습", "운동", "업무", "휴식", "식사", "기타"];

function parseTaskFromGoogle(gTask) {
  let rawTitle = (gTask.title || "").trim();
  let tag = "학습";

  // notes에 [tag:운동] 형식이 있거나 제목 앞에 [#운동] 이 있으면 태그로 추출 ("공부"는 "학습"으로 통합)
  const noteMatch = (gTask.notes || "").match(/\[tag:([^\]]+)\]/);
  if (noteMatch) {
    const extracted = noteMatch[1] === "공부" ? "학습" : noteMatch[1];
    if (VALID_TAGS.includes(extracted)) tag = extracted;
  } else {
    const prefixMatch = rawTitle.match(/^\[#([^\]]+)\]\s*(.+)$/);
    if (prefixMatch) {
      const extracted = prefixMatch[1] === "공부" ? "학습" : prefixMatch[1];
      if (VALID_TAGS.includes(extracted)) {
        tag = extracted;
        rawTitle = prefixMatch[2];
      }
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
