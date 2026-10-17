import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  Timer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock3,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  BarChart3,
  CalendarRange,
  Languages,
  Moon,
  Sun,
  Sparkles,
  ListTodo,
  ExternalLink,
  Trash2,
  Target,
  Flame,
  Star,
  HelpCircle,
  Coffee,
  Github,
  RotateCw,
  Database,
  ShieldCheck,
  Cloud,
  LogOut,
  KeyRound,
  Copy,
  Repeat,
} from "lucide-react";
import {
  loginWithGoogle,
  logoutGoogle,
  fetchGoogleUserProfile,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  fetchGoogleTasks,
  createGoogleTask,
  updateGoogleTaskStatus,
  deleteGoogleTask,
  getRedirectUri,
  getActiveClientId,
} from "./googleSync";

/* ==========================================================================
   [가이드 0] 외부 링크 및 프로젝트 메타 정보 설정
   - GitHub 주소, 크롬 웹스토어 주소, 후원 링크 등을 이곳에서 손쉽게 변경하세요.
   ========================================================================== */
const APP_META = {
  version: "0.1.0",
  license: "MIT License",
  githubUrl: "https://github.com/relaxman/my-plan-extension",
  chromeStoreReviewUrl: "https://chromewebstore.google.com/",
  buyMeACoffeeUrl: "https://www.buymeacoffee.com/",
  kakaoPayNote: "카카오페이 / 토스 QR 후원 준비 중입니다.",
};

/* ==========================================================================
   [가이드 1] 오늘의 타임라인 & 주간 계획표 7가지 파스텔 색상 설정
   ========================================================================== */
const SCHEDULE_COLORS = [
  { id: "rose", labelKo: "핑크", labelEn: "Rose", hex: "#f4c7cc", bg: "#fdecef", border: "#f7d4da", text: "#8c3b47" },
  { id: "peach", labelKo: "피치", labelEn: "Peach", hex: "#f9dcc0", bg: "#fff3e6", border: "#fce0c5", text: "#945623" },
  { id: "butter", labelKo: "옐로우", labelEn: "Butter", hex: "#faefb8", bg: "#fffbe4", border: "#f7e8a4", text: "#856d1b" },
  { id: "sage", labelKo: "민트그린", labelEn: "Sage", hex: "#cfe8cf", bg: "#eef9ee", border: "#d4ecd4", text: "#2e6e36" },
  { id: "sky", labelKo: "스카이", labelEn: "Sky", hex: "#c7ddf7", bg: "#eaf3ff", border: "#cfe3fc", text: "#285999" },
  { id: "periwinkle", labelKo: "블루", labelEn: "Periwinkle", hex: "#a4c6f5", bg: "#e0eeff", border: "#bad6fa", text: "#1e4c90" },
  { id: "stone", labelKo: "그레이", labelEn: "Stone", hex: "#e2e5ea", bg: "#f3f5f8", border: "#dfe4ec", text: "#4c5b70" },
];

const COLOR_MAP = Object.fromEntries(SCHEDULE_COLORS.map((c) => [c.id, c]));

/* ==========================================================================
   [가이드 2] To-Do List 태그(카테고리) 설정 (한국어/영어 UI 라벨 지원)
   ========================================================================== */
const TAG_CONFIG = {
  학습: { className: "tag-blue", hex: "#5a9cf8", ko: "학습", en: "Study" },
  운동: { className: "tag-mint", hex: "#4ecdc4", ko: "운동", en: "Workout" },
  공부: { className: "tag-purple", hex: "#9b8afb", ko: "공부", en: "Exam" },
  업무: { className: "tag-orange", hex: "#f7a35c", ko: "업무", en: "Work" },
  휴식: { className: "tag-pink", hex: "#f490b9", ko: "휴식", en: "Rest" },
  식사: { className: "tag-mint", hex: "#6dd3b3", ko: "식사", en: "Meal" },
  기타: { className: "tag-gray", hex: "#8aa8cc", ko: "기타", en: "Etc" },
};

const TAG_LIST = Object.keys(TAG_CONFIG);

/* ==========================================================================
   [가이드 3] 스탑워치 프리셋 설정 (한국어/영어 UI 라벨 지원)
   ========================================================================== */
const PRESET_LIST = [
  { m: 25, labelKo: "25분", subKo: "뽀모도로", labelEn: "25m", subEn: "Pomodoro" },
  { m: 50, labelKo: "50분", subKo: "긴 집중", labelEn: "50m", subEn: "Deep Focus" },
  { m: 60, labelKo: "1시간", subKo: "몰입", labelEn: "1h", subEn: "Immersion" },
];

/* ==========================================================================
   [가이드 4] 다국어(한국어 / English) UI 텍스트 사전
   - 사용자가 입력한 일정/할 일 데이터는 그대로 유지하고,
     기본 UI 텍스트만 한국어 <-> English로 즉시 전환됩니다.
   ========================================================================== */
const UI_TEXT = {
  한국어: {
    settings: "빠른 설정",
    openAnalytics: "전체 분석 플랫폼 열기",
    theme: "테마",
    dark: "다크",
    light: "라이트",
    langLabel: "언어",
    rateUs: "별점 남기기 (Rate Us)",
    rateThanks: "소중한 별점 감사합니다! 스토어로 이동할까요?",
    openStore: "스토어 리뷰 열기",
    loadSample: "샘플 데이터 채우기",
    clearAllData: "전체 데이터 초기화",
    confirmClear: "모든 일정, 할 일, 집중 기록을 초기화할까요?",
    dataSection: "데이터 관리",
    coffeeBtn: "개발자에게 커피 사주기",
    helpBtn: "정보 및 라이선스",
    todayTimeline: "오늘의 타임라인",
    emptyTimelineHint: "시간대에 마우스를 올려 + 버튼으로 일정을 추가해 보세요.",
    eventNamePlaceholder: "일정 이름",
    delete: "삭제",
    cancel: "취소",
    save: "저장",
    completedCheck: "완료됨",
    todoTitle: "할 일 목록",
    todoSub: "작은 일부터 하나씩 완료해 보세요.",
    todoPlaceholder: "할 일을 입력하세요...",
    emptyTodoHint: "아직 등록된 할 일이 없습니다. 첫 할 일을 추가해 보세요!",
    filterAll: "전체",
    filterActive: "오늘",
    filterDone: "완료",
    focusSession: "FOCUS SESSION",
    focusTitle: "집중하는 시간",
    focusDesc: "지금 이 순간, 한 가지에 집중해 보세요.",
    focusTimeLabel: "집중 시간",
    remainingLabel: "남은 시간",
    startBtn: "시작하기",
    pauseBtn: "일시정지",
    resetBtn: "초기화",
    todayFocusLog: "오늘의 집중 기록",
    emptyFocusTitle: "기록을 쌓아보세요",
    emptyFocusDesc: "집중 세션이 완료되면 시작 시각과 함께 누적됩니다.",
    minuteUnit: "분",
    hourUnit: "시간",
    // Analytics Platform
    platformSub: "오늘도, 조금 더 나은 하루를 위해 · 통합 분석 리포트",
    navAll: "전체 분석 플랫폼",
    navWeekly: "주간 시간표 & 할 일",
    navFocus: "스탑워치 집중 분석",
    pastelLight: "파스텔 라이트",
    darkReport: "다크 리포트",
    backToPopup: "팝업으로 돌아가기",
    kpiTotalFocus: "스탑워치 총 집중시간",
    kpiWeekFocus: "이번 주 집중시간",
    kpiTodayFocus: "오늘 집중시간",
    kpiDoneTasks: "총 완료된 할 일",
    kpiDoneBlocks: "주간 완료 일정",
    kpiAchievement: "종합 달성률",
    weeklyScheduleTitle: "주간 계획표 (클릭하여 색상별 일정 추가/수정)",
    weeklyScheduleSub: "시간표의 칸을 클릭해 7가지 파스텔 색상으로 일정을 등록하거나 완료 체크하세요.",
    timeCol: "시간",
    weeklyStatsTitle: "주간 통계 · 성과율",
    completionRateTitle: "계획 대비 완료율",
    completionRateDesc: "주간 시간표 완료 블록(60%)과 할 일 달성률(40%)을 합산한 종합 성과 지표입니다.",
    totalPlanned: "총 계획 시간",
    actualProgress: "실제 진행 시간",
    remainingTime: "미완료 시간",
    tagRatioTitle: "주요 항목 비율 (할 일 태그 기준)",
    totalTasksCount: (n) => `총 ${n}개 할 일`,
    emptyTagRatio: "할 일을 추가하면 태그 비율이 표시됩니다.",
    todoListCardTitle: "할 일 리스트",
    newTaskPlaceholder: "새 할 일 입력...",
    focusRecordTitle: "스탑워치 · 공부 집중시간 기록",
    focusRecordSub: "최근 10일간 실제 시작한 시각 기준의 공부 집중 세션 분포입니다.",
    addCurrentFocusBtn: "+ 현재 시각으로 집중 기록 추가",
    dateCol: "날짜",
    todayLabel: "오늘",
    yesterdayLabel: "어제",
    goalCardTitle: "목표 집중 시간 달성",
    goalCardSub: (f, a, r) => `집중한 날: ${f}일 · 달성 일수: ${a}일 · 달성률: ${r}%`,
    goalBadge: "목표:",
    recentFocusLogTitle: "최근 스탑워치 집중 로그",
    startedAt: "시작",
    // Modals
    infoModalTitle: "My Plan 정보 & 라이선스",
    infoDesc: "일일 타임라인, 태그 기반 To-Do, 포모도로 집중 타이머 및 주간 분석을 제공하는 생산성 크롬 확장프로그램입니다.",
    versionLabel: "버전",
    licenseLabel: "라이선스",
    openSourceLabel: "오픈소스 고지",
    githubRepoBtn: "GitHub 저장소 방문하기",
    coffeeModalTitle: "개발자에게 커피 한 잔 선물하기",
    coffeeModalDesc: "My Plan이 하루를 계획하는 데 도움이 되셨나요? 따뜻한 커피 한 잔은 개발자가 꾸준히 기능을 업데이트하는 데 큰 힘이 됩니다!",
    coffeeGlobalBtn: "Buy Me a Coffee로 후원하기",
    coffeeLocalTitle: "국내 간편 후원 (카카오페이 / 토스)",
    // Google Sync
    googleSectionTitle: "Google 캘린더 · 할 일 연동",
    googleLoginBtn: "Google 계정으로 연동하기",
    googleSyncNow: "동기화",
    googleSyncing: "동기화 중...",
    googleLogout: "연동 해제",
    googleClientIdBtn: "OAuth Client ID 설정",
    googleModalTitle: "Google 인증 & 캘린더·할일 연동 설정",
    googleModalDesc: "Google Cloud Console에서 발급한 OAuth Client ID를 입력하면 구글 캘린더(일정)와 Google Tasks(할 일)가 실시간 양방향 연동됩니다.",
    redirectUriLabel: "1. 승인된 리디렉션 URI (복사해서 등록)",
    clientIdLabel: "2. Google OAuth 클라이언트 ID",
    clientIdPlaceholder: "xxxx...apps.googleusercontent.com",
    saveAndConnectBtn: "저장 후 Google 로그인",
    saveOnlyBtn: "Client ID만 저장",
    lastSyncedLabel: "최근 동기화:",
    copiedText: "복사됨!",
    copyText: "복사",
    // 평일 루틴 반복 기능
    weekdayRepeatTitle: "평일 루틴 자동 반복 (월~금)",
    weekdayRepeatDesc: "ON 시 주간 계획표나 오늘의 일정을 평일마다 자동으로 채워줍니다.",
    weekdayRepeatCheck: "평일(월~금) 매일 반복 루틴으로 등록",
    weekdayRepeatShort: "평일 반복",
    saveAsWeekdayRoutine: "오늘 일정을 평일 루틴으로 저장",
    routineSavedToast: "평일 루틴이 적용되었습니다!",
  },
  English: {
    settings: "Quick Settings",
    openAnalytics: "Open Full Analytics",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    langLabel: "Language",
    rateUs: "Rate Us",
    rateThanks: "Thank you for rating! Leave a review on the store?",
    openStore: "Open Chrome Web Store",
    loadSample: "Load Sample Data",
    clearAllData: "Reset All Data",
    confirmClear: "Reset all schedules, tasks, and focus logs to empty?",
    dataSection: "Data Management",
    coffeeBtn: "Buy Developer a Coffee",
    helpBtn: "About & License",
    todayTimeline: "Today's Timeline",
    emptyTimelineHint: "Hover over any time slot and click + to add a schedule.",
    eventNamePlaceholder: "Event title",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    completedCheck: "Completed",
    todoTitle: "To-Do List",
    todoSub: "Complete your tasks one step at a time.",
    todoPlaceholder: "Add a new task...",
    emptyTodoHint: "No tasks yet. Add your first task above!",
    filterAll: "All",
    filterActive: "Active",
    filterDone: "Done",
    focusSession: "FOCUS SESSION",
    focusTitle: "Focus Timer",
    focusDesc: "Stay focused on one thing right now.",
    focusTimeLabel: "Focus Time",
    remainingLabel: "Remaining",
    startBtn: "Start",
    pauseBtn: "Pause",
    resetBtn: "Reset",
    todayFocusLog: "Today's Focus Log",
    emptyFocusTitle: "Build your focus log",
    emptyFocusDesc: "Completed sessions are logged here with their start time.",
    minuteUnit: "m",
    hourUnit: "h",
    // Analytics Platform
    platformSub: "For a better day · Analytics Dashboard",
    navAll: "Overview",
    navWeekly: "Weekly & Tasks",
    navFocus: "Focus Analytics",
    pastelLight: "Pastel Light",
    darkReport: "Dark Mode",
    kpiTotalFocus: "Total Focus Time",
    kpiWeekFocus: "Weekly Focus Time",
    kpiTodayFocus: "Today's Focus Time",
    kpiDoneTasks: "Completed Tasks",
    kpiDoneBlocks: "Completed Blocks",
    kpiAchievement: "Achievement Rate",
    weeklyScheduleTitle: "Weekly Timetable (Click to Add / Edit)",
    weeklyScheduleSub: "Click any slot to schedule with 7 pastel colors or mark as completed.",
    timeCol: "Time",
    weeklyStatsTitle: "Weekly Stats · Achievement",
    completionRateTitle: "Completion Rate",
    completionRateDesc: "Combined metric of completed weekly blocks (60%) and completed tasks (40%).",
    totalPlanned: "Planned Time",
    actualProgress: "Completed Time",
    remainingTime: "Remaining Time",
    tagRatioTitle: "Activity Ratio (by Task Tags)",
    totalTasksCount: (n) => `${n} Tasks Total`,
    emptyTagRatio: "Add tasks to see your tag distribution.",
    todoListCardTitle: "To-Do List",
    newTaskPlaceholder: "Add a new task...",
    focusRecordTitle: "Stopwatch · Focus Session History",
    focusRecordSub: "Hourly distribution of focus sessions over the last 10 days.",
    addCurrentFocusBtn: "+ Log Session Now",
    dateCol: "Date",
    todayLabel: "Today",
    yesterdayLabel: "Yesterday",
    goalCardTitle: "Daily Focus Goal",
    goalCardSub: (f, a, r) => `Focused: ${f}d · Achieved: ${a}d · Rate: ${r}%`,
    goalBadge: "Goal:",
    recentFocusLogTitle: "Recent Stopwatch Focus Logs",
    startedAt: "Started",
    // Modals
    infoModalTitle: "About My Plan & License",
    infoDesc: "A pastel productivity Chrome Extension featuring a daily timeline, tag-based to-do list, Pomodoro stopwatch, and weekly analytics.",
    versionLabel: "Version",
    licenseLabel: "License",
    openSourceLabel: "Open Source Stack",
    githubRepoBtn: "Visit GitHub Repository",
    coffeeModalTitle: "Buy the Developer a Coffee",
    coffeeModalDesc: "Has My Plan helped you organize your day? A warm cup of coffee supports continuous updates and new features!",
    coffeeGlobalBtn: "Support on Buy Me a Coffee",
    coffeeLocalTitle: "Quick QR Support (KakaoPay / Toss)",
    // Google Sync
    googleSectionTitle: "Google Calendar & Tasks Sync",
    googleLoginBtn: "Connect with Google",
    googleSyncNow: "Sync",
    googleSyncing: "Syncing...",
    googleLogout: "Disconnect",
    googleClientIdBtn: "OAuth Client ID Setup",
    googleModalTitle: "Google OAuth & Calendar/Tasks Setup",
    googleModalDesc: "Enter your Google Cloud OAuth Client ID to enable two-way sync with Google Calendar and Google Tasks.",
    redirectUriLabel: "1. Authorized Redirect URI (Copy & Register)",
    clientIdLabel: "2. Google OAuth Client ID",
    clientIdPlaceholder: "xxxx...apps.googleusercontent.com",
    saveAndConnectBtn: "Save & Sign in with Google",
    saveOnlyBtn: "Save Client ID",
    lastSyncedLabel: "Last synced:",
    copiedText: "Copied!",
    copyText: "Copy",
    // Weekday Routine Repeat
    weekdayRepeatTitle: "Weekday Auto-Repeat (Mon–Fri)",
    weekdayRepeatDesc: "Automatically applies your weekday schedule routine every Mon–Fri.",
    weekdayRepeatCheck: "Repeat every weekday (Mon–Fri)",
    weekdayRepeatShort: "Weekday Repeat",
    saveAsWeekdayRoutine: "Save Today as Weekday Routine",
    routineSavedToast: "Weekday routine applied!",
  },
};

/* ==========================================================================
   [가이드 5] 샘플 데이터 (설정에서 '샘플 데이터 채우기'를 누를 때만 사용됨)
   - plan.md 0번에 따라 초기 실행 상태는 더미 데이터가 없는 빈 배열([])로 시작합니다.
   ========================================================================== */
const sampleTasks = [
  { id: 1, title: "부트캠프 강의 듣기", tag: "학습", done: true },
  { id: 2, title: "아침 유산소 운동하기", tag: "운동", done: true },
  { id: 3, title: "자격증 기출문제 풀이", tag: "공부", done: false },
  { id: 4, title: "기술 블로그 글 정리", tag: "업무", done: false },
  { id: 5, title: "독서 및 스트레칭", tag: "휴식", done: true },
  { id: 6, title: "건강한 저녁 식사", tag: "식사", done: true },
];

const sampleEvents = [
  { id: 1, title: "아침 운동", start: 7, end: 8, color: "sage" },
  { id: 2, title: "부트캠프 집중 학습", start: 10, end: 13, color: "sky" },
  { id: 3, title: "프로젝트 실습", start: 14, end: 17, color: "periwinkle" },
  { id: 4, title: "저녁 식사 및 휴식", start: 19, end: 20, color: "peach" },
  { id: 5, title: "자격증 공부", start: 21, end: 23, color: "rose" },
];

const sampleWeeklyEvents = [
  { id: 101, day: 0, start: 7, end: 8, title: "아침 운동", color: "sage", done: true },
  { id: 102, day: 0, start: 9, end: 13, title: "부트캠프 강의", color: "sky", done: true },
  { id: 103, day: 0, start: 14, end: 18, title: "알고리즘 풀이", color: "periwinkle", done: true },
  { id: 105, day: 1, start: 9, end: 12, title: "프론트엔드 실습", color: "sky", done: true },
  { id: 106, day: 1, start: 13, end: 17, title: "팀 프로젝트", color: "periwinkle", done: true },
  { id: 110, day: 2, start: 10, end: 14, title: "부트캠프 라이브", color: "sky", done: true },
  { id: 113, day: 3, start: 9, end: 12, title: "리액트 심화 학습", color: "sky", done: true },
  { id: 118, day: 4, start: 10, end: 15, title: "주간 프로젝트 마감", color: "sky", done: true },
  { id: 122, day: 5, start: 10, end: 14, title: "자격증 모의고사", color: "sky", done: false },
];

function getIsoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const sampleFocusSessions = [
  { id: 204, date: getIsoDate(-1), startHour: 10, durationMinutes: 50, order: 1, timeStr: "10:00" },
  { id: 205, date: getIsoDate(-1), startHour: 15, durationMinutes: 60, order: 2, timeStr: "15:20" },
  { id: 207, date: getIsoDate(-2), startHour: 9, durationMinutes: 60, order: 1, timeStr: "09:00" },
  { id: 209, date: getIsoDate(-3), startHour: 10, durationMinutes: 60, order: 1, timeStr: "10:15" },
];

function formatSessionOrder(n, lang) {
  if (lang === "English") {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `Session #${n} (${n + (s[(v - 20) % 10] || s[v] || s[0])})`;
  }
  const names = ["첫 번째", "두 번째", "세 번째", "네 번째", "다섯 번째", "여섯 번째", "일곱 번째", "여덟 번째", "아홉 번째", "열 번째"];
  return names[n - 1] ? `${names[n - 1]} 세션` : `${n}번째 세션`;
}

function getHeaderDateParts(lang) {
  const d = new Date();
  if (lang === "English") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      yearText: `${d.getFullYear()}`,
      dateText: `${months[d.getMonth()]} ${d.getDate()} (${weekdays[d.getDay()]})`,
    };
  }
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return {
    yearText: `${d.getFullYear()}년`,
    dateText: `${d.getMonth() + 1}월 ${d.getDate()}일(${weekdays[d.getDay()]})`,
  };
}

function getTagLabel(tagKey, lang) {
  const cfg = TAG_CONFIG[tagKey];
  if (!cfg) return tagKey;
  return lang === "English" ? cfg.en : cfg.ko;
}

function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const isReportPageFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("page") === "report" || window.location.hash === "#report";
  }, []);

  const [tab, setTab] = useState("schedule");
  // plan.md 0번 반영: 더미 데이터 없이 빈 배열([])을 기본값으로 시작 (키 버전 v3)
  const [tasks, setTasks] = useState(() => loadLocal("myplan-tasks-v3", []));
  const [events, setEvents] = useState(() => loadLocal("myplan-events-v3", []));
  const [weeklyEvents, setWeeklyEvents] = useState(() => loadLocal("myplan-weekly-events-v3", []));
  const [focusSessions, setFocusSessions] = useState(() => loadLocal("myplan-focus-sessions-v3", []));
  const [dailyGoalHours, setDailyGoalHours] = useState(() => loadLocal("myplan-goal-hours", 3));

  const [dark, setDark] = useState(() => loadLocal("myplan-dark", false));
  const [language, setLanguage] = useState(() => loadLocal("myplan-lang", "한국어"));
  const [rating, setRating] = useState(() => loadLocal("myplan-rating", 0));

  // [평일 루틴 자동 반복(월~금) 상태]
  const [weekdayRepeat, setWeekdayRepeat] = useState(() =>
    loadLocal("myplan-weekday-repeat", false)
  );
  const [weekdayTemplates, setWeekdayTemplates] = useState(() =>
    loadLocal("myplan-weekday-templates", [])
  );

  const [showSettings, setShowSettings] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showWeekly, setShowWeekly] = useState(isReportPageFromUrl);

  // [Google OAuth & 캘린더/할일 양방향 연동 상태]
  const [googleToken, setGoogleToken] = useState(() => loadLocal("myplan-google-token", ""));
  const [googleUser, setGoogleUser] = useState(() => loadLocal("myplan-google-user", null));
  const [googleClientId, setGoogleClientId] = useState(() => loadLocal("myplan-google-client-id", ""));
  const [clientIdInput, setClientIdInput] = useState(() => loadLocal("myplan-google-client-id", ""));
  const [lastSyncedAt, setLastSyncedAt] = useState(() => loadLocal("myplan-google-last-sync", ""));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  // [1] Daily Schedule 타임라인 시간 범위: 확장프로그램을 켤 때마다 현재 시각(시)이 맨 위에 오도록 설정
  // 예: 12:49에 켜면 12:00부터 시작, 15:30에 켜면 15:00부터 시작
  const [startHour, setStartHour] = useState(() => new Date().getHours());
  const [endHour, setEndHour] = useState(() =>
    Math.max(new Date().getHours(), loadLocal("myplan-end-hour", 23))
  );
  const [activeSlotHour, setActiveSlotHour] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [slotTitle, setSlotTitle] = useState("");
  const [slotStartHour, setSlotStartHour] = useState(7);
  const [slotEndHour, setSlotEndHour] = useState(8);
  const [slotColor, setSlotColor] = useState("sage");
  const [slotRepeatWeekday, setSlotRepeatWeekday] = useState(false);

  // [2] To-Do List 입력 상태
  const [newTask, setNewTask] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("학습");
  const [filter, setFilter] = useState("ALL"); // "ALL" | "ACTIVE" | "DONE"

  // [3] Stopwatch 상태
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const sessionStartRef = useRef(null);

  const t = UI_TEXT[language] || UI_TEXT["한국어"];

  // LocalStorage 동기화
  useEffect(() => localStorage.setItem("myplan-tasks-v3", JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem("myplan-events-v3", JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem("myplan-weekly-events-v3", JSON.stringify(weeklyEvents)), [weeklyEvents]);
  useEffect(() => localStorage.setItem("myplan-focus-sessions-v3", JSON.stringify(focusSessions)), [focusSessions]);
  useEffect(() => localStorage.setItem("myplan-goal-hours", JSON.stringify(dailyGoalHours)), [dailyGoalHours]);
  useEffect(() => localStorage.setItem("myplan-dark", JSON.stringify(dark)), [dark]);
  useEffect(() => localStorage.setItem("myplan-lang", JSON.stringify(language)), [language]);
  useEffect(() => localStorage.setItem("myplan-rating", JSON.stringify(rating)), [rating]);
  useEffect(() => localStorage.setItem("myplan-end-hour", JSON.stringify(endHour)), [endHour]);
  useEffect(() => localStorage.setItem("myplan-google-token", JSON.stringify(googleToken)), [googleToken]);
  useEffect(() => localStorage.setItem("myplan-google-user", JSON.stringify(googleUser)), [googleUser]);
  useEffect(() => localStorage.setItem("myplan-google-client-id", JSON.stringify(googleClientId)), [googleClientId]);
  useEffect(() => localStorage.setItem("myplan-google-last-sync", JSON.stringify(lastSyncedAt)), [lastSyncedAt]);
  useEffect(() => localStorage.setItem("myplan-weekday-repeat", JSON.stringify(weekdayRepeat)), [weekdayRepeat]);
  useEffect(() => localStorage.setItem("myplan-weekday-templates", JSON.stringify(weekdayTemplates)), [weekdayTemplates]);

  // 팝업과 전체 분석 웹사이트 간 실시간 동기화
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "myplan-tasks-v3" && e.newValue) setTasks(JSON.parse(e.newValue));
      if (e.key === "myplan-events-v3" && e.newValue) setEvents(JSON.parse(e.newValue));
      if (e.key === "myplan-weekly-events-v3" && e.newValue) setWeeklyEvents(JSON.parse(e.newValue));
      if (e.key === "myplan-focus-sessions-v3" && e.newValue) setFocusSessions(JSON.parse(e.newValue));
      if (e.key === "myplan-dark" && e.newValue) setDark(JSON.parse(e.newValue));
      if (e.key === "myplan-lang" && e.newValue) setLanguage(JSON.parse(e.newValue));
      if (e.key === "myplan-google-token" && e.newValue) setGoogleToken(JSON.parse(e.newValue));
      if (e.key === "myplan-google-user" && e.newValue) setGoogleUser(JSON.parse(e.newValue));
      if (e.key === "myplan-google-last-sync" && e.newValue) setLastSyncedAt(JSON.parse(e.newValue));
      if (e.key === "myplan-weekday-repeat" && e.newValue) setWeekdayRepeat(JSON.parse(e.newValue));
      if (e.key === "myplan-weekday-templates" && e.newValue) setWeekdayTemplates(JSON.parse(e.newValue));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 스탑워치 세션 기록 저장 헬퍼
  function recordFocusSession(durationMin) {
    const startObj = sessionStartRef.current || new Date();
    const startHourVal = startObj.getHours();
    const timeStr = `${String(startHourVal).padStart(2, "0")}:${String(startObj.getMinutes()).padStart(2, "0")}`;
    const todayKey = getIsoDate(0);

    setFocusSessions((prev) => {
      const todayCount = prev.filter((s) => s.date === todayKey).length;
      const newSession = {
        id: Date.now(),
        date: todayKey,
        startHour: startHourVal,
        durationMinutes: durationMin,
        order: todayCount + 1,
        timeStr,
      };
      return [newSession, ...prev];
    });
    sessionStartRef.current = null;
  }

  // 스탑워치 카운트다운 동작
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          recordFocusSession(minutes);
          return minutes * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, minutes]);

  const headerDate = getHeaderDateParts(language);
  const doneCount = tasks.filter((item) => item.done).length;
  const filteredTasks = useMemo(
    () =>
      tasks.filter((item) =>
        filter === "ALL" ? true : filter === "ACTIVE" ? !item.done : item.done
      ),
    [tasks, filter]
  );

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function openExternalUrl(url) {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openAnalyticsWebsite() {
    const reportUrl = `${window.location.origin}${window.location.pathname}?page=report`;
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime?.getURL) {
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html?page=report") });
      return;
    }
    window.open(reportUrl, "_blank");
    setShowWeekly(true);
  }

  // 데이터 관리: 샘플 데이터 채우기 / 전체 초기화
  function handleLoadSampleData() {
    setTasks(sampleTasks);
    setEvents(sampleEvents);
    setWeeklyEvents(sampleWeeklyEvents);
    setFocusSessions(sampleFocusSessions);
    setShowSettings(false);
  }

  function handleClearAllData() {
    if (!window.confirm(t.confirmClear)) return;
    setTasks([]);
    setEvents([]);
    setWeeklyEvents([]);
    setFocusSessions([]);
    setShowSettings(false);
  }

  /* ==========================================================================
     [Google OAuth 로그인 & Google Calendar / Tasks 양방향 동기화 핸들러]
     ========================================================================== */
  async function syncAllWithGoogle(tokenToUse = googleToken) {
    if (!tokenToUse) return;
    setIsSyncing(true);
    setSyncError("");
    try {
      // 1) 프로필 확인
      const profile = await fetchGoogleUserProfile(tokenToUse);
      if (profile?.email) {
        setGoogleUser({
          email: profile.email,
          name: profile.name || profile.email.split("@")[0],
          picture: profile.picture || "",
        });
      }

      // 2) 구글 캘린더 일정 불러오기 (오늘 + 이번 주)
      const { dailyEvents: gDaily, weeklyEvents: gWeekly } =
        await fetchGoogleCalendarEvents(tokenToUse);

      setEvents((prev) => {
        const localOnly = prev.filter((ev) => !ev.googleEventId);
        return [...localOnly, ...gDaily];
      });

      setWeeklyEvents((prev) => {
        const localOnly = prev.filter((ev) => !ev.googleEventId);
        return [...localOnly, ...gWeekly];
      });

      // 3) 구글 Tasks 할 일 불러오기
      const gTasks = await fetchGoogleTasks(tokenToUse);
      setTasks((prev) => {
        const localOnly = prev.filter((item) => !item.googleTaskId);
        return [...localOnly, ...gTasks];
      });

      const now = new Date();
      setLastSyncedAt(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`
      );
    } catch (err) {
      if (err?.code === 401 || err?.message === "TOKEN_EXPIRED") {
        setGoogleToken("");
        setGoogleUser(null);
        setSyncError(
          language === "English"
            ? "Session expired. Please sign in again."
            : "구글 인증이 만료되었습니다. 다시 로그인해 주세요."
        );
      } else {
        setSyncError(err?.message || "Sync failed");
      }
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleGoogleLogin(overrideClientId) {
    setSyncError("");
    const activeCid = getActiveClientId(
      overrideClientId !== undefined ? overrideClientId : googleClientId
    );
    try {
      setIsSyncing(true);
      const token = await loginWithGoogle(activeCid);
      setGoogleToken(token);
      setShowGoogleModal(false);
      await syncAllWithGoogle(token);
    } catch (err) {
      if (err?.message === "NEED_CLIENT_ID") {
        setShowSettings(false);
        setShowGoogleModal(true);
      } else {
        setSyncError(err?.message || "Google 로그인 실패");
      }
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleGoogleLogout() {
    await logoutGoogle(googleToken);
    setGoogleToken("");
    setGoogleUser(null);
    setLastSyncedAt("");
    setSyncError("");
  }

  /* ==========================================================================
     [평일 루틴 자동 반복 (월~금) 로직]
     - 평일 반복을 켜면:
       1) 현재 오늘의 일정(events)이나 주간 계획표의 평일 일정에서 루틴 템플릿을 구성하고
       2) 주간 계획표의 월~금(day 0~4) 전체에 해당 루틴이 자동으로 채워지며
       3) 평일(월~금)에 확장프로그램을 열었을 때 오늘의 타임라인(events)에도 루틴이 자동 반영됩니다.
     ========================================================================== */
  function applyTemplatesToWeekAndToday(templatesToApply) {
    if (!templatesToApply || templatesToApply.length === 0) return;

    // 1) 주간 계획표 월(0)~금(4)에 루틴 자동 배치 (중복 방지)
    setWeeklyEvents((prev) => {
      const next = [...prev];
      for (let d = 0; d <= 4; d++) {
        templatesToApply.forEach((tpl) => {
          const exists = next.some(
            (ev) => ev.day === d && ev.start === tpl.start
          );
          if (!exists) {
            next.push({
              id: `routine-w-${d}-${tpl.start}-${Date.now()}`,
              routineId: tpl.id,
              isWeekdayRoutine: true,
              day: d,
              start: tpl.start,
              end: tpl.end,
              title: tpl.title,
              color: tpl.color || "sky",
              done: false,
            });
          }
        });
      }
      return next;
    });

    // 2) 오늘의 타임라인에도 자동 반영 (오늘이 평일이거나 사용자가 즉시 확인하고 싶을 때)
    setEvents((prev) => {
      const next = [...prev];
      templatesToApply.forEach((tpl) => {
        const exists = next.some((ev) => ev.start === tpl.start);
        if (!exists) {
          next.push({
            id: `routine-d-${tpl.start}-${Date.now()}`,
            routineId: tpl.id,
            isWeekdayRoutine: true,
            title: tpl.title,
            start: tpl.start,
            end: tpl.end,
            color: tpl.color || "sky",
          });
        }
      });
      return next;
    });
  }

  function toggleWeekdayRepeatMode(nextValue) {
    const targetState =
      typeof nextValue === "boolean" ? nextValue : !weekdayRepeat;
    setWeekdayRepeat(targetState);

    if (targetState) {
      let activeTemplates = weekdayTemplates;

      // 아직 저장된 평일 루틴 템플릿이 없다면 현재 오늘의 일정 또는 월요일 일정에서 자동 추출
      if (activeTemplates.length === 0) {
        if (events.length > 0) {
          activeTemplates = events.map((ev) => ({
            id: `tpl-${ev.start}-${Date.now()}`,
            title: ev.title,
            start: ev.start,
            end: ev.end,
            color: ev.color || "sky",
          }));
        } else {
          const weekdaySource = weeklyEvents.filter(
            (ev) => ev.day >= 0 && ev.day <= 4
          );
          const byStart = new Map();
          weekdaySource.forEach((ev) => {
            if (!byStart.has(ev.start)) {
              byStart.set(ev.start, {
                id: `tpl-${ev.start}-${Date.now()}`,
                title: ev.title,
                start: ev.start,
                end: ev.end,
                color: ev.color || "sky",
              });
            }
          });
          activeTemplates = Array.from(byStart.values());
        }
        if (activeTemplates.length > 0) {
          setWeekdayTemplates(activeTemplates);
        }
      }

      if (activeTemplates.length > 0) {
        applyTemplatesToWeekAndToday(activeTemplates);
      }
    }
  }

  // 현재 오늘의 타임라인(events) 전체를 평일(월~금) 루틴으로 즉시 저장 및 적용
  function saveCurrentDailyAsWeekdayRoutine() {
    if (events.length === 0) return;
    const newTemplates = events.map((ev) => ({
      id: `tpl-${ev.start}-${Date.now()}`,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      color: ev.color || "sky",
    }));
    setWeekdayTemplates(newTemplates);
    setWeekdayRepeat(true);
    applyTemplatesToWeekAndToday(newTemplates);
  }

  // 앱 실행 시 평일 반복이 켜져 있고 오늘이 월~금(1~5)이면 루틴이 빠져 있을 때 자동으로 채워줌
  useEffect(() => {
    if (!weekdayRepeat || weekdayTemplates.length === 0) return;
    const jsDay = new Date().getDay(); // 1(월) ~ 5(금)
    if (jsDay >= 1 && jsDay <= 5) {
      applyTemplatesToWeekAndToday(weekdayTemplates);
    }
  }, [weekdayRepeat]);

  // [1] 타임라인 슬롯 클릭 시 일정 입력창 열기
  function openSlotForm(hour, existingEvent = null) {
    if (existingEvent) {
      setEditingEventId(existingEvent.id);
      setActiveSlotHour(existingEvent.start);
      setSlotTitle(existingEvent.title);
      setSlotStartHour(existingEvent.start);
      setSlotEndHour(existingEvent.end);
      setSlotColor(existingEvent.color || "sage");
      setSlotRepeatWeekday(Boolean(existingEvent.isWeekdayRoutine || weekdayRepeat));
    } else {
      setEditingEventId(null);
      setActiveSlotHour(hour);
      setSlotTitle("");
      setSlotStartHour(hour);
      setSlotEndHour(Math.min(24, hour + 1));
      setSlotColor("sage");
      setSlotRepeatWeekday(Boolean(weekdayRepeat));
    }
  }

  async function saveSlotEvent(e) {
    e?.preventDefault();
    if (activeSlotHour === null || !slotTitle.trim()) return;
    const sHour = Number(slotStartHour);
    const eHour = Math.max(sHour + 1, Number(slotEndHour));
    const cleanTitle = slotTitle.trim();
    const targetId = editingEventId;
    const existingObj = events.find((ev) => ev.id === targetId);
    const repeatOnWeekdays = Boolean(slotRepeatWeekday);

    setActiveSlotHour(null);
    setEditingEventId(null);
    setSlotTitle("");

    // 평일 반복 체크박스가 켜져 있으면 평일 루틴 템플릿 및 주간 시간표(월~금)에도 동시 반영
    if (repeatOnWeekdays) {
      const tplItem = {
        id: `tpl-${sHour}-${Date.now()}`,
        title: cleanTitle,
        start: sHour,
        end: eHour,
        color: slotColor,
      };
      setWeekdayTemplates((prev) => [
        ...prev.filter((tItem) => tItem.start !== sHour),
        tplItem,
      ]);
      setWeekdayRepeat(true);
      setWeeklyEvents((prev) => {
        const filtered = prev.filter(
          (ev) => !(ev.day >= 0 && ev.day <= 4 && ev.start === sHour)
        );
        const added = [0, 1, 2, 3, 4].map((d) => ({
          id: `routine-w-${d}-${sHour}-${Date.now()}`,
          routineId: tplItem.id,
          isWeekdayRoutine: true,
          day: d,
          start: sHour,
          end: eHour,
          title: cleanTitle,
          color: slotColor,
          done: false,
        }));
        return [...filtered, ...added];
      });
    }

    if (targetId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === targetId
            ? {
                ...ev,
                title: cleanTitle,
                start: sHour,
                end: eHour,
                color: slotColor,
                isWeekdayRoutine: repeatOnWeekdays,
              }
            : ev
        )
      );
      if (googleToken && existingObj?.googleEventId) {
        try {
          await updateGoogleCalendarEvent(googleToken, existingObj.googleEventId, {
            title: cleanTitle,
            start: sHour,
            end: eHour,
            color: slotColor,
          });
        } catch (err) {
          console.warn("Google Calendar 수정 실패:", err);
        }
      }
    } else {
      const tempId = Date.now();
      const newEv = {
        id: tempId,
        title: cleanTitle,
        start: sHour,
        end: eHour,
        color: slotColor,
        isWeekdayRoutine: repeatOnWeekdays,
      };
      setEvents((prev) => [...prev.filter((ev) => ev.start !== sHour), newEv]);

      if (googleToken) {
        try {
          const created = await createGoogleCalendarEvent(googleToken, newEv);
          if (created?.id) {
            setEvents((prev) =>
              prev.map((ev) =>
                ev.id === tempId ? { ...ev, googleEventId: created.id } : ev
              )
            );
          }
        } catch (err) {
          console.warn("Google Calendar 일정 생성 실패:", err);
        }
      }
    }
  }

  async function deleteDailyEvent(evObj) {
    if (!evObj) return;
    setEvents((prev) => prev.filter((x) => x.id !== evObj.id));
    if (googleToken && evObj.googleEventId) {
      try {
        await deleteGoogleCalendarEvent(googleToken, evObj.googleEventId);
      } catch (err) {
        console.warn("Google Calendar 일정 삭제 실패:", err);
      }
    }
  }

  // [2] To-Do 할 일 추가 / 완료 토글 / 삭제 (Google Tasks 실시간 연동 포함)
  async function createNewTaskItem(titleText, tagValue) {
    const clean = titleText.trim();
    if (!clean) return;
    const tempId = Date.now();
    const newItem = {
      id: tempId,
      title: clean,
      tag: tagValue || "학습",
      done: false,
    };
    setTasks((prev) => [...prev, newItem]);

    if (googleToken) {
      try {
        const created = await createGoogleTask(googleToken, newItem);
        if (created?.id) {
          setTasks((prev) =>
            prev.map((item) =>
              item.id === tempId ? { ...item, googleTaskId: created.id } : item
            )
          );
        }
      } catch (err) {
        console.warn("Google Tasks 생성 실패:", err);
      }
    }
  }

  function addTask(e) {
    e?.preventDefault();
    if (!newTask.trim()) return;
    createNewTaskItem(newTask, newTaskTag);
    setNewTask("");
  }

  async function toggleTaskDone(taskObj) {
    const nextDone = !taskObj.done;
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskObj.id ? { ...item, done: nextDone } : item
      )
    );
    if (googleToken && taskObj.googleTaskId) {
      try {
        await updateGoogleTaskStatus(googleToken, taskObj.googleTaskId, nextDone);
      } catch (err) {
        console.warn("Google Tasks 상태 업데이트 실패:", err);
      }
    }
  }

  async function removeTaskItem(taskObj) {
    setTasks((prev) => prev.filter((item) => item.id !== taskObj.id));
    if (googleToken && taskObj.googleTaskId) {
      try {
        await deleteGoogleTask(googleToken, taskObj.googleTaskId);
      } catch (err) {
        console.warn("Google Tasks 삭제 실패:", err);
      }
    }
  }

  // [3] 스탑워치 제어
  function toggleTimer() {
    if (!running) {
      if (!sessionStartRef.current) {
        sessionStartRef.current = new Date();
      }
      setRunning(true);
    } else {
      setRunning(false);
    }
  }

  function resetTimer() {
    const elapsedSeconds = minutes * 60 - remaining;
    if (elapsedSeconds >= 60) {
      recordFocusSession(Math.round(elapsedSeconds / 60));
    } else {
      sessionStartRef.current = null;
    }
    setRunning(false);
    setRemaining(minutes * 60);
  }

  function setPreset(m) {
    setMinutes(m);
    setRemaining(m * 60);
    setRunning(false);
    sessionStartRef.current = null;
  }

  const timelineHours = useMemo(() => {
    const count = Math.max(1, endHour - startHour + 1);
    return Array.from({ length: count }, (_, i) => startHour + i);
  }, [startHour, endHour]);

  const todayFocusSessions = useMemo(
    () =>
      focusSessions
        .filter((s) => s.date === getIsoDate(0))
        .slice()
        .sort((a, b) => a.id - b.id),
    [focusSessions]
  );

  if (showWeekly) {
    return (
      <AnalyticsPlatform
        events={events}
        setEvents={setEvents}
        weeklyEvents={weeklyEvents}
        setWeeklyEvents={setWeeklyEvents}
        tasks={tasks}
        setTasks={setTasks}
        focusSessions={focusSessions}
        setFocusSessions={setFocusSessions}
        dailyGoalHours={dailyGoalHours}
        setDailyGoalHours={setDailyGoalHours}
        dark={dark}
        setDark={setDark}
        language={language}
        setLanguage={setLanguage}
        googleToken={googleToken}
        googleUser={googleUser}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onSyncGoogle={() => syncAllWithGoogle(googleToken)}
        onGoogleLogin={() => handleGoogleLogin()}
        onCreateTask={createNewTaskItem}
        onToggleTask={toggleTaskDone}
        onDeleteTask={removeTaskItem}
        weekdayRepeat={weekdayRepeat}
        onToggleWeekdayRepeat={toggleWeekdayRepeatMode}
        weekdayTemplates={weekdayTemplates}
        setWeekdayTemplates={setWeekdayTemplates}
      />
    );
  }

  return (
    <div className={`popup-viewport ${dark ? "dark" : ""}`}>
      <div className="app-shell popup-mode">
        {/* 0) 상단 헤더: 오늘 날짜 반영 */}
        <header className="app-header">
          <div className="brand-mark">
            <CalendarDays size={22} />
          </div>
          <div className="brand-copy">
            <div className="header-date-year">{headerDate.yearText}</div>
            <div className="header-date-main">{headerDate.dateText}</div>
          </div>
          <button
            className="icon-button header-icon"
            aria-label={t.settings}
            title={t.settings}
            onClick={() => setShowSettings((v) => !v)}
          >
            <Settings size={20} />
          </button>
          <button
            className="icon-button header-icon"
            aria-label={t.openAnalytics}
            title={t.openAnalytics}
            onClick={openAnalyticsWebsite}
          >
            <BarChart3 size={20} />
          </button>
        </header>

        {/* 상단 3개 탭 */}
        <nav className="tabs">
          <button
            className={tab === "schedule" ? "tab active" : "tab"}
            onClick={() => setTab("schedule")}
          >
            <CalendarDays size={16} />
            <span>
              Daily
              <br />
              Schedule
            </span>
          </button>
          <button
            className={tab === "todo" ? "tab active" : "tab"}
            onClick={() => setTab("todo")}
          >
            <CheckSquare size={16} />
            <span>To-Do List</span>
          </button>
          <button
            className={tab === "timer" ? "tab active" : "tab"}
            onClick={() => setTab("timer")}
          >
            <Timer size={16} />
            <span>Stopwatch</span>
          </button>
        </nav>

        {/* 설정 팝오버 (구글 인증·캘린더/할일 연동, Rate Us, 데이터 초기화, 커피 후원 & ? 정보 모달) */}
        {showSettings && (
          <section className="settings-popover">
            <div className="settings-title">
              <Settings size={15} /> {t.settings}
              <button className="icon-button" onClick={() => setShowSettings(false)}>
                <X size={15} />
              </button>
            </div>

            {/* Google 계정 인증 & 캘린더/Tasks 양방향 연동 카드 */}
            <div className="setting-google-card">
              <div className="setting-google-top">
                <span className="google-badge-title">
                  <Cloud size={14} /> {t.googleSectionTitle}
                </span>
                <button
                  type="button"
                  className="google-key-btn"
                  title={t.googleClientIdBtn}
                  onClick={() => {
                    setClientIdInput(googleClientId);
                    setShowSettings(false);
                    setShowGoogleModal(true);
                  }}
                >
                  <KeyRound size={12} />
                </button>
              </div>

              {googleToken ? (
                <div className="google-connected-box">
                  <div className="google-user-row">
                    {googleUser?.picture ? (
                      <img
                        src={googleUser.picture}
                        alt=""
                        className="google-avatar"
                      />
                    ) : (
                      <div className="google-avatar-fallback">G</div>
                    )}
                    <div className="google-user-meta">
                      <b>{googleUser?.name || "Google User"}</b>
                      <small>{googleUser?.email || "Connected"}</small>
                    </div>
                  </div>
                  <div className="google-sync-actions">
                    <button
                      type="button"
                      className="google-sync-btn"
                      disabled={isSyncing}
                      onClick={() => syncAllWithGoogle(googleToken)}
                    >
                      <RotateCw size={12} className={isSyncing ? "spin-icon" : ""} />
                      {isSyncing ? t.googleSyncing : t.googleSyncNow}
                    </button>
                    <button
                      type="button"
                      className="google-logout-btn"
                      onClick={handleGoogleLogout}
                    >
                      <LogOut size={12} /> {t.googleLogout}
                    </button>
                  </div>
                  {lastSyncedAt && (
                    <small className="google-last-sync">
                      {t.lastSyncedLabel} {lastSyncedAt}
                    </small>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="google-login-btn"
                  disabled={isSyncing}
                  onClick={() => handleGoogleLogin()}
                >
                  <Cloud size={14} />
                  <span>{isSyncing ? t.googleSyncing : t.googleLoginBtn}</span>
                </button>
              )}

              {syncError && <div className="google-sync-error">{syncError}</div>}
            </div>

            <button className="setting-row" onClick={() => setDark((v) => !v)}>
              {dark ? <Sun size={16} /> : <Moon size={16} />} {t.theme}
              <span>{dark ? t.dark : t.light}</span>
            </button>

            <label className="setting-row">
              <Languages size={16} /> {t.langLabel}
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="한국어">한국어</option>
                <option value="English">English</option>
              </select>
            </label>

            <button
              className="setting-row"
              onClick={() => {
                setShowSettings(false);
                openAnalyticsWebsite();
              }}
            >
              <CalendarRange size={16} /> {t.openAnalytics} <ExternalLink size={14} />
            </button>

            {/* 평일 루틴 자동 반복 (월~금) 토글 */}
            <div className="setting-routine-box">
              <div className="setting-routine-top">
                <div className="setting-routine-label">
                  <div className="setting-routine-title-row">
                    <Repeat size={13} className="routine-icon-accent" />
                    <b>{t.weekdayRepeatTitle}</b>
                  </div>
                  <small className="setting-routine-desc">{t.weekdayRepeatDesc}</small>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={weekdayRepeat}
                  className={`ios-switch ${weekdayRepeat ? "on" : ""}`}
                  onClick={() => toggleWeekdayRepeatMode(!weekdayRepeat)}
                >
                  <span className="ios-switch-thumb" />
                </button>
              </div>
              {events.length > 0 && (
                <button
                  type="button"
                  className="routine-save-today-btn"
                  onClick={saveCurrentDailyAsWeekdayRoutine}
                >
                  <Repeat size={12} /> {t.saveAsWeekdayRoutine}
                </button>
              )}
            </div>

            {/* Rate Us (별점 남기기) */}
            <div className="setting-rate-box">
              <div className="setting-rate-header">
                <Star size={15} className="star-icon-accent" />
                <span>{t.rateUs}</span>
              </div>
              <div className="star-rating-row">
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <button
                    key={starNum}
                    type="button"
                    className={`star-btn ${rating >= starNum ? "filled" : ""}`}
                    onClick={() => setRating(starNum)}
                    aria-label={`${starNum} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <button
                  type="button"
                  className="rate-store-link"
                  onClick={() => openExternalUrl(APP_META.chromeStoreReviewUrl)}
                >
                  {t.openStore} <ExternalLink size={12} />
                </button>
              )}
            </div>

            {/* 데이터 관리 (샘플 채우기 / 전체 초기화) */}
            <div className="setting-data-actions">
              <button type="button" className="data-btn" onClick={handleLoadSampleData}>
                <Database size={13} /> {t.loadSample}
              </button>
              <button type="button" className="data-btn danger" onClick={handleClearAllData}>
                <RotateCw size={13} /> {t.clearAllData}
              </button>
            </div>

            {/* 설정 맨 밑 하단 바: ☕ 후원하기 버튼 + ? 정보/라이선스 버튼 */}
            <div className="settings-bottom-bar">
              <button
                type="button"
                className="coffee-pill-btn"
                onClick={() => {
                  setShowSettings(false);
                  setShowCoffeeModal(true);
                }}
              >
                <Coffee size={14} />
                <span>{t.coffeeBtn}</span>
              </button>
              <button
                type="button"
                className="help-circle-btn"
                title={t.helpBtn}
                aria-label={t.helpBtn}
                onClick={() => {
                  setShowSettings(false);
                  setShowInfoModal(true);
                }}
              >
                <HelpCircle size={17} />
              </button>
            </div>
          </section>
        )}

        {/* 🔑 Google OAuth Client ID 설정 & 가이드 모달 */}
        {showGoogleModal && (
          <div className="modal-backdrop" onClick={() => setShowGoogleModal(false)}>
            <div className="modal-card google-setup-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <Cloud size={17} /> {t.googleModalTitle}
                </h3>
                <button className="icon-button" onClick={() => setShowGoogleModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <p className="modal-desc">{t.googleModalDesc}</p>

              <div className="google-setup-field">
                <label>{t.redirectUriLabel}</label>
                <div className="redirect-copy-row">
                  <input readOnly value={getRedirectUri()} />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(getRedirectUri());
                      setCopiedRedirect(true);
                      setTimeout(() => setCopiedRedirect(false), 1800);
                    }}
                  >
                    <Copy size={12} /> {copiedRedirect ? t.copiedText : t.copyText}
                  </button>
                </div>
              </div>

              <div className="google-setup-field">
                <label>{t.clientIdLabel}</label>
                <input
                  className="scm-title-input"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder={t.clientIdPlaceholder}
                />
              </div>

              <div className="google-guide-steps">
                <div>1. Google Cloud Console → <b>Google Calendar API</b> & <b>Tasks API</b> 사용 설정</div>
                <div>2. 사용자 인증 정보 → <b>OAuth 클라이언트 ID (웹 애플리케이션)</b> 생성</div>
                <div>3. 승인된 리디렉션 URI에 위 주소를 붙여넣고 발급된 Client ID 입력</div>
              </div>

              {syncError && <div className="google-sync-error">{syncError}</div>}

              <div className="google-modal-actions">
                <button
                  type="button"
                  className="scm-cancel-btn"
                  onClick={() => {
                    setGoogleClientId(clientIdInput.trim());
                    setShowGoogleModal(false);
                  }}
                >
                  {t.saveOnlyBtn}
                </button>
                <button
                  type="button"
                  className="scm-save-btn"
                  onClick={() => {
                    const cleanCid = clientIdInput.trim();
                    setGoogleClientId(cleanCid);
                    handleGoogleLogin(cleanCid);
                  }}
                >
                  {t.saveAndConnectBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ? 버튼 클릭 시 열리는 라이선스 & GitHub 정보 모달 */}
        {showInfoModal && (
          <div className="modal-backdrop" onClick={() => setShowInfoModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <ShieldCheck size={17} /> {t.infoModalTitle}
                </h3>
                <button className="icon-button" onClick={() => setShowInfoModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <p className="modal-desc">{t.infoDesc}</p>
              <div className="info-meta-list">
                <div className="info-meta-row">
                  <span>{t.versionLabel}</span>
                  <b>v{APP_META.version}</b>
                </div>
                <div className="info-meta-row">
                  <span>{t.licenseLabel}</span>
                  <b>{APP_META.license}</b>
                </div>
                <div className="info-meta-row">
                  <span>{t.openSourceLabel}</span>
                  <b>React 18 · Vite · Lucide Icons</b>
                </div>
              </div>
              <button
                type="button"
                className="github-link-btn"
                onClick={() => openExternalUrl(APP_META.githubUrl)}
              >
                <Github size={16} /> {t.githubRepoBtn} <ExternalLink size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ☕ 커피 후원 모달 (Buy Me a Coffee / 카카오페이·토스 안내) */}
        {showCoffeeModal && (
          <div className="modal-backdrop" onClick={() => setShowCoffeeModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <Coffee size={17} /> {t.coffeeModalTitle}
                </h3>
                <button className="icon-button" onClick={() => setShowCoffeeModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <p className="modal-desc">{t.coffeeModalDesc}</p>
              <button
                type="button"
                className="coffee-external-btn"
                onClick={() => openExternalUrl(APP_META.buyMeACoffeeUrl)}
              >
                <Coffee size={16} /> {t.coffeeGlobalBtn} <ExternalLink size={13} />
              </button>
              <div className="coffee-qr-box">
                <strong>{t.coffeeLocalTitle}</strong>
                <div className="qr-placeholder">QR</div>
                <small>{APP_META.kakaoPayNote}</small>
              </div>
            </div>
          </div>
        )}

        {/* 1) Daily Schedule 탭 */}
        {tab === "schedule" && (
          <main className="popup-tab-body">
            <section className="panel timeline-simple-card">
              <div className="timeline-simple-header">
                <div className="timeline-title-wrap">
                  <h2 className="timeline-simple-title">{t.todayTimeline}</h2>
                  <button
                    type="button"
                    className={`weekday-pill-toggle ${weekdayRepeat ? "active" : ""}`}
                    onClick={() => toggleWeekdayRepeatMode(!weekdayRepeat)}
                    title={t.weekdayRepeatDesc}
                  >
                    <Repeat size={11} />
                    <span>{t.weekdayRepeatShort} {weekdayRepeat ? "ON" : "OFF"}</span>
                  </button>
                </div>
                <div className="time-range-picker">
                  <select
                    value={startHour}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStartHour(val);
                      if (val >= endHour) setEndHour(Math.min(23, val + 1));
                    }}
                    aria-label="Start hour"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                  <span className="range-tilde">~</span>
                  <select
                    value={endHour}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEndHour(Math.max(startHour, val));
                    }}
                    aria-label="End hour"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 7색 파스텔 원형 팔레트 일정 입력 폼 */}
              {activeSlotHour !== null && (
                <form className="schedule-color-modal" onSubmit={saveSlotEvent}>
                  <input
                    autoFocus
                    className="scm-title-input"
                    value={slotTitle}
                    onChange={(e) => setSlotTitle(e.target.value)}
                    placeholder={t.eventNamePlaceholder}
                  />
                  <div className="scm-time-row">
                    <select
                      value={slotStartHour}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSlotStartHour(v);
                        if (slotEndHour <= v) setSlotEndHour(Math.min(24, v + 1));
                      }}
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                    <span className="scm-tilde">~</span>
                    <select
                      value={slotEndHour}
                      onChange={(e) => setSlotEndHour(Number(e.target.value))}
                    >
                      {Array.from(
                        { length: Math.max(1, 24 - slotStartHour) },
                        (_, i) => slotStartHour + i + 1
                      ).map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="scm-color-row">
                    {SCHEDULE_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`scm-color-dot ${slotColor === c.id ? "selected" : ""}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setSlotColor(c.id)}
                        title={language === "English" ? c.labelEn : c.labelKo}
                        aria-label={language === "English" ? c.labelEn : c.labelKo}
                      />
                    ))}
                  </div>

                  <label className="scm-repeat-check">
                    <input
                      type="checkbox"
                      checked={slotRepeatWeekday}
                      onChange={(e) => setSlotRepeatWeekday(e.target.checked)}
                    />
                    <Repeat size={12} />
                    <span>{t.weekdayRepeatCheck}</span>
                  </label>

                  <div className="scm-action-row">
                    {editingEventId && (
                      <button
                        type="button"
                        className="scm-delete-btn"
                        onClick={() => {
                          const target = events.find((x) => x.id === editingEventId);
                          deleteDailyEvent(target);
                          setActiveSlotHour(null);
                          setEditingEventId(null);
                        }}
                      >
                        {t.delete}
                      </button>
                    )}
                    <button
                      type="button"
                      className="scm-cancel-btn"
                      onClick={() => {
                        setActiveSlotHour(null);
                        setEditingEventId(null);
                      }}
                    >
                      {t.cancel}
                    </button>
                    <button type="submit" className="scm-save-btn">
                      {t.save}
                    </button>
                  </div>
                </form>
              )}

              <div className="timeline-simple-scroll">
                <div className="timeline-simple-list">
                  {timelineHours.map((h) => {
                    // 시작 시각이 정확히 h이거나, 타임라인 첫 줄(startHour)인데 이전 시간부터 이어지는 일정인 경우 표시
                    const ev = events.find(
                      (e) =>
                        e.start === h ||
                        (h === startHour && e.start < startHour && e.end > startHour)
                    );
                    const isCoveredByPrev =
                      h > startHour && events.some((e) => e.start < h && e.end > h);
                    const colorObj = ev ? COLOR_MAP[ev.color] || COLOR_MAP.sky : null;
                    const visibleStart = ev ? Math.max(ev.start, startHour) : h;
                    const visibleEnd = ev ? Math.min(ev.end, endHour + 1) : h + 1;
                    return (
                      <div className="simple-time-row" key={h}>
                        <span className="simple-time-label">
                          {String(h).padStart(2, "0")}:00
                        </span>
                        <div className="simple-time-cell">
                          {ev ? (
                            <div
                              className="schedule-event"
                              style={{
                                height: `calc(${Math.max(1, visibleEnd - visibleStart) * 44}px - 5px)`,
                                backgroundColor: colorObj.bg,
                                borderColor: colorObj.border,
                                color: colorObj.text,
                              }}
                              onClick={() => openSlotForm(h, ev)}
                            >
                              <span
                                className="event-color-bar"
                                style={{ backgroundColor: colorObj.hex }}
                              />
                              <span className="event-copy">
                                <b>{ev.title}</b>
                                <small style={{ color: colorObj.text }}>
                                  {String(ev.start).padStart(2, "0")}:00 –{" "}
                                  {String(ev.end).padStart(2, "0")}:00
                                </small>
                              </span>
                              <button
                                className="event-delete"
                                title={t.delete}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDailyEvent(ev);
                                }}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            !isCoveredByPrev && (
                              <button
                                type="button"
                                className="slot-hover-plus"
                                onClick={() => openSlotForm(h)}
                                aria-label={`${h}:00 add`}
                              >
                                +
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>
        )}

        {/* 2) To-Do List 탭 */}
        {tab === "todo" && (
          <main className="popup-tab-body">
            <section className="panel todo-main">
              <div className="todo-heading">
                <div>
                  <h2>{t.todoTitle}</h2>
                  <p>{t.todoSub}</p>
                </div>
                <div className="completion-pill">
                  {doneCount} / {tasks.length}
                </div>
              </div>
              <div className="progress-track">
                <div
                  style={{
                    width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>

              <form className="add-task-form-tagonly" onSubmit={addTask}>
                <input
                  className="task-title-input"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder={t.todoPlaceholder}
                />
                <select
                  className="task-tag-select"
                  value={newTaskTag}
                  onChange={(e) => setNewTaskTag(e.target.value)}
                  aria-label="Tag"
                >
                  {TAG_LIST.map((tag) => (
                    <option key={tag} value={tag}>
                      #{getTagLabel(tag, language)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="task-submit-btn" aria-label="Add task">
                  <Plus size={18} />
                </button>
              </form>

              <div className="filter-row">
                {[
                  { key: "ALL", label: t.filterAll },
                  { key: "ACTIVE", label: t.filterActive },
                  { key: "DONE", label: t.filterDone },
                ].map((f) => (
                  <button
                    key={f.key}
                    className={filter === f.key ? "filter-chip selected" : "filter-chip"}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="task-list">
                {filteredTasks.length === 0 ? (
                  <div className="empty-state-box">{t.emptyTodoHint}</div>
                ) : (
                  filteredTasks.map((task) => (
                    <div className={`task-item ${task.done ? "is-done" : ""}`} key={task.id}>
                      <button
                        className={`check-circle ${task.done ? "checked" : ""}`}
                        onClick={() => toggleTaskDone(task)}
                      >
                        {task.done && <Check size={13} />}
                      </button>
                      <span className="task-title">{task.title}</span>
                      <span
                        className={`tag ${
                          TAG_CONFIG[task.tag]?.className || "tag-blue"
                        }`}
                      >
                        {getTagLabel(task.tag, language)}
                      </span>
                      <button
                        className="delete-task"
                        onClick={() => removeTaskItem(task)}
                        aria-label={t.delete}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        )}

        {/* 3) Stopwatch 탭 */}
        {tab === "timer" && (
          <main className="popup-tab-body timer-scroll-area">
            <section className="panel timer-main">
              <div className="timer-eyebrow">
                <Timer size={15} /> {t.focusSession}
              </div>
              <h2>{t.focusTitle}</h2>
              <p className="timer-description">{t.focusDesc}</p>

              <div
                className="timer-ring"
                style={{
                  "--progress": `${(remaining / (minutes * 60 || 1)) * 100}%`,
                }}
              >
                <div className="timer-ring-inner">
                  <span>{t.focusTimeLabel}</span>
                  <strong>{formatTime(remaining)}</strong>
                  <small>{t.remainingLabel}</small>
                </div>
              </div>

              <div className="timer-actions">
                <button className="primary-button" onClick={toggleTimer}>
                  {running ? <Pause size={15} /> : <Play size={15} />}{" "}
                  {running ? t.pauseBtn : t.startBtn}
                </button>
                <button className="secondary-button" onClick={resetTimer}>
                  <RotateCcw size={15} /> {t.resetBtn}
                </button>
              </div>

              <div className="preset-row">
                {PRESET_LIST.map((p) => (
                  <button
                    className={minutes === p.m ? "preset selected" : "preset"}
                    key={p.m}
                    onClick={() => setPreset(p.m)}
                  >
                    <b>{language === "English" ? p.labelEn : p.labelKo}</b>
                    <small>{language === "English" ? p.subEn : p.subKo}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel timer-history-panel">
              <h3>{t.todayFocusLog}</h3>
              {todayFocusSessions.length === 0 ? (
                <div className="focus-stat">
                  <span className="stat-icon">
                    <Clock3 size={15} />
                  </span>
                  <div>
                    <b>{t.emptyFocusTitle}</b>
                    <small>{t.emptyFocusDesc}</small>
                  </div>
                </div>
              ) : (
                todayFocusSessions.map((s, idx) => (
                  <div className="focus-stat" key={s.id}>
                    <span className="stat-icon">
                      <Clock3 size={15} />
                    </span>
                    <div>
                      <b>
                        {s.durationMinutes}
                        {t.minuteUnit}
                      </b>
                      <small>{formatSessionOrder(idx + 1, language)}</small>
                    </div>
                    <span className="stat-time">{s.timeStr}</span>
                  </div>
                ))
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   [4] 전체 분석 플랫폼 (한국어 / English UI 연동)
   ========================================================================== */
function AnalyticsPlatform({
  weeklyEvents,
  setWeeklyEvents,
  tasks,
  setTasks,
  focusSessions,
  setFocusSessions,
  dailyGoalHours,
  setDailyGoalHours,
  dark,
  setDark,
  language,
  setLanguage,
  googleToken,
  googleUser,
  isSyncing,
  onSyncGoogle,
  onGoogleLogin,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
  weekdayRepeat,
  onToggleWeekdayRepeat,
  weekdayTemplates,
  setWeekdayTemplates,
}) {
  const t = UI_TEXT[language] || UI_TEXT["한국어"];
  const days = [
    { idx: 0, shortKo: "월", shortEn: "Mon", date: 12 },
    { idx: 1, shortKo: "화", shortEn: "Tue", date: 13 },
    { idx: 2, shortKo: "수", shortEn: "Wed", date: 14 },
    { idx: 3, shortKo: "목", shortEn: "Thu", date: 15 },
    { idx: 4, shortKo: "금", shortEn: "Fri", date: 16 },
    { idx: 5, shortKo: "토", shortEn: "Sat", date: 17 },
    { idx: 6, shortKo: "일", shortEn: "Sun", date: 18 },
  ];
  const gridHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  const [subTab, setSubTab] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingSlot, setEditingSlot] = useState(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("학습");
  const [manualFocusMin, setManualFocusMin] = useState(25);

  const todayIso = getIsoDate(0);
  const totalFocusMin = useMemo(
    () => focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    [focusSessions]
  );
  const todayFocusMin = useMemo(
    () =>
      focusSessions
        .filter((s) => s.date === todayIso)
        .reduce((acc, s) => acc + s.durationMinutes, 0),
    [focusSessions, todayIso]
  );
  const weekFocusMin = totalFocusMin;

  const totalDoneTasks = tasks.filter((item) => item.done).length;
  const totalPlannedHours = useMemo(
    () => weeklyEvents.reduce((acc, ev) => acc + Math.max(1, ev.end - ev.start), 0),
    [weeklyEvents]
  );
  const completedPlannedHours = useMemo(
    () =>
      weeklyEvents
        .filter((ev) => ev.done)
        .reduce((acc, ev) => acc + Math.max(1, ev.end - ev.start), 0),
    [weeklyEvents]
  );
  const remainingPlannedHours = Math.max(0, totalPlannedHours - completedPlannedHours);

  const achievementRate = useMemo(() => {
    const scheduleRatio = totalPlannedHours ? completedPlannedHours / totalPlannedHours : 0;
    const todoRatio = tasks.length ? totalDoneTasks / tasks.length : 0;
    return Math.round(((scheduleRatio * 0.6 + todoRatio * 0.4) || 0) * 100);
  }, [totalPlannedHours, completedPlannedHours, tasks.length, totalDoneTasks]);

  const tagBreakdown = useMemo(() => {
    const counts = {};
    TAG_LIST.forEach((tag) => (counts[tag] = 0));

    tasks.forEach((item) => {
      const key = TAG_CONFIG[item.tag] ? item.tag : "기타";
      counts[key] = (counts[key] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return TAG_LIST.map((tag) => ({
      tag,
      count: counts[tag] || 0,
      pct: tasks.length ? Math.round(((counts[tag] || 0) / total) * 100) : 0,
      ...TAG_CONFIG[tag],
    }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [tasks]);

  const recentDays = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = getIsoDate(-i);
      const label =
        i === 0
          ? t.todayLabel
          : i === 1
          ? t.yesterdayLabel
          : language === "English"
          ? `${d.getMonth() + 1}/${d.getDate()}`
          : `${d.getMonth() + 1}월 ${d.getDate()}일`;
      const daySessions = focusSessions.filter((s) => s.date === iso);
      return { iso, label, daySessions };
    });
  }, [focusSessions, language, t.todayLabel, t.yesterdayLabel]);

  const goalStats = useMemo(() => {
    const mapByDate = {};
    focusSessions.forEach((s) => {
      mapByDate[s.date] = (mapByDate[s.date] || 0) + s.durationMinutes;
    });
    const focusedDaysCount = Object.keys(mapByDate).length;
    const goalMinutes = dailyGoalHours * 60;
    const achievedDaysCount = Object.values(mapByDate).filter((m) => m >= goalMinutes).length;
    const rate = focusedDaysCount ? Math.round((achievedDaysCount / focusedDaysCount) * 100) : 0;
    return { mapByDate, focusedDaysCount, achievedDaysCount, rate };
  }, [focusSessions, dailyGoalHours]);

  function handleCellClick(dayIdx, hour) {
    const existing = weeklyEvents.find(
      (ev) => ev.day === dayIdx && hour >= ev.start && hour < ev.end
    );
    if (existing) {
      setEditingSlot({
        ...existing,
        repeatWeekdays: Boolean(existing.isWeekdayRoutine),
      });
    } else {
      setEditingSlot({
        id: null,
        day: dayIdx,
        start: hour,
        end: Math.min(23, hour + 2),
        title: "",
        color: "sage",
        done: false,
        repeatWeekdays: Boolean(weekdayRepeat && dayIdx >= 0 && dayIdx <= 4),
      });
    }
  }

  function getWeekDayDateObj(dayIdx) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const d = new Date(now);
    d.setDate(now.getDate() + diffToMon + dayIdx + weekOffset * 7);
    return d;
  }

  async function saveWeeklySlot(e) {
    e.preventDefault();
    if (!editingSlot || !editingSlot.title.trim()) return;
    const start = Number(editingSlot.start);
    const end = Math.max(start + 1, Number(editingSlot.end));
    const cleanTitle = editingSlot.title.trim();
    const repeatAllWeekdays = Boolean(editingSlot.repeatWeekdays);
    const slotCopy = {
      ...editingSlot,
      start,
      end,
      title: cleanTitle,
      isWeekdayRoutine: repeatAllWeekdays,
    };
    setEditingSlot(null);

    // "평일(월~금) 매일 반복 루틴으로 등록" 체크 시 월(0)~금(4) 전체에 즉시 복제 + 루틴 템플릿 등록
    if (repeatAllWeekdays) {
      const tplItem = {
        id: `tpl-${start}-${Date.now()}`,
        title: cleanTitle,
        start,
        end,
        color: slotCopy.color,
      };
      if (setWeekdayTemplates) {
        setWeekdayTemplates((prev) => [
          ...prev.filter((tItem) => tItem.start !== start),
          tplItem,
        ]);
      }
      if (onToggleWeekdayRepeat && !weekdayRepeat) {
        onToggleWeekdayRepeat(true);
      }
      setWeeklyEvents((prev) => {
        const filtered = prev.filter(
          (ev) => !(ev.day >= 0 && ev.day <= 4 && ev.start === start)
        );
        const added = [0, 1, 2, 3, 4].map((d) => ({
          id: `routine-w-${d}-${start}-${Date.now()}`,
          routineId: tplItem.id,
          isWeekdayRoutine: true,
          day: d,
          start,
          end,
          title: cleanTitle,
          color: slotCopy.color,
          done: d === slotCopy.day ? Boolean(slotCopy.done) : false,
        }));
        return [...filtered, ...added];
      });
      return;
    }

    if (slotCopy.id) {
      setWeeklyEvents((prev) =>
        prev.map((ev) => (ev.id === slotCopy.id ? slotCopy : ev))
      );
      if (googleToken && slotCopy.googleEventId) {
        try {
          await updateGoogleCalendarEvent(googleToken, slotCopy.googleEventId, {
            title: cleanTitle,
            start,
            end,
            color: slotCopy.color,
            dateObj: getWeekDayDateObj(slotCopy.day),
          });
        } catch (err) {
          console.warn("Google Calendar 주간 일정 수정 실패:", err);
        }
      }
    } else {
      const tempId = Date.now();
      const newEv = {
        ...slotCopy,
        id: tempId,
      };
      setWeeklyEvents((prev) => [...prev, newEv]);
      if (googleToken) {
        try {
          const created = await createGoogleCalendarEvent(googleToken, {
            title: cleanTitle,
            start,
            end,
            color: slotCopy.color,
            dateObj: getWeekDayDateObj(slotCopy.day),
          });
          if (created?.id) {
            setWeeklyEvents((prev) =>
              prev.map((ev) =>
                ev.id === tempId ? { ...ev, googleEventId: created.id } : ev
              )
            );
          }
        } catch (err) {
          console.warn("Google Calendar 주간 일정 생성 실패:", err);
        }
      }
    }
  }

  async function deleteWeeklySlot(id) {
    const target = weeklyEvents.find((ev) => ev.id === id);
    setWeeklyEvents((prev) => prev.filter((ev) => ev.id !== id));
    setEditingSlot(null);
    if (googleToken && target?.googleEventId) {
      try {
        await deleteGoogleCalendarEvent(googleToken, target.googleEventId);
      } catch (err) {
        console.warn("Google Calendar 주간 일정 삭제 실패:", err);
      }
    }
  }

  function addTaskFromPlatform(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (onCreateTask) {
      onCreateTask(newTaskTitle, newTaskTag);
    } else {
      setTasks((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: newTaskTitle.trim(),
          tag: newTaskTag,
          done: false,
        },
      ]);
    }
    setNewTaskTitle("");
  }

  function addManualFocusSession(e) {
    e.preventDefault();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const todayKey = getIsoDate(0);
    setFocusSessions((prev) => {
      const todayCount = prev.filter((s) => s.date === todayKey).length;
      return [
        {
          id: Date.now(),
          date: todayKey,
          startHour: now.getHours(),
          durationMinutes: Number(manualFocusMin) || 25,
          order: todayCount + 1,
          timeStr,
        },
        ...prev,
      ];
    });
  }

  return (
    <div className={`analytics-platform ${dark ? "dark-report" : "light-report"}`}>
      <header className="platform-header">
        <div className="platform-brand">
          <div className="brand-mark">
            <CalendarDays size={22} />
          </div>
          <div>
            <div className="brand-name">
              My Plan <Sparkles size={14} />
            </div>
            <div className="brand-subtitle">{t.platformSub}</div>
          </div>
        </div>

        <div className="platform-nav-pills">
          <button
            className={subTab === "all" ? "p-tab active" : "p-tab"}
            onClick={() => setSubTab("all")}
          >
            <BarChart3 size={15} /> {t.navAll}
          </button>
          <button
            className={subTab === "weekly" ? "p-tab active" : "p-tab"}
            onClick={() => setSubTab("weekly")}
          >
            <CalendarDays size={15} /> {t.navWeekly}
          </button>
          <button
            className={subTab === "focus" ? "p-tab active" : "p-tab"}
            onClick={() => setSubTab("focus")}
          >
            <Timer size={15} /> {t.navFocus}
          </button>
        </div>

        <div className="platform-actions">
          {googleToken ? (
            <button
              className="theme-toggle-btn google-header-pill"
              disabled={isSyncing}
              onClick={onSyncGoogle}
              title={googleUser?.email || "Google Sync"}
            >
              <RotateCw size={14} className={isSyncing ? "spin-icon" : ""} />
              <span>{isSyncing ? t.googleSyncing : `Google ${t.googleSyncNow}`}</span>
            </button>
          ) : (
            <button
              className="theme-toggle-btn google-header-pill"
              onClick={onGoogleLogin}
            >
              <Cloud size={15} />
              <span>Google {t.googleSyncNow}</span>
            </button>
          )}
          <button
            className="theme-toggle-btn"
            onClick={() => setLanguage((l) => (l === "한국어" ? "English" : "한국어"))}
          >
            <Languages size={15} />
            <span>{language === "한국어" ? "EN" : "한국어"}</span>
          </button>
          <button
            className="theme-toggle-btn"
            onClick={() => setDark((v) => !v)}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{dark ? t.pastelLight : t.darkReport}</span>
          </button>
        </div>
      </header>

      {/* 상단 6개 핵심 요약 KPI 카드 */}
      <section className="kpi-six-grid">
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-red" /> {t.kpiTotalFocus}
          </span>
          <strong className="kpi-value red">
            {totalFocusMin}
            <small>{t.minuteUnit}</small>
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-red" /> {t.kpiWeekFocus}
          </span>
          <strong className="kpi-value red">
            {weekFocusMin}
            <small>{t.minuteUnit}</small>
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-red" /> {t.kpiTodayFocus}
          </span>
          <strong className="kpi-value red">
            {todayFocusMin}
            <small>{t.minuteUnit}</small>
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-blue" /> {t.kpiDoneTasks}
          </span>
          <strong className="kpi-value blue">{totalDoneTasks}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-blue" /> {t.kpiDoneBlocks}
          </span>
          <strong className="kpi-value blue">
            {weeklyEvents.filter((e) => e.done).length}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-blue" /> {t.kpiAchievement}
          </span>
          <strong className="kpi-value blue">
            {achievementRate}
            <small>%</small>
          </strong>
        </div>
      </section>

      {/* 주간 시간표 & 성과율 & 할 일 태그 비율 섹션 */}
      {(subTab === "all" || subTab === "weekly") && (
        <section className="platform-main-grid">
          <div className="platform-left-col">
            <div className="panel weekly-schedule-card">
              <div className="weekly-card-header">
                <div>
                  <h2>{t.weeklyScheduleTitle}</h2>
                  <p className="sub-hint">{t.weeklyScheduleSub}</p>
                </div>
                <div className="weekly-header-right">
                  <button
                    type="button"
                    className={`weekday-pill-toggle large ${weekdayRepeat ? "active" : ""}`}
                    onClick={() =>
                      onToggleWeekdayRepeat && onToggleWeekdayRepeat(!weekdayRepeat)
                    }
                    title={t.weekdayRepeatDesc}
                  >
                    <Repeat size={13} />
                    <span>
                      {t.weekdayRepeatTitle} : {weekdayRepeat ? "ON" : "OFF"}
                    </span>
                  </button>
                  <div className="week-range-controls">
                    <button
                      className="icon-button"
                      onClick={() => setWeekOffset((w) => w - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="week-date-badge">
                      2026. 10. {12 + weekOffset * 7} ({language === "English" ? "Mon" : "월"}) - 10.{" "}
                      {18 + weekOffset * 7} ({language === "English" ? "Sun" : "일"})
                    </span>
                    <button
                      className="icon-button"
                      onClick={() => setWeekOffset((w) => w + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {editingSlot && (
                <form className="schedule-color-modal weekly-modal-override" onSubmit={saveWeeklySlot}>
                  <input
                    autoFocus
                    className="scm-title-input"
                    value={editingSlot.title}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, title: e.target.value })
                    }
                    placeholder={t.eventNamePlaceholder}
                  />
                  <div className="scm-time-row weekly-time-row">
                    <select
                      value={editingSlot.day}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, day: Number(e.target.value) })
                      }
                    >
                      {days.map((d) => (
                        <option key={d.idx} value={d.idx}>
                          {language === "English" ? d.shortEn : `${d.shortKo}요일`}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editingSlot.start}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setEditingSlot({
                          ...editingSlot,
                          start: v,
                          end: Math.max(v + 1, editingSlot.end),
                        });
                      }}
                    >
                      {gridHours.map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                    <span className="scm-tilde">~</span>
                    <select
                      value={editingSlot.end}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, end: Number(e.target.value) })
                      }
                    >
                      {gridHours.map((h) => (
                        <option key={h + 1} value={h + 1}>
                          {String(h + 1).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="scm-bottom-bar">
                    <div className="scm-color-row">
                      {SCHEDULE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`scm-color-dot ${
                            editingSlot.color === c.id ? "selected" : ""
                          }`}
                          style={{ backgroundColor: c.hex }}
                          onClick={() =>
                            setEditingSlot({ ...editingSlot, color: c.id })
                          }
                          title={language === "English" ? c.labelEn : c.labelKo}
                        />
                      ))}
                      <label className="scm-done-check">
                        <input
                          type="checkbox"
                          checked={Boolean(editingSlot.done)}
                          onChange={(e) =>
                            setEditingSlot({ ...editingSlot, done: e.target.checked })
                          }
                        />
                        {t.completedCheck}
                      </label>
                      <label className="scm-done-check">
                        <input
                          type="checkbox"
                          checked={Boolean(editingSlot.repeatWeekdays)}
                          onChange={(e) =>
                            setEditingSlot({
                              ...editingSlot,
                              repeatWeekdays: e.target.checked,
                            })
                          }
                        />
                        <Repeat size={12} /> {t.weekdayRepeatCheck}
                      </label>
                    </div>

                    <div className="scm-action-row">
                      {editingSlot.id && (
                        <button
                          type="button"
                          className="scm-delete-btn"
                          onClick={() => deleteWeeklySlot(editingSlot.id)}
                        >
                          <Trash2 size={13} /> {t.delete}
                        </button>
                      )}
                      <button
                        type="button"
                        className="scm-cancel-btn"
                        onClick={() => setEditingSlot(null)}
                      >
                        {t.cancel}
                      </button>
                      <button type="submit" className="scm-save-btn">
                        {t.save}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="weekly-timetable-wrapper">
                <div className="weekly-timetable">
                  <div className="wt-corner">{t.timeCol}</div>
                  {days.map((d) => (
                    <div
                      key={d.idx}
                      className={`wt-day-header ${d.idx === 5 ? "today-col" : ""}`}
                    >
                      {language === "English" ? d.shortEn : d.shortKo} ({d.date + weekOffset * 7})
                    </div>
                  ))}

                  {gridHours.map((h) => (
                    <div className="wt-row" key={h}>
                      <div className="wt-hour-label">
                        {String(h).padStart(2, "0")}:00
                      </div>
                      {days.map((d) => {
                        const startEv = weeklyEvents.find(
                          (ev) => ev.day === d.idx && ev.start === h
                        );
                        const coveredEv = weeklyEvents.find(
                          (ev) => ev.day === d.idx && ev.start < h && ev.end > h
                        );
                        const cObj = startEv
                          ? COLOR_MAP[startEv.color] || COLOR_MAP.sky
                          : null;
                        return (
                          <div
                            key={`${d.idx}-${h}`}
                            className="wt-cell"
                            onClick={() => handleCellClick(d.idx, h)}
                          >
                            {startEv && (
                              <div
                                className={`wt-event-block ${
                                  startEv.done ? "is-done" : ""
                                }`}
                                style={{
                                  height: `calc(${
                                    Math.max(1, startEv.end - startEv.start) * 34
                                  }px - 4px)`,
                                  backgroundColor: cObj.bg,
                                  borderColor: cObj.border,
                                  color: cObj.text,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSlot({ ...startEv });
                                }}
                              >
                                <div className="wt-event-top">
                                  <b>{startEv.title}</b>
                                  {startEv.done && <Check size={11} />}
                                </div>
                                <small>
                                  {startEv.start}:00~{startEv.end}:00
                                </small>
                              </div>
                            )}
                            {!startEv && !coveredEv && (
                              <span className="wt-cell-plus">+</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="platform-right-col">
            <div className="panel weekly-stats-card">
              <h2>{t.weeklyStatsTitle}</h2>
              <div className="stats-donut-row">
                <div
                  className="donut-chart"
                  style={{
                    "--donut-pct": `${achievementRate}%`,
                  }}
                >
                  <div className="donut-inner">
                    <strong>{achievementRate}%</strong>
                  </div>
                </div>
                <div className="donut-caption">
                  <h4>{t.completionRateTitle}</h4>
                  <p>{t.completionRateDesc}</p>
                </div>
              </div>

              <div className="stats-three-boxes">
                <div className="stat-mini-box">
                  <small>{t.totalPlanned}</small>
                  <b>
                    {totalPlannedHours}
                    {t.hourUnit}
                  </b>
                </div>
                <div className="stat-mini-box">
                  <small>{t.actualProgress}</small>
                  <b>
                    {completedPlannedHours}
                    {t.hourUnit}
                  </b>
                </div>
                <div className="stat-mini-box highlight">
                  <small>{t.remainingTime}</small>
                  <b>
                    {remainingPlannedHours}
                    {t.hourUnit}
                  </b>
                </div>
              </div>
            </div>

            <div className="panel tag-ratio-card">
              <div className="panel-title-row">
                <h2>{t.tagRatioTitle}</h2>
                <span className="badge-subtle">{t.totalTasksCount(tasks.length)}</span>
              </div>
              <div className="tag-ratio-list">
                {tagBreakdown.length === 0 ? (
                  <div className="empty-state-box">{t.emptyTagRatio}</div>
                ) : (
                  tagBreakdown.map((item) => (
                    <div className="tag-ratio-row" key={item.tag}>
                      <div className="tag-ratio-name">
                        <span
                          className="tag-dot"
                          style={{ backgroundColor: item.hex }}
                        />
                        <b>{getTagLabel(item.tag, language)}</b>
                      </div>
                      <div className="tag-ratio-bar-track">
                        <div
                          className="tag-ratio-bar-fill"
                          style={{
                            width: `${item.pct}%`,
                            backgroundColor: item.hex,
                          }}
                        />
                      </div>
                      <strong className="tag-ratio-pct">{item.pct}%</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel platform-todo-card">
              <div className="panel-title-row">
                <h2>
                  <ListTodo size={17} /> {t.todoListCardTitle} ({totalDoneTasks}/{tasks.length})
                </h2>
              </div>
              <form className="platform-todo-form-tagonly" onSubmit={addTaskFromPlatform}>
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={t.newTaskPlaceholder}
                />
                <select
                  value={newTaskTag}
                  onChange={(e) => setNewTaskTag(e.target.value)}
                >
                  {TAG_LIST.map((tag) => (
                    <option key={tag} value={tag}>
                      #{getTagLabel(tag, language)}
                    </option>
                  ))}
                </select>
                <button type="submit" aria-label="Add task">
                  <Plus size={16} />
                </button>
              </form>
              <div className="platform-todo-list">
                {tasks.length === 0 ? (
                  <div className="empty-state-box">{t.emptyTodoHint}</div>
                ) : (
                  tasks.map((item) => (
                    <div
                      key={item.id}
                      className={`task-item ${item.done ? "is-done" : ""}`}
                    >
                      <button
                        className={`check-circle ${item.done ? "checked" : ""}`}
                        onClick={() =>
                          onToggleTask
                            ? onToggleTask(item)
                            : setTasks((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, done: !x.done } : x
                                )
                              )
                        }
                      >
                        {item.done && <Check size={12} />}
                      </button>
                      <span className="task-title">{item.title}</span>
                      <span
                        className={`tag ${
                          TAG_CONFIG[item.tag]?.className || "tag-blue"
                        }`}
                      >
                        {getTagLabel(item.tag, language)}
                      </span>
                      <button
                        className="delete-task"
                        onClick={() =>
                          onDeleteTask
                            ? onDeleteTask(item)
                            : setTasks((prev) => prev.filter((x) => x.id !== item.id))
                        }
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 집중 스탑워치 공부 집중시간 분석 섹션 */}
      {(subTab === "all" || subTab === "focus") && (
        <section className="focus-analysis-grid">
          <div className="panel focus-heatmap-card">
            <div className="panel-title-row">
              <div>
                <h2>{t.focusRecordTitle}</h2>
                <p className="sub-hint">{t.focusRecordSub}</p>
              </div>
              <form className="quick-focus-add" onSubmit={addManualFocusSession}>
                <select
                  value={manualFocusMin}
                  onChange={(e) => setManualFocusMin(Number(e.target.value))}
                >
                  {PRESET_LIST.map((p) => (
                    <option key={p.m} value={p.m}>
                      {language === "English"
                        ? `${p.labelEn} (${p.subEn})`
                        : `${p.labelKo} (${p.subKo})`}
                    </option>
                  ))}
                </select>
                <button type="submit" className="slot-save-btn">
                  {t.addCurrentFocusBtn}
                </button>
              </form>
            </div>

            <div className="heatmap-table">
              <div className="heatmap-header-row">
                <span className="hm-day-col">{t.dateCol}</span>
                {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
                  <span key={h} className="hm-hour-col">
                    {h}:00
                  </span>
                ))}
              </div>
              {recentDays.map((row) => (
                <div className="heatmap-body-row" key={row.iso}>
                  <span className="hm-day-label">{row.label}</span>
                  <div className="hm-timeline-track">
                    {row.daySessions.map((s, idx) => {
                      const leftPct = Math.min(95, Math.max(0, (s.startHour / 24) * 100));
                      const widthPct = Math.max(4, (s.durationMinutes / (24 * 60)) * 100 * 1.8);
                      return (
                        <div
                          key={s.id}
                          className="hm-session-bar"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: "#5a9cf8",
                          }}
                          title={`${s.timeStr} · ${s.durationMinutes}${t.minuteUnit} (${formatSessionOrder(
                            s.order || idx + 1,
                            language
                          )})`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel focus-goal-card">
            <div className="panel-title-row">
              <div>
                <h2>{t.goalCardTitle}</h2>
                <p className="sub-hint">
                  {t.goalCardSub(
                    goalStats.focusedDaysCount,
                    goalStats.achievedDaysCount,
                    goalStats.rate
                  )}
                </p>
              </div>
              <label className="goal-target-badge">
                <Target size={14} /> {t.goalBadge}
                <select
                  value={dailyGoalHours}
                  onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                    <option key={h} value={h}>
                      {h}H
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="goal-calendar">
              <div className="goal-cal-header">
                <strong>{language === "English" ? "October 2026" : "2026년 10월"}</strong>
              </div>
              <div className="goal-cal-weekdays">
                {(language === "English"
                  ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                  : ["월", "화", "수", "목", "금", "토", "일"]
                ).map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
              <div className="goal-cal-days">
                {Array.from({ length: 31 }, (_, i) => {
                  const dayNum = i + 1;
                  const iso = `2026-10-${String(dayNum).padStart(2, "0")}`;
                  const minFocused = goalStats.mapByDate[iso] || 0;
                  const achieved = minFocused >= dailyGoalHours * 60;
                  const hasFocus = minFocused > 0;
                  const isToday = dayNum === new Date().getDate();
                  return (
                    <div
                      key={dayNum}
                      className={`goal-cal-day ${
                        achieved ? "achieved" : hasFocus ? "partial" : ""
                      } ${isToday ? "today" : ""}`}
                    >
                      <span>{dayNum}</span>
                      {minFocused > 0 && <small>{minFocused}m</small>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="recent-focus-log">
              <h4>
                <Flame size={14} /> {t.recentFocusLogTitle}
              </h4>
              {focusSessions.slice(0, 5).map((s, idx) => (
                <div className="focus-log-item" key={s.id}>
                  <span className="tag tag-blue">
                    {s.timeStr} {t.startedAt}
                  </span>
                  <span className="focus-log-title">
                    {formatSessionOrder(s.order || idx + 1, language)}
                  </span>
                  <b>
                    {s.durationMinutes}
                    {t.minuteUnit}
                  </b>
                  <small>{s.date.slice(5)}</small>
                  <button
                    className="icon-button"
                    onClick={() =>
                      setFocusSessions((prev) => prev.filter((x) => x.id !== s.id))
                    }
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
