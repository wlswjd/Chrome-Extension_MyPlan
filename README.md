# My Plan — Daily Schedule, To-Do & Focus Analytics Chrome Extension

**My Plan** is a pastel-themed productivity Chrome Extension designed to help you organize your daily schedule, manage tag-based to-do lists, track focus sessions with a built-in Pomodoro stopwatch, and review your weekly performance in a full-screen analytics dashboard.

---

## Key Features

### 1. Daily Schedule (Popup Tab 1)
- **Live Today's Date Header**: Automatically displays the current year, month, day, and day of the week in the top header.
- **Customizable Time Range**: Adjust the visible timeline hours (e.g., `06:00 ~ 23:00`) using the top-right dropdown selectors.
- **Quick Slot Creation & Editing**:
  - Hover over any empty hour slot and click the `+` button to add a new schedule block.
  - Click any existing schedule block to edit its title, time range, or delete it.
  - **7 Pastel Color Palette**: Categorize your events visually with 7 soft pastel colors (Rose, Peach, Butter, Sage, Sky, Periwinkle, Stone).

### 2. To-Do List (Popup Tab 2)
- **Tag-Based Task Management**: Add tasks quickly along with a category tag (`#학습`, `#운동`, `#공부`, `#업무`, `#휴식`, `#식사`, `#기타`).
- **Progress Tracking**: View your real-time completion count and progress bar at the top.
- **Status Filters**: Filter tasks by `전체` (All), `오늘` (Active/Remaining), or `완료` (Completed).

### 3. Focus Stopwatch (Popup Tab 3)
- **Circular Pomodoro Timer**: Stay focused with a visual progress ring and quick presets (`25m Pomodoro`, `50m Deep Focus`, `1h Immersion`).
- **Automatic Daily Session Log (`오늘의 집중 기록`)**:
  - Records the exact real-world start time (e.g., `09:10`) when you press **Start (`시작하기`)**.
  - Automatically logs completed sessions (or sessions reset after 1+ minute of focus) in sequential order (`첫 번째 세션`, `두 번째 세션`, etc.).
  - Automatically resets the daily list in the popup at midnight while preserving past records for the analytics dashboard.

### 4. Full-Screen Weekly & Focus Analytics Dashboard
Click the **Analytics icon** (next to the Settings gear icon in the top-right corner) to open the full-page dashboard:
- **6 Top KPI Summary Cards**: View Total Focus Time, Weekly Focus Time, Today's Focus Time, Completed Tasks, Completed Weekly Blocks, and Overall Achievement Rate at a glance.
- **Interactive Weekly Timetable**: Click any cell across Monday–Sunday to add, edit, color-code, or mark weekly schedule blocks as completed.
- **Weekly Memo**: Write reflections and goals for the week.
- **Achievement Rate Donut Chart**: Visualizes your completion rate, total planned hours, completed hours, and remaining hours.
- **Tag Ratio Breakdown**: Automatically calculates and displays the percentage distribution of your To-Do tags.
- **Stopwatch Focus Heatmap & Monthly Goal Calendar**: Inspect your 10-day hourly focus distribution and track daily focus goals (e.g., `3H/day`) on a monthly calendar.
- **Light & Dark Theme Toggle**: Switch seamlessly between the Pastel Light Report theme and the Dark Report theme.

---

## Getting Started & Usage

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm**

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (Local Preview)
To preview and test the UI in your browser with hot-reload:
```bash
npm run dev
```
- **Popup View**: Open `http://localhost:5173`
- **Full Analytics Dashboard View**: Open `http://localhost:5173/?page=report`

### 3. Build & Load as a Chrome Extension
Whenever you make changes to the source code, build the production bundle into the `dist/` folder:
```bash
npm run build
```

Then load it into Google Chrome:
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (압축해제된 확장 프로그램을 로드합니다).
4. Select the **`dist`** folder inside this project directory.
5. Pin **My Plan** to your Chrome toolbar and click its icon to open the popup!
   *(If the extension is already loaded, click the **Reload** icon on the extension card in `chrome://extensions/` after running `npm run build`.)*

---

## Customization Guide

All main configuration constants are located at the top of `src/App.jsx` for easy editing:

| What to Customize | File & Variable | Description |
| :--- | :--- | :--- |
| **Schedule Colors** | `src/App.jsx` → `SCHEDULE_COLORS` | Edit hex/background colors for the 7 circular color pickers in the timeline. |
| **To-Do Tags** | `src/App.jsx` → `TAG_CONFIG` | Add, rename, or recolor task tags used in the To-Do List and Tag Ratio chart. |
| **Timer Presets** | `src/App.jsx` → `PRESET_LIST` | Change default stopwatch durations (in minutes) and labels. |
| **Initial Seed Data** | `src/App.jsx` → `seedTasks`, `seedEvents`, `seedWeeklyEvents`, `seedFocusSessions` | Modify or clear (`[]`) the initial sample data loaded on first run. |
| **Popup Size & Theme** | `src/styles.css` → `:root`, `.popup-viewport` | Adjust color variables or popup dimensions (`390px × 590px`). |

> **Tip**: Because changes are persisted in `localStorage`, if you edit the initial `seed*` arrays in `src/App.jsx` and want to see them reflected immediately, clear your browser's `localStorage` (DevTools → Application → Local Storage → Clear) and reload.

---

## Project Structure

```text
my-plan-extension/
├── public/
│   └── manifest.json      # Chrome Extension Manifest V3 configuration
├── src/
│   ├── App.jsx            # Main Popup UI & Full Analytics Platform components
│   ├── main.jsx           # React entry point
│   └── styles.css         # Styles for Popup & Analytics views (Light & Dark modes)
├── index.html             # HTML template (includes Noto Sans KR & Nunito fonts)
├── plan.md                # Future roadmap & feature implementation plan
├── package.json
└── vite.config.js
```
