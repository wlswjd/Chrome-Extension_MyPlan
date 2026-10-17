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
  NotebookPen,
  Pencil,
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
} from "lucide-react";

/* ==========================================================================
   [가이드 1] 오늘의 타임라인 & 주간 계획표 7가지 파스텔 색상 설정 (3번째 사진 반영)
   - 타임라인 일정 색상을 추가/변경하려면 아래 SCHEDULE_COLORS 배열을 수정하세요.
   ========================================================================== */
const SCHEDULE_COLORS = [
  { id: "rose", label: "핑크", hex: "#f4c7cc", bg: "#fdecef", border: "#f7d4da", text: "#8c3b47" },
  { id: "peach", label: "피치", hex: "#f9dcc0", bg: "#fff3e6", border: "#fce0c5", text: "#945623" },
  { id: "butter", label: "옐로우", hex: "#faefb8", bg: "#fffbe4", border: "#f7e8a4", text: "#856d1b" },
  { id: "sage", label: "민트그린", hex: "#cfe8cf", bg: "#eef9ee", border: "#d4ecd4", text: "#2e6e36" },
  { id: "sky", label: "스카이", hex: "#c7ddf7", bg: "#eaf3ff", border: "#cfe3fc", text: "#285999" },
  { id: "periwinkle", label: "블루", hex: "#a4c6f5", bg: "#e0eeff", border: "#bad6fa", text: "#1e4c90" },
  { id: "stone", label: "그레이", hex: "#e2e5ea", bg: "#f3f5f8", border: "#dfe4ec", text: "#4c5b70" },
];

const COLOR_MAP = Object.fromEntries(SCHEDULE_COLORS.map((c) => [c.id, c]));

/* ==========================================================================
   [가이드 2] To-Do List 태그(카테고리) 설정
   - 할 일 목록 및 분석 페이지의 '주요 활동 비율(태그 비율)'에 사용되는 태그입니다.
   ========================================================================== */
const TAG_CONFIG = {
  학습: { className: "tag-blue", hex: "#5a9cf8" },
  운동: { className: "tag-mint", hex: "#4ecdc4" },
  공부: { className: "tag-purple", hex: "#9b8afb" },
  업무: { className: "tag-orange", hex: "#f7a35c" },
  휴식: { className: "tag-pink", hex: "#f490b9" },
  식사: { className: "tag-mint", hex: "#6dd3b3" },
  기타: { className: "tag-gray", hex: "#8aa8cc" },
};

const TAG_LIST = Object.keys(TAG_CONFIG);

/* ==========================================================================
   [가이드 3] 스탑워치 프리셋 설정 (2번째 사진 반영)
   ========================================================================== */
const PRESET_LIST = [
  { m: 25, label: "25분", sub: "뽀모도로" },
  { m: 50, label: "50분", sub: "긴 집중" },
  { m: 60, label: "1시간", sub: "몰입" },
];

/* ==========================================================================
   [가이드 4] 초기 샘플 데이터 (localStorage에 데이터가 없을 때만 사용됨)
   ========================================================================== */
const seedTasks = [
  { id: 1, title: "부트캠프 강의 듣기", tag: "학습", done: true },
  { id: 2, title: "아침 유산소 운동하기", tag: "운동", done: true },
  { id: 3, title: "자격증 기출문제 풀이", tag: "공부", done: false },
  { id: 4, title: "기술 블로그 글 정리", tag: "업무", done: false },
  { id: 5, title: "독서 및 스트레칭", tag: "휴식", done: true },
  { id: 6, title: "건강한 저녁 식사", tag: "식사", done: true },
];

const seedEvents = [
  { id: 1, title: "아침 운동", start: 7, end: 8, color: "sage" },
  { id: 2, title: "부트캠프 집중 학습", start: 10, end: 13, color: "sky" },
  { id: 3, title: "프로젝트 실습", start: 14, end: 17, color: "periwinkle" },
  { id: 4, title: "저녁 식사 및 휴식", start: 19, end: 20, color: "peach" },
  { id: 5, title: "자격증 공부", start: 21, end: 23, color: "rose" },
];

// 요일 인덱스: 0(월) ~ 6(일)
const seedWeeklyEvents = [
  { id: 101, day: 0, start: 7, end: 8, title: "아침 운동", color: "sage", done: true },
  { id: 102, day: 0, start: 9, end: 13, title: "부트캠프 강의", color: "sky", done: true },
  { id: 103, day: 0, start: 14, end: 18, title: "알고리즘 풀이", color: "periwinkle", done: true },
  { id: 104, day: 0, start: 20, end: 22, title: "휴식 및 독서", color: "rose", done: true },

  { id: 105, day: 1, start: 9, end: 12, title: "프론트엔드 실습", color: "sky", done: true },
  { id: 106, day: 1, start: 13, end: 17, title: "팀 프로젝트", color: "periwinkle", done: true },
  { id: 107, day: 1, start: 18, end: 20, title: "헬스장 운동", color: "sage", done: true },
  { id: 108, day: 1, start: 21, end: 23, title: "자격증 복습", color: "butter", done: false },

  { id: 109, day: 2, start: 7, end: 8, title: "모닝 러닝", color: "sage", done: true },
  { id: 110, day: 2, start: 10, end: 14, title: "부트캠프 라이브", color: "sky", done: true },
  { id: 111, day: 2, start: 15, end: 18, title: "과제 제출", color: "peach", done: true },
  { id: 112, day: 2, start: 20, end: 22, title: "영화 감상", color: "rose", done: true },

  { id: 113, day: 3, start: 9, end: 12, title: "리액트 심화 학습", color: "sky", done: true },
  { id: 114, day: 3, start: 13, end: 17, title: "코딩 테스트 스터디", color: "periwinkle", done: true },
  { id: 115, day: 3, start: 18, end: 19, title: "산책 및 스트레칭", color: "sage", done: false },
  { id: 116, day: 3, start: 20, end: 22, title: "블로그 정리", color: "butter", done: true },

  { id: 117, day: 4, start: 7, end: 8, title: "수영 강습", color: "sage", done: true },
  { id: 118, day: 4, start: 10, end: 15, title: "주간 프로젝트 마감", color: "sky", done: true },
  { id: 119, day: 4, start: 16, end: 18, title: "코드 리뷰", color: "periwinkle", done: false },
  { id: 120, day: 4, start: 20, end: 22, title: "자유 휴식", color: "rose", done: true },

  { id: 121, day: 5, start: 7, end: 9, title: "주말 아침 운동", color: "sage", done: true },
  { id: 122, day: 5, start: 10, end: 14, title: "자격증 모의고사", color: "sky", done: true },
  { id: 123, day: 5, start: 15, end: 18, title: "개인 사이드 프로젝트", color: "periwinkle", done: false },
  { id: 124, day: 5, start: 20, end: 22, title: "취미 및 휴식", color: "rose", done: false },

  { id: 125, day: 6, start: 10, end: 12, title: "주간 회고 및 계획", color: "butter", done: false },
  { id: 126, day: 6, start: 14, end: 17, title: "부족한 공부 보충", color: "sky", done: false },
  { id: 127, day: 6, start: 18, end: 19, title: "가벼운 조깅", color: "sage", done: false },
  { id: 128, day: 6, start: 20, end: 22, title: "재충전 휴식", color: "rose", done: false },
];

function getIsoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatKoreanOrder(n) {
  const names = ["첫 번째", "두 번째", "세 번째", "네 번째", "다섯 번째", "여섯 번째", "일곱 번째", "여덟 번째", "아홉 번째", "열 번째"];
  return names[n - 1] ? `${names[n - 1]} 세션` : `${n}번째 세션`;
}

// 과거 날짜 샘플 데이터 (오늘 기록은 실제 스탑워치 실행 시 실시간으로 쌓이도록 비워둠)
const seedFocusSessions = [
  { id: 204, date: getIsoDate(-1), startHour: 10, durationMinutes: 50, label: "첫 번째 세션", timeStr: "10:00" },
  { id: 205, date: getIsoDate(-1), startHour: 15, durationMinutes: 60, label: "두 번째 세션", timeStr: "15:20" },
  { id: 206, date: getIsoDate(-1), startHour: 20, durationMinutes: 50, label: "세 번째 세션", timeStr: "20:10" },
  { id: 207, date: getIsoDate(-2), startHour: 9, durationMinutes: 60, label: "첫 번째 세션", timeStr: "09:00" },
  { id: 208, date: getIsoDate(-2), startHour: 14, durationMinutes: 50, label: "두 번째 세션", timeStr: "14:30" },
  { id: 209, date: getIsoDate(-3), startHour: 10, durationMinutes: 60, label: "첫 번째 세션", timeStr: "10:15" },
  { id: 210, date: getIsoDate(-3), startHour: 16, durationMinutes: 60, label: "두 번째 세션", timeStr: "16:00" },
  { id: 211, date: getIsoDate(-3), startHour: 21, durationMinutes: 60, label: "세 번째 세션", timeStr: "21:00" },
  { id: 212, date: getIsoDate(-4), startHour: 11, durationMinutes: 50, label: "첫 번째 세션", timeStr: "11:00" },
];

function getHeaderDateParts() {
  const d = new Date();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return {
    yearText: `${d.getFullYear()}년`,
    dateText: `${d.getMonth() + 1}월 ${d.getDate()}일(${weekdays[d.getDay()]})`,
  };
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
  const [tasks, setTasks] = useState(() => loadLocal("myplan-tasks-v2", seedTasks));
  const [events, setEvents] = useState(() => loadLocal("myplan-events-v2", seedEvents));
  const [weeklyEvents, setWeeklyEvents] = useState(() => loadLocal("myplan-weekly-events-v2", seedWeeklyEvents));
  const [weeklyMemo, setWeeklyMemo] = useState(() =>
    loadLocal(
      "myplan-weekly-memo",
      "이번 주는 부트캠프에 집중한 한 주였다. 다음 주에는 운동도 꾸준히 하고, 자격증 공부도 더 신경 써야겠다!"
    )
  );
  const [focusSessions, setFocusSessions] = useState(() => loadLocal("myplan-focus-sessions-v2", seedFocusSessions));
  const [dailyGoalHours, setDailyGoalHours] = useState(() => loadLocal("myplan-goal-hours", 3));

  const [dark, setDark] = useState(() => loadLocal("myplan-dark", false));
  const [showSettings, setShowSettings] = useState(false);
  const [showWeekly, setShowWeekly] = useState(isReportPageFromUrl);

  // [1] Daily Schedule 타임라인 시간 범위 및 일정 추가/수정 상태 (3번째 사진 UI 반영)
  const [startHour, setStartHour] = useState(() => loadLocal("myplan-start-hour", 6));
  const [endHour, setEndHour] = useState(() => loadLocal("myplan-end-hour", 23));
  const [activeSlotHour, setActiveSlotHour] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [slotTitle, setSlotTitle] = useState("");
  const [slotStartHour, setSlotStartHour] = useState(7);
  const [slotEndHour, setSlotEndHour] = useState(8);
  const [slotColor, setSlotColor] = useState("sage");

  // [2] To-Do List 입력 상태 (시간 제거, 할 일 제목 + 태그만 유지)
  const [newTask, setNewTask] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("학습");
  const [filter, setFilter] = useState("전체");

  // [3] Stopwatch 상태 (2번째 사진처럼 입력칸 제거 + 실제 시작 시각 기록)
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const sessionStartRef = useRef(null); // 타이머 '시작하기'를 누른 실제 Date 저장
  const [language, setLanguage] = useState("한국어");

  // LocalStorage 동기화
  useEffect(() => localStorage.setItem("myplan-tasks-v2", JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem("myplan-events-v2", JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem("myplan-weekly-events-v2", JSON.stringify(weeklyEvents)), [weeklyEvents]);
  useEffect(() => localStorage.setItem("myplan-weekly-memo", JSON.stringify(weeklyMemo)), [weeklyMemo]);
  useEffect(() => localStorage.setItem("myplan-focus-sessions-v2", JSON.stringify(focusSessions)), [focusSessions]);
  useEffect(() => localStorage.setItem("myplan-goal-hours", JSON.stringify(dailyGoalHours)), [dailyGoalHours]);
  useEffect(() => localStorage.setItem("myplan-dark", JSON.stringify(dark)), [dark]);
  useEffect(() => localStorage.setItem("myplan-start-hour", JSON.stringify(startHour)), [startHour]);
  useEffect(() => localStorage.setItem("myplan-end-hour", JSON.stringify(endHour)), [endHour]);

  // 팝업과 전체 분석 웹사이트 간 실시간 동기화
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "myplan-tasks-v2" && e.newValue) setTasks(JSON.parse(e.newValue));
      if (e.key === "myplan-events-v2" && e.newValue) setEvents(JSON.parse(e.newValue));
      if (e.key === "myplan-weekly-events-v2" && e.newValue) setWeeklyEvents(JSON.parse(e.newValue));
      if (e.key === "myplan-weekly-memo" && e.newValue) setWeeklyMemo(JSON.parse(e.newValue));
      if (e.key === "myplan-focus-sessions-v2" && e.newValue) setFocusSessions(JSON.parse(e.newValue));
      if (e.key === "myplan-dark" && e.newValue) setDark(JSON.parse(e.newValue));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 스탑워치 세션 기록 저장 헬퍼 (실제 시작한 시각 기반, 오늘 날짜 기준으로 순서 부여)
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
        label: formatKoreanOrder(todayCount + 1),
        timeStr, // 실제 '시작하기'를 누른 시각 (예: 09:10)
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

  const headerDate = getHeaderDateParts();
  const doneCount = tasks.filter((t) => t.done).length;
  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) =>
        filter === "전체" ? true : filter === "오늘" ? !t.done : t.done
      ),
    [tasks, filter]
  );

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function openAnalyticsWebsite() {
    const reportUrl = `${window.location.origin}${window.location.pathname}?page=report`;
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime?.getURL) {
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html?page=report") });
      return;
    }
    window.open(reportUrl, "_blank");
    setShowWeekly(true);
  }

  // [1] 타임라인 슬롯 클릭 시 일정 입력창 열기 (3번째 사진 스타일)
  function openSlotForm(hour, existingEvent = null) {
    if (existingEvent) {
      setEditingEventId(existingEvent.id);
      setActiveSlotHour(existingEvent.start);
      setSlotTitle(existingEvent.title);
      setSlotStartHour(existingEvent.start);
      setSlotEndHour(existingEvent.end);
      setSlotColor(existingEvent.color || "sage");
    } else {
      setEditingEventId(null);
      setActiveSlotHour(hour);
      setSlotTitle("");
      setSlotStartHour(hour);
      setSlotEndHour(Math.min(24, hour + 1));
      setSlotColor("sage");
    }
  }

  function saveSlotEvent(e) {
    e?.preventDefault();
    if (activeSlotHour === null || !slotTitle.trim()) return;
    const sHour = Number(slotStartHour);
    const eHour = Math.max(sHour + 1, Number(slotEndHour));

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEventId
            ? { ...ev, title: slotTitle.trim(), start: sHour, end: eHour, color: slotColor }
            : ev
        )
      );
    } else {
      setEvents((prev) => [
        ...prev.filter((ev) => ev.start !== sHour),
        {
          id: Date.now(),
          title: slotTitle.trim(),
          start: sHour,
          end: eHour,
          color: slotColor,
        },
      ]);
    }
    setActiveSlotHour(null);
    setEditingEventId(null);
    setSlotTitle("");
  }

  // [2] To-Do 할 일 추가 (시간 제거, 제목 + 태그만 저장)
  function addTask(e) {
    e?.preventDefault();
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTask.trim(),
        tag: newTaskTag || "학습",
        done: false,
      },
    ]);
    setNewTask("");
  }

  // [3] 스탑워치 제어 (시작 시 실제 현재 시간 기록, 1분 이상 집중 후 초기화 시에도 누적 기록)
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
    // 1분(60초) 이상 집중한 상태에서 초기화를 누르면 그때까지 집중한 시간(분)을 오늘의 기록에 자동 누적
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

  // 오늘의 집중 기록: 오늘 날짜(getIsoDate(0))인 기록만 필터링하므로 자정이 지나면 자동으로 초기화됨
  // 오래된 순서(첫 번째 세션 -> 두 번째 세션...)로 정렬하여 아래로 차곡차곡 쌓이게 표시
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
        weeklyMemo={weeklyMemo}
        setWeeklyMemo={setWeeklyMemo}
        tasks={tasks}
        setTasks={setTasks}
        focusSessions={focusSessions}
        setFocusSessions={setFocusSessions}
        dailyGoalHours={dailyGoalHours}
        setDailyGoalHours={setDailyGoalHours}
        dark={dark}
        setDark={setDark}
        onBack={() => {
          if (isReportPageFromUrl) {
            window.history.replaceState({}, "", window.location.pathname);
          }
          setShowWeekly(false);
        }}
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
            aria-label="설정"
            title="설정"
            onClick={() => setShowSettings((v) => !v)}
          >
            <Settings size={20} />
          </button>
          <button
            className="icon-button header-icon"
            aria-label="전체 분석 플랫폼 열기"
            title="전체 분석 웹사이트 열기"
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

        {/* 설정 팝오버 */}
        {showSettings && (
          <section className="settings-popover">
            <div className="settings-title">
              <Settings size={15} /> 빠른 설정
              <button className="icon-button" onClick={() => setShowSettings(false)}>
                <X size={15} />
              </button>
            </div>
            <button className="setting-row" onClick={() => setDark((v) => !v)}>
              {dark ? <Sun size={16} /> : <Moon size={16} />} 테마
              <span>{dark ? "다크" : "라이트"}</span>
            </button>
            <label className="setting-row">
              <Languages size={16} /> 언어
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option>한국어</option>
                <option>English</option>
              </select>
            </label>
            <button
              className="setting-row"
              onClick={() => {
                setShowSettings(false);
                openAnalyticsWebsite();
              }}
            >
              <CalendarRange size={16} /> 전체 분석 플랫폼 열기 <ExternalLink size={14} />
            </button>
          </section>
        )}

        {/* 1) Daily Schedule 탭 (3번째 사진의 색상 선택 스케줄 입력 모달 적용) */}
        {tab === "schedule" && (
          <main className="popup-tab-body">
            <section className="panel timeline-simple-card">
              <div className="timeline-simple-header">
                <h2 className="timeline-simple-title">오늘의 타임라인</h2>
                <div className="time-range-picker">
                  <select
                    value={startHour}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStartHour(val);
                      if (val >= endHour) setEndHour(Math.min(23, val + 1));
                    }}
                    aria-label="시작 시간"
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
                    aria-label="종료 시간"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2-1) 3번째 사진과 동일한 일정 이름 + 시간 범위 + 7색 파스텔 원형 팔레트 입력 폼 */}
              {activeSlotHour !== null && (
                <form className="schedule-color-modal" onSubmit={saveSlotEvent}>
                  <input
                    autoFocus
                    className="scm-title-input"
                    value={slotTitle}
                    onChange={(e) => setSlotTitle(e.target.value)}
                    placeholder="일정 이름"
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
                        title={c.label}
                        aria-label={c.label}
                      />
                    ))}
                  </div>

                  <div className="scm-action-row">
                    {editingEventId && (
                      <button
                        type="button"
                        className="scm-delete-btn"
                        onClick={() => {
                          setEvents((prev) => prev.filter((x) => x.id !== editingEventId));
                          setActiveSlotHour(null);
                          setEditingEventId(null);
                        }}
                      >
                        삭제
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
                      취소
                    </button>
                    <button type="submit" className="scm-save-btn">
                      저장
                    </button>
                  </div>
                </form>
              )}

              <div className="timeline-simple-scroll">
                <div className="timeline-simple-list">
                  {timelineHours.map((h) => {
                    const ev = events.find((e) => e.start === h);
                    const isCoveredByPrev = events.some((e) => e.start < h && e.end > h);
                    const colorObj = ev ? COLOR_MAP[ev.color] || COLOR_MAP.sky : null;
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
                                height: `calc(${Math.max(1, ev.end - ev.start) * 44}px - 5px)`,
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
                                title="일정 삭제"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEvents((prev) => prev.filter((x) => x.id !== ev.id));
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
                                aria-label={`${h}시 일정 추가`}
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

        {/* 2) To-Do List 탭: 시간 입력/표시 제거, 할 일 + 태그만 심플하게 입력 */}
        {tab === "todo" && (
          <main className="popup-tab-body">
            <section className="panel todo-main">
              <div className="todo-heading">
                <div>
                  <h2>할 일 목록</h2>
                  <p>작은 일부터 하나씩 완료해 보세요.</p>
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

              {/* 할 일 + 태그 입력 폼 (시간 제거됨) */}
              <form className="add-task-form-tagonly" onSubmit={addTask}>
                <input
                  className="task-title-input"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="할 일을 입력하세요..."
                />
                <select
                  className="task-tag-select"
                  value={newTaskTag}
                  onChange={(e) => setNewTaskTag(e.target.value)}
                  aria-label="할 일 태그"
                >
                  {TAG_LIST.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
                <button type="submit" className="task-submit-btn" aria-label="할 일 추가">
                  <Plus size={18} />
                </button>
              </form>

              <div className="filter-row">
                {["전체", "오늘", "완료"].map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "filter-chip selected" : "filter-chip"}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="task-list">
                {filteredTasks.map((task) => (
                  <div className={`task-item ${task.done ? "is-done" : ""}`} key={task.id}>
                    <button
                      className={`check-circle ${task.done ? "checked" : ""}`}
                      onClick={() =>
                        setTasks((prev) =>
                          prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
                        )
                      }
                    >
                      {task.done && <Check size={13} />}
                    </button>
                    <span className="task-title">{task.title}</span>
                    <span
                      className={`tag ${
                        TAG_CONFIG[task.tag]?.className || "tag-blue"
                      }`}
                    >
                      {task.tag}
                    </span>
                    <button
                      className="delete-task"
                      onClick={() =>
                        setTasks((prev) => prev.filter((t) => t.id !== task.id))
                      }
                      aria-label="삭제"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </main>
        )}

        {/* 3) Stopwatch 탭: 2번째 사진과 동일하게 복원 + 하단 오늘의 집중 기록 실시간 누적 */}
        {tab === "timer" && (
          <main className="popup-tab-body timer-scroll-area">
            <section className="panel timer-main">
              <div className="timer-eyebrow">
                <Timer size={15} /> FOCUS SESSION
              </div>
              <h2>집중하는 시간</h2>
              <p className="timer-description">지금 이 순간, 한 가지에 집중해 보세요.</p>

              <div
                className="timer-ring"
                style={{
                  "--progress": `${(remaining / (minutes * 60 || 1)) * 100}%`,
                }}
              >
                <div className="timer-ring-inner">
                  <span>집중 시간</span>
                  <strong>{formatTime(remaining)}</strong>
                  <small>남은 시간</small>
                </div>
              </div>

              <div className="timer-actions">
                <button className="primary-button" onClick={toggleTimer}>
                  {running ? <Pause size={15} /> : <Play size={15} />}{" "}
                  {running ? "일시정지" : "시작하기"}
                </button>
                <button className="secondary-button" onClick={resetTimer}>
                  <RotateCcw size={15} /> 초기화
                </button>
              </div>

              <div className="preset-row">
                {PRESET_LIST.map((p) => (
                  <button
                    className={minutes === p.m ? "preset selected" : "preset"}
                    key={p.m}
                    onClick={() => setPreset(p.m)}
                  >
                    <b>{p.label}</b>
                    <small>{p.sub}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel timer-history-panel">
              <h3>오늘의 집중 기록</h3>
              {todayFocusSessions.length === 0 ? (
                <div className="focus-stat">
                  <span className="stat-icon">
                    <Clock3 size={15} />
                  </span>
                  <div>
                    <b>기록을 쌓아보세요</b>
                    <small>집중 세션이 완료되면 시작 시각과 함께 누적됩니다.</small>
                  </div>
                </div>
              ) : (
                todayFocusSessions.map((s, idx) => (
                  <div className="focus-stat" key={s.id}>
                    <span className="stat-icon">
                      <Clock3 size={15} />
                    </span>
                    <div>
                      <b>{s.durationMinutes}분</b>
                      <small>{formatKoreanOrder(idx + 1)}</small>
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
   [4] 전체 분석 플랫폼 (수정된 기능들에 맞춰 연동된 상세 분석 페이지)
   - 일주일치 시간표: 3번째 사진과 동일한 7가지 파스텔 색상 선택 및 수정 기능
   - 할 일 리스트: 시간 없이 할 일 + 태그로만 깔끔하게 관리
   - 주요 활동 비율: 할 일 목록(To-Do List)의 태그 비율로 자동 계산 및 표시
   - 스탑워치 집중시간 분석: 태그 입력 없이 실제 시작 시각(timeStr) 및 누적 집중 시간으로 분석
   ========================================================================== */
function AnalyticsPlatform({
  weeklyEvents,
  setWeeklyEvents,
  weeklyMemo,
  setWeeklyMemo,
  tasks,
  setTasks,
  focusSessions,
  setFocusSessions,
  dailyGoalHours,
  setDailyGoalHours,
  dark,
  setDark,
  onBack,
}) {
  const days = [
    { idx: 0, short: "월", date: 12 },
    { idx: 1, short: "화", date: 13 },
    { idx: 2, short: "수", date: 14 },
    { idx: 3, short: "목", date: 15 },
    { idx: 4, short: "금", date: 16 },
    { idx: 5, short: "토", date: 17 },
    { idx: 6, short: "일", date: 18 },
  ];
  const gridHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  const [subTab, setSubTab] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingSlot, setEditingSlot] = useState(null); // { id?, day, start, end, title, color, done }

  // 할 일 추가 상태 (시간 제거됨)
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("학습");

  // 수동 집중 시간 기록 추가 상태
  const [manualFocusMin, setManualFocusMin] = useState(25);

  // --- 통계 계산 ---
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

  const totalDoneTasks = tasks.filter((t) => t.done).length;
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

  // 할 일(To-Do List) 중 태그 비율로 주요 활동 비율 계산
  const tagBreakdown = useMemo(() => {
    const counts = {};
    TAG_LIST.forEach((t) => (counts[t] = 0));

    tasks.forEach((t) => {
      const key = TAG_CONFIG[t.tag] ? t.tag : "기타";
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

  // 최근 10일 스탑워치 집중 타임라인 데이터
  const recentDays = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = getIsoDate(-i);
      const label =
        i === 0 ? "오늘" : i === 1 ? "어제" : `${d.getMonth() + 1}월 ${d.getDate()}일`;
      const daySessions = focusSessions.filter((s) => s.date === iso);
      return { iso, label, daySessions };
    });
  }, [focusSessions]);

  // 월간 목표 집중 시간 달성 통계
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

  // 주간 시간표 셀 클릭 핸들러 (3번째 사진 색상 팔레트 연동)
  function handleCellClick(dayIdx, hour) {
    const existing = weeklyEvents.find(
      (ev) => ev.day === dayIdx && hour >= ev.start && hour < ev.end
    );
    if (existing) {
      setEditingSlot({ ...existing });
    } else {
      setEditingSlot({
        id: null,
        day: dayIdx,
        start: hour,
        end: Math.min(23, hour + 2),
        title: "",
        color: "sage",
        done: false,
      });
    }
  }

  function saveWeeklySlot(e) {
    e.preventDefault();
    if (!editingSlot || !editingSlot.title.trim()) return;
    const start = Number(editingSlot.start);
    const end = Math.max(start + 1, Number(editingSlot.end));

    if (editingSlot.id) {
      setWeeklyEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingSlot.id
            ? { ...editingSlot, start, end, title: editingSlot.title.trim() }
            : ev
        )
      );
    } else {
      setWeeklyEvents((prev) => [
        ...prev,
        {
          ...editingSlot,
          id: Date.now(),
          start,
          end,
          title: editingSlot.title.trim(),
        },
      ]);
    }
    setEditingSlot(null);
  }

  function deleteWeeklySlot(id) {
    setWeeklyEvents((prev) => prev.filter((ev) => ev.id !== id));
    setEditingSlot(null);
  }

  function addTaskFromPlatform(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTaskTitle.trim(),
        tag: newTaskTag,
        done: false,
      },
    ]);
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
          label: formatKoreanOrder(todayCount + 1),
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
            <div className="brand-subtitle">오늘도, 조금 더 나은 하루를 위해 · 통합 분석 리포트</div>
          </div>
        </div>

        <div className="platform-nav-pills">
          <button
            className={subTab === "all" ? "p-tab active" : "p-tab"}
            onClick={() => setSubTab("all")}
          >
            <BarChart3 size={15} /> 전체 분석 플랫폼
          </button>
          <button
            className={subTab === "weekly" ? "p-tab active" : "p-tab"}
            onClick={() => setSubTab("weekly")}
          >
            <CalendarDays size={15} /> 주간 시간표 & 할 일
          </button>
          <button
            className={subTab === "focus" ? "p-tab active" : "p-tab"}
            onClick={() => setSubTab("focus")}
          >
            <Timer size={15} /> 스탑워치 집중 분석
          </button>
        </div>

        <div className="platform-actions">
          <button
            className="theme-toggle-btn"
            onClick={() => setDark((v) => !v)}
            title="라이트 / 다크 테마 전환"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{dark ? "파스텔 라이트" : "다크 리포트"}</span>
          </button>
          <button className="back-popup-btn" onClick={onBack}>
            <X size={18} /> 팝업으로 돌아가기
          </button>
        </div>
      </header>

      {/* 상단 6개 핵심 요약 KPI 카드 */}
      <section className="kpi-six-grid">
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-red" /> 스탑워치 총 집중시간
          </span>
          <strong className="kpi-value red">
            {totalFocusMin}
            <small>분</small>
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-red" /> 이번 주 집중시간
          </span>
          <strong className="kpi-value red">
            {weekFocusMin}
            <small>분</small>
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-red" /> 오늘 집중시간
          </span>
          <strong className="kpi-value red">
            {todayFocusMin}
            <small>분</small>
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-blue" /> 총 완료된 할 일
          </span>
          <strong className="kpi-value blue">{totalDoneTasks}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-blue" /> 주간 완료 일정
          </span>
          <strong className="kpi-value blue">
            {weeklyEvents.filter((e) => e.done).length}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">
            <i className="dot-blue" /> 종합 달성률
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
                  <h2>주간 계획표 (클릭하여 색상별 일정 추가/수정)</h2>
                  <p className="sub-hint">
                    시간표의 칸을 클릭해 7가지 파스텔 색상으로 일정을 등록하거나 완료 체크하세요.
                  </p>
                </div>
                <div className="week-range-controls">
                  <button
                    className="icon-button"
                    onClick={() => setWeekOffset((w) => w - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="week-date-badge">
                    2026. 10. {12 + weekOffset * 7} (월) - 10. {18 + weekOffset * 7} (일)
                  </span>
                  <button
                    className="icon-button"
                    onClick={() => setWeekOffset((w) => w + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* 주간 일정 편집 모달 (3번째 사진과 동일한 7색 원형 팔레트 적용) */}
              {editingSlot && (
                <form className="schedule-color-modal weekly-modal-override" onSubmit={saveWeeklySlot}>
                  <input
                    autoFocus
                    className="scm-title-input"
                    value={editingSlot.title}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, title: e.target.value })
                    }
                    placeholder="일정 이름"
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
                          {d.short}요일
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
                          title={c.label}
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
                        완료됨
                      </label>
                    </div>

                    <div className="scm-action-row">
                      {editingSlot.id && (
                        <button
                          type="button"
                          className="scm-delete-btn"
                          onClick={() => deleteWeeklySlot(editingSlot.id)}
                        >
                          <Trash2 size={13} /> 삭제
                        </button>
                      )}
                      <button
                        type="button"
                        className="scm-cancel-btn"
                        onClick={() => setEditingSlot(null)}
                      >
                        취소
                      </button>
                      <button type="submit" className="scm-save-btn">
                        저장
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 일주일 시간표 그리드 */}
              <div className="weekly-timetable-wrapper">
                <div className="weekly-timetable">
                  <div className="wt-corner">시간</div>
                  {days.map((d) => (
                    <div
                      key={d.idx}
                      className={`wt-day-header ${d.idx === 5 ? "today-col" : ""}`}
                    >
                      {d.short} ({d.date + weekOffset * 7})
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

            <div className="panel weekly-memo-card">
              <div className="panel-title-row">
                <h3>
                  <NotebookPen size={16} /> 주간 메모
                </h3>
                <Pencil size={14} />
              </div>
              <textarea
                value={weeklyMemo}
                onChange={(e) => setWeeklyMemo(e.target.value)}
                placeholder="이번 주 회고와 다음 주 목표를 자유롭게 적어보세요..."
              />
            </div>
          </div>

          <div className="platform-right-col">
            {/* 주간 통계 / 성과율 */}
            <div className="panel weekly-stats-card">
              <h2>주간 통계 · 성과율</h2>
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
                  <h4>계획 대비 완료율</h4>
                  <p>
                    주간 시간표 완료 블록(60%)과 할 일 달성률(40%)을 합산한 종합 성과 지표입니다.
                  </p>
                </div>
              </div>

              <div className="stats-three-boxes">
                <div className="stat-mini-box">
                  <small>총 계획 시간</small>
                  <b>{totalPlannedHours}시간</b>
                </div>
                <div className="stat-mini-box">
                  <small>실제 진행 시간</small>
                  <b>{completedPlannedHours}시간</b>
                </div>
                <div className="stat-mini-box highlight">
                  <small>미완료 시간</small>
                  <b>{remainingPlannedHours}시간</b>
                </div>
              </div>
            </div>

            {/* 주요 활동 비율 - 할 일 중 태그 비율로 구분 */}
            <div className="panel tag-ratio-card">
              <div className="panel-title-row">
                <h2>주요 항목 비율 (할 일 태그 기준)</h2>
                <span className="badge-subtle">총 {tasks.length}개 할 일</span>
              </div>
              <div className="tag-ratio-list">
                {tagBreakdown.map((item) => (
                  <div className="tag-ratio-row" key={item.tag}>
                    <div className="tag-ratio-name">
                      <span
                        className="tag-dot"
                        style={{ backgroundColor: item.hex }}
                      />
                      <b>{item.tag}</b>
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
                ))}
              </div>
            </div>

            {/* 할 일 리스트 관리 카드 (시간 제거됨) */}
            <div className="panel platform-todo-card">
              <div className="panel-title-row">
                <h2>
                  <ListTodo size={17} /> 할 일 리스트 ({totalDoneTasks}/{tasks.length})
                </h2>
              </div>
              <form className="platform-todo-form-tagonly" onSubmit={addTaskFromPlatform}>
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="새 할 일 입력..."
                />
                <select
                  value={newTaskTag}
                  onChange={(e) => setNewTaskTag(e.target.value)}
                >
                  {TAG_LIST.map((t) => (
                    <option key={t} value={t}>
                      #{t}
                    </option>
                  ))}
                </select>
                <button type="submit" aria-label="할 일 추가">
                  <Plus size={16} />
                </button>
              </form>
              <div className="platform-todo-list">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`task-item ${t.done ? "is-done" : ""}`}
                  >
                    <button
                      className={`check-circle ${t.done ? "checked" : ""}`}
                      onClick={() =>
                        setTasks((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, done: !x.done } : x
                          )
                        )
                      }
                    >
                      {t.done && <Check size={12} />}
                    </button>
                    <span className="task-title">{t.title}</span>
                    <span
                      className={`tag ${
                        TAG_CONFIG[t.tag]?.className || "tag-blue"
                      }`}
                    >
                      {t.tag}
                    </span>
                    <button
                      className="delete-task"
                      onClick={() =>
                        setTasks((prev) => prev.filter((x) => x.id !== t.id))
                      }
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
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
                <h2>스탑워치 · 공부 집중시간 기록</h2>
                <p className="sub-hint">
                  최근 10일간 실제 시작한 시각 기준의 공부 집중 세션 분포입니다.
                </p>
              </div>
              <form className="quick-focus-add" onSubmit={addManualFocusSession}>
                <select
                  value={manualFocusMin}
                  onChange={(e) => setManualFocusMin(Number(e.target.value))}
                >
                  <option value={25}>25분 (뽀모도로)</option>
                  <option value={50}>50분 (긴 집중)</option>
                  <option value={60}>60분 (1시간 몰입)</option>
                </select>
                <button type="submit" className="slot-save-btn">
                  + 현재 시각으로 집중 기록 추가
                </button>
              </form>
            </div>

            <div className="heatmap-table">
              <div className="heatmap-header-row">
                <span className="hm-day-col">날짜</span>
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
                    {row.daySessions.map((s) => {
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
                          title={`${s.timeStr} 시작 · ${s.durationMinutes}분 집중 (${s.label})`}
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
                <h2>목표 집중 시간 달성</h2>
                <p className="sub-hint">
                  집중한 날: {goalStats.focusedDaysCount}일 · 달성 일수:{" "}
                  {goalStats.achievedDaysCount}일 · 달성률: {goalStats.rate}%
                </p>
              </div>
              <label className="goal-target-badge">
                <Target size={14} /> 목표:
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
                <strong>2026년 10월</strong>
              </div>
              <div className="goal-cal-weekdays">
                {["월", "화", "수", "목", "금", "토", "일"].map((w) => (
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
                      title={
                        minFocused
                          ? `${dayNum}일: ${minFocused}분 집중`
                          : `${dayNum}일: 기록 없음`
                      }
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
                <Flame size={14} /> 최근 스탑워치 집중 로그
              </h4>
              {focusSessions.slice(0, 5).map((s) => (
                <div className="focus-log-item" key={s.id}>
                  <span className="tag tag-blue">{s.timeStr} 시작</span>
                  <span className="focus-log-title">{s.label}</span>
                  <b>{s.durationMinutes}분</b>
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
