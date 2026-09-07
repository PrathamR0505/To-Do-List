# TaskFlow — Interactive Client-Side To-Do Application

A modern, production-grade To-Do List application crafted with **Vanilla JavaScript (ES6+)**, **Semantic HTML5**, and **Vanilla CSS**. Built to demonstrate mastery of client-side architecture, dynamic DOM manipulation, event delegation, reactive state synchronization, and persistent browser storage (`window.localStorage`).

---

## Key Features & Internship Learning Objectives

### 1. Full CRUD Implementation
- **Create (C)**: Add tasks with custom titles, priorities (`🔥 High`, `⚡ Medium`, `🌱 Low`), categories (`💼 Work`, `🏠 Personal`, `📚 Study`, `💪 Health`, `✨ General`), and optional due dates.
- **Read (R)**: Dynamic rendering pipeline transforming state arrays into interactive DOM nodes with XSS sanitization (`escapeHTML`).
- **Update (U)**:
  - Toggle completion status with instant visual feedback, strikethrough styling, and audio cue.
  - Inline title editing via edit button or double-clicking the title text (`Enter` to save, `Esc` to cancel, blur auto-save).
- **Delete (D)**:
  - Task deletion with smooth slide-out and height-collapse CSS transitions.
  - **Undo Mechanism**: Floating toast notification with a 5-second countdown timer bar allowing users to restore mistakenly deleted tasks.
- **Bulk Operations**: "Clear Completed" and "Reset All" with an accessible confirmation dialog.

### 2. State-Driven Architecture & Reactive Rendering
- A centralized `state` store maintains:
  - `tasks`: Array of task objects.
  - `filter`: Current status filter (`'all' | 'active' | 'completed'`).
  - `categoryFilter`: Category filter.
  - `searchQuery`: Real-time substring filter.
  - `sortBy`: Active sorting method (`'created-desc' | 'created-asc' | 'priority-desc' | 'due-asc'`).
  - `theme`: Active color theme (`'dark' | 'light'`).
  - `soundEnabled`: Haptic audio state.
  - `editingTaskId`: Current inline editing target ID.
- Single-direction data flow:
  $$\text{User Action} \longrightarrow \text{State Mutation} \longrightarrow \text{Storage Sync} \longrightarrow \text{DOM Re-render}$$

### 3. DOM Manipulation & Event Delegation
- Instead of attaching individual event listeners to every task element (which causes memory leaks and performance issues in large lists), **Event Delegation** is utilized on the parent `<ul id="task-list">`:
  - `click` event listener inspects `e.target.closest('[data-action]')` to determine whether the user clicked a checkbox toggle, edit trigger, or delete action.
  - `dblclick` event listener enables instant inline editing on task titles.
  - `keydown` event listener traps `Enter` and `Escape` for inline input edits.
  - `focusout` event listener gracefully commits changes when clicking outside the input.

### 4. Browser Persistence (`window.localStorage`)
- Automatically saves state snapshots to `localStorage` under `taskflow_tasks_v2`, `taskflow_theme_v2`, and `taskflow_sound_v2`.
- Safe deserialization wrapped in `try/catch` with fallback initial seed tasks so first-time visitors immediately experience a populated, active dashboard.
- Survives browser reloads, page navigation, and system restarts.

### 5. Advanced Multi-Criteria Filtering & Real-Time Search
- **Status Filter**: All, Active, Completed tabs displaying live count badges.
- **Category Filter**: Filter by Work, Personal, Study, Health, General.
- **Search Bar**: Instant filtering as you type, with clear button (`X`).
- **Sorting Engine**: Sort by Newest, Oldest, Highest Priority, or Due Date.
- **Dynamic Empty States**: Context-sensitive empty screens displaying distinct messages when no tasks match searches or filters.

### 6. Productivity Dashboard & Gamified Feedback
- **Dynamic Progress Bar**: Smooth animated percentage bar reflecting real-time task completion rate.
- **Motivational Status Headings**: Contextual encouraging messages based on your progress percentage.
- **Due Date Badges**: Automatically detects and highlights tasks as **Overdue** (red), **Today** (amber), or upcoming dates.

### 7. Modern UI/UX Aesthetics & Haptics
- **Glassmorphism Design**: Frosted glass cards (`backdrop-filter: blur(20px)`), ambient glowing background orbs, and subtle gradient borders.
- **Dark & Light Mode Engine**: Seamless theme switching persisted in `localStorage`.
- **Synthesized Web Audio API**: Crisp, harmonic polyphonic audio chimes synthesized mathematically in real-time (no bulky external audio files required!). Includes a one-click mute toggle.
- **Keyboard Shortcuts**:
  - `N`: Focus new task input
  - `/`: Focus search box
  - `Enter`: Add task or save edit
  - `Esc`: Cancel edit / close modals / dismiss toast
  - `T`: Toggle theme
  - `M`: Toggle audio effects
  - `?`: Open keyboard shortcuts cheat sheet

---

## File Structure

```text
├── index.html       # Semantic HTML5 layout and modal dialogs
├── style.css        # Vanilla CSS design system, themes, and animations
├── app.js           # Central state manager, event delegation, and logic
└── README.md        # Technical documentation and evaluation guide
```

---

## Running the Application Locally

1. Open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).
2. Alternatively, run a lightweight local static server:
   ```bash
   # Using Python 3:
   python -m http.server 3000
   ```
   Then navigate to `http://localhost:3000`.

---

## Technical Highlights for Evaluators

1. **Zero External Dependencies**: Pure Vanilla JavaScript and Vanilla CSS without bulky frameworks.
2. **Accessible & Responsive**: Keyboard navigable, semantic markup, and responsive layouts tailored from 320px mobile screens to large desktop monitors.
3. **Security Conscious**: All user input rendered into the DOM is sanitized with `escapeHTML` to prevent Cross-Site Scripting (XSS).
