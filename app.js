/**
 * ==========================================================================
 * TaskFlow — JavaScript Logic, State Management & DOM Architecture
 * ==========================================================================
 * Features:
 * - Reactive Single-Source-of-Truth State Management
 * - Event Delegation on dynamic list containers
 * - Full CRUD with inline editing and 5-second Undo toast
 * - window.localStorage automatic sync
 * - Multi-criteria Filtering (Status + Category + Realtime Search)
 * - Sorting (Creation Date, Priority, Due Date)
 * - Web Audio API synthesized soundscapes
 * - Keyboard navigation and shortcuts
 */

'use strict';

// --------------------------------------------------------------------------
// 1. Constants & Default Seed Data
// --------------------------------------------------------------------------
const STORAGE_KEYS = {
  TASKS: 'taskflow_tasks_v2',
  THEME: 'taskflow_theme_v2',
  SOUND: 'taskflow_sound_v2'
};

const INITIAL_SEED_TASKS = [
  {
    id: 'task_1',
    title: 'Master DOM manipulation & event delegation',
    completed: true,
    priority: 'high',
    category: 'study',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    createdAt: Date.now() - 3600000 * 5
  },
  {
    id: 'task_2',
    title: 'Review state persistence with window.localStorage',
    completed: false,
    priority: 'high',
    category: 'study',
    dueDate: new Date().toISOString().split('T')[0], // today
    createdAt: Date.now() - 3600000 * 3
  },
  {
    id: 'task_3',
    title: 'Design responsive glassmorphism UI components',
    completed: false,
    priority: 'medium',
    category: 'work',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days ahead
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'task_4',
    title: 'Hydrate 2L of water and complete workout',
    completed: true,
    priority: 'low',
    category: 'health',
    dueDate: null,
    createdAt: Date.now() - 3600000
  }
];

// --------------------------------------------------------------------------
// 2. Web Audio API Synthesizer Service
// --------------------------------------------------------------------------
class SoundEffectsService {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  _initContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.08) {
    if (!this.enabled) return;
    try {
      this._initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Gracefully handle any browser audio autoplay policy restrictions
    }
  }

  playComplete() {
    if (!this.enabled) return;
    // Pleasant ascending major triad (E5, G#5, B5)
    this.playTone(659.25, 'sine', 0.12, 0.07);
    setTimeout(() => this.playTone(830.61, 'sine', 0.15, 0.08), 80);
    setTimeout(() => this.playTone(987.77, 'sine', 0.22, 0.09), 160);
  }

  playUncomplete() {
    if (!this.enabled) return;
    this.playTone(440, 'triangle', 0.1, 0.05);
  }

  playAdd() {
    if (!this.enabled) return;
    this.playTone(523.25, 'sine', 0.08, 0.06);
    setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.06), 60);
  }

  playDelete() {
    if (!this.enabled) return;
    this.playTone(330, 'triangle', 0.15, 0.06);
  }
}

const audio = new SoundEffectsService();

// --------------------------------------------------------------------------
// 3. Central Application State
// --------------------------------------------------------------------------
const state = {
  tasks: [],
  filter: 'all', // 'all' | 'active' | 'completed'
  categoryFilter: 'all', // 'all' | 'work' | 'personal' | 'study' | 'health' | 'general'
  searchQuery: '',
  sortBy: 'created-desc', // 'created-desc' | 'created-asc' | 'priority-desc' | 'due-asc'
  theme: 'dark',
  soundEnabled: true,
  editingTaskId: null,
  recentlyDeletedTask: null,
  undoTimerId: null
};

// --------------------------------------------------------------------------
// 4. DOM Cache
// --------------------------------------------------------------------------
const DOM = {
  // Theme & Sound & Shortcuts
  html: document.documentElement,
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeSunIcon: document.getElementById('theme-sun-icon'),
  themeMoonIcon: document.getElementById('theme-moon-icon'),
  soundToggleBtn: document.getElementById('sound-toggle-btn'),
  soundIconOn: document.getElementById('sound-icon-on'),
  soundIconOff: document.getElementById('sound-icon-off'),
  shortcutsBtn: document.getElementById('shortcuts-btn'),
  shortcutsModal: document.getElementById('shortcuts-modal'),
  closeShortcutsBtn: document.getElementById('close-shortcuts-btn'),
  currentDateDisplay: document.getElementById('current-date-display'),

  // Stats Dashboard
  statsStatusText: document.getElementById('stats-status-text'),
  statTotal: document.getElementById('stat-total'),
  statActive: document.getElementById('stat-active'),
  statCompleted: document.getElementById('stat-completed'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  progressPercentLabel: document.getElementById('progress-percent-label'),
  progressRemainingLabel: document.getElementById('progress-remaining-label'),

  // Task Creation Form
  taskForm: document.getElementById('task-form'),
  taskTitleInput: document.getElementById('task-title-input'),
  taskPrioritySelect: document.getElementById('task-priority-select'),
  taskCategorySelect: document.getElementById('task-category-select'),
  taskDueDateInput: document.getElementById('task-due-date-input'),

  // Controls & Filters
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  tabBadgeAll: document.getElementById('tab-badge-all'),
  tabBadgeActive: document.getElementById('tab-badge-active'),
  tabBadgeCompleted: document.getElementById('tab-badge-completed'),
  filterCategorySelect: document.getElementById('filter-category-select'),
  sortSelect: document.getElementById('sort-select'),

  // Task List Mount Point
  taskList: document.getElementById('task-list'),
  emptyState: document.getElementById('empty-state'),
  emptyTitle: document.getElementById('empty-title'),
  emptyDesc: document.getElementById('empty-desc'),

  // Footer Actions
  footerCountText: document.getElementById('footer-count-text'),
  clearCompletedBtn: document.getElementById('clear-completed-btn'),
  clearAllBtn: document.getElementById('clear-all-btn'),

  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastUndoBtn: document.getElementById('toast-undo-btn'),
  toastDismissBtn: document.getElementById('toast-dismiss-btn'),
  toastProgressBar: document.getElementById('toast-progress-bar'),

  // Confirm Modal
  confirmModal: document.getElementById('confirm-modal'),
  closeConfirmBtn: document.getElementById('close-confirm-btn'),
  confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
  confirmActionBtn: document.getElementById('confirm-action-btn')
};

// --------------------------------------------------------------------------
// 5. Storage Adapter
// --------------------------------------------------------------------------
const Storage = {
  loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Failed to parse tasks from localStorage:', err);
    }
    // Fallback to seed tasks on first visit
    this.saveTasks(INITIAL_SEED_TASKS);
    return INITIAL_SEED_TASKS;
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to save tasks to localStorage:', err);
    }
  },

  loadTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  },

  saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  loadSound() {
    const raw = localStorage.getItem(STORAGE_KEYS.SOUND);
    return raw !== null ? raw === 'true' : true;
  },

  saveSound(enabled) {
    localStorage.setItem(STORAGE_KEYS.SOUND, String(enabled));
  }
};

// --------------------------------------------------------------------------
// 6. Security & Utility Helpers
// --------------------------------------------------------------------------
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateUniqueId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

function formatRelativeDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateStr.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)}d overdue`,
      type: 'overdue'
    };
  } else if (diffDays === 0) {
    return {
      text: 'Today',
      type: 'today'
    };
  } else if (diffDays === 1) {
    return {
      text: 'Tomorrow',
      type: 'upcoming'
    };
  } else {
    return {
      text: `${dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      type: 'future'
    };
  }
}

// --------------------------------------------------------------------------
// 7. Core CRUD Operations (State Mutators)
// --------------------------------------------------------------------------

/**
 * CREATE: Adds a new task to the top of the list
 */
function addTask(title, priority = 'medium', category = 'general', dueDate = null) {
  const trimmed = title.trim();
  if (!trimmed) return;

  const newTask = {
    id: generateUniqueId(),
    title: trimmed,
    completed: false,
    priority,
    category,
    dueDate: dueDate || null,
    createdAt: Date.now()
  };

  state.tasks.unshift(newTask);
  Storage.saveTasks(state.tasks);
  audio.playAdd();
  render();
}

/**
 * READ / TOGGLE (UPDATE): Toggles task completion state
 */
function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  Storage.saveTasks(state.tasks);

  if (task.completed) {
    audio.playComplete();
  } else {
    audio.playUncomplete();
  }

  render();
}

/**
 * UPDATE: Saves edited title for a task
 */
function updateTaskTitle(id, newTitle) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const trimmed = newTitle.trim();
  if (trimmed && trimmed !== task.title) {
    task.title = trimmed;
    Storage.saveTasks(state.tasks);
  }

  state.editingTaskId = null;
  render();
}

/**
 * DELETE: Deletes task with animation and provides 5-second Undo capability
 */
function deleteTask(id) {
  const taskIndex = state.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return;

  const taskEl = document.querySelector(`.task-item[data-id="${id}"]`);
  const task = state.tasks[taskIndex];

  // Animate removal first for buttery smoothness
  if (taskEl) {
    taskEl.classList.add('removing');
    audio.playDelete();
  }

  setTimeout(() => {
    // Record for Undo capability
    state.recentlyDeletedTask = {
      task,
      index: taskIndex
    };

    // Remove from state
    state.tasks = state.tasks.filter(t => t.id !== id);
    Storage.saveTasks(state.tasks);
    render();

    // Trigger floating Undo Toast
    showUndoToast(`Deleted "${task.title.length > 25 ? task.title.slice(0, 25) + '...' : task.title}"`);
  }, 220);
}

/**
 * UNDO: Restores the last deleted task
 */
function undoDelete() {
  if (!state.recentlyDeletedTask) return;

  const { task, index } = state.recentlyDeletedTask;
  // Re-insert at original index or prepend
  state.tasks.splice(Math.min(index, state.tasks.length), 0, task);
  Storage.saveTasks(state.tasks);

  hideUndoToast();
  audio.playAdd();
  render();
}

/**
 * BULK ACTION: Clear all completed tasks
 */
function clearCompletedTasks() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;

  state.tasks = state.tasks.filter(t => !t.completed);
  Storage.saveTasks(state.tasks);
  audio.playDelete();
  render();
}

/**
 * BULK ACTION: Clear all tasks (modal confirmation)
 */
function clearAllTasks() {
  state.tasks = [];
  Storage.saveTasks(state.tasks);
  audio.playDelete();
  render();
  closeConfirmModal();
}

// --------------------------------------------------------------------------
// 8. Filtering & Sorting Engine
// --------------------------------------------------------------------------
function getProcessedTasks() {
  let result = [...state.tasks];

  // 1. Filter by Completion Status
  if (state.filter === 'active') {
    result = result.filter(t => !t.completed);
  } else if (state.filter === 'completed') {
    result = result.filter(t => t.completed);
  }

  // 2. Filter by Category
  if (state.categoryFilter !== 'all') {
    result = result.filter(t => t.category === state.categoryFilter);
  }

  // 3. Filter by Search Query
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    result = result.filter(t => t.title.toLowerCase().includes(q));
  }

  // 4. Sorting Pipeline
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  result.sort((a, b) => {
    switch (state.sortBy) {
      case 'created-desc':
        return b.createdAt - a.createdAt;
      case 'created-asc':
        return a.createdAt - b.createdAt;
      case 'priority-desc':
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      case 'due-asc': {
        // Items with due dates come first, sorted ascending
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      default:
        return 0;
    }
  });

  return result;
}

// --------------------------------------------------------------------------
// 9. DOM Rendering Engine
// --------------------------------------------------------------------------
function render() {
  const allCount = state.tasks.length;
  const completedCount = state.tasks.filter(t => t.completed).length;
  const activeCount = allCount - completedCount;
  const percentComplete = allCount === 0 ? 0 : Math.round((completedCount / allCount) * 100);

  // Update Stats Dashboard
  DOM.statTotal.textContent = allCount;
  DOM.statActive.textContent = activeCount;
  DOM.statCompleted.textContent = completedCount;
  DOM.progressBarFill.style.width = `${percentComplete}%`;
  DOM.progressPercentLabel.textContent = `${percentComplete}% Complete`;
  DOM.progressRemainingLabel.textContent = `${activeCount} task${activeCount === 1 ? '' : 's'} remaining`;

  // Update Motivational Header
  if (allCount === 0) {
    DOM.statsStatusText.textContent = 'No tasks yet. Ready to plan?';
  } else if (activeCount === 0) {
    DOM.statsStatusText.textContent = '🎉 All tasks finished! Outstanding job!';
  } else if (percentComplete >= 75) {
    DOM.statsStatusText.textContent = '⚡ Almost there! Finish strong!';
  } else if (percentComplete >= 40) {
    DOM.statsStatusText.textContent = '🚀 Great momentum, keep going!';
  } else {
    DOM.statsStatusText.textContent = "Let's conquer your goals today!";
  }

  // Update Filter Badges
  DOM.tabBadgeAll.textContent = allCount;
  DOM.tabBadgeActive.textContent = activeCount;
  DOM.tabBadgeCompleted.textContent = completedCount;

  // Process & Filter Tasks
  const visibleTasks = getProcessedTasks();

  // Update Footer Count
  DOM.footerCountText.textContent = `Showing ${visibleTasks.length} of ${allCount} task${allCount === 1 ? '' : 's'}`;

  // Toggle Empty State vs Task List
  if (visibleTasks.length === 0) {
    DOM.taskList.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');

    if (state.searchQuery.trim()) {
      DOM.emptyTitle.textContent = 'No Matching Tasks';
      DOM.emptyDesc.textContent = `No tasks found matching "${escapeHTML(state.searchQuery)}".`;
    } else if (state.filter === 'completed') {
      DOM.emptyTitle.textContent = 'No Completed Tasks Yet';
      DOM.emptyDesc.textContent = 'Mark tasks as done to see them archived here.';
    } else if (state.filter === 'active') {
      DOM.emptyTitle.textContent = 'No Active Tasks';
      DOM.emptyDesc.textContent = 'All tasks are completed! Enjoy your free time.';
    } else {
      DOM.emptyTitle.textContent = 'All Caught Up!';
      DOM.emptyDesc.textContent = 'No tasks to display. Add a new task above to stay productive.';
    }
  } else {
    DOM.emptyState.classList.add('hidden');
    renderTaskList(visibleTasks);
  }
}

/**
 * Builds dynamic DOM elements for visible tasks
 */
function renderTaskList(tasks) {
  const fragment = document.createDocumentFragment();

  tasks.forEach(task => {
    const isEditing = state.editingTaskId === task.id;
    const isCompleted = task.completed;
    const dueDateInfo = formatRelativeDueDate(task.dueDate);

    const li = document.createElement('li');
    li.className = `task-item ${isCompleted ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-priority', task.priority);

    // Capitalize category display
    const categoryName = task.category.charAt(0).toUpperCase() + task.category.slice(1);

    li.innerHTML = `
      <div class="task-left">
        <button class="task-checkbox-btn" data-action="toggle" title="${isCompleted ? 'Mark incomplete' : 'Mark complete'}" aria-label="${isCompleted ? 'Mark incomplete' : 'Mark complete'}">
          <div class="checkbox-custom">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </button>

        <div class="task-details">
          ${
            isEditing
              ? `<input type="text" class="task-edit-input" data-action="edit-input" value="${escapeHTML(task.title)}" maxlength="120" />`
              : `<span class="task-title-text" data-action="title" title="Double click to edit">${escapeHTML(task.title)}</span>`
          }

          <div class="task-meta">
            <!-- Priority Badge -->
            <span class="tag-pill tag-priority-${task.priority}">
              ${task.priority === 'high' ? '🔥 High' : task.priority === 'medium' ? '⚡ Medium' : '🌱 Low'}
            </span>

            <!-- Category Badge -->
            <span class="tag-pill tag-category-${task.category}">
              ${categoryName}
            </span>

            <!-- Due Date Badge -->
            ${
              dueDateInfo
                ? `<span class="tag-due ${dueDateInfo.type}">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    ${dueDateInfo.text}
                  </span>`
                : ''
            }
          </div>
        </div>
      </div>

      <div class="task-actions">
        ${
          !isEditing
            ? `<button class="action-btn edit-btn" data-action="edit" title="Edit task (Double-click)" aria-label="Edit task">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>`
            : ''
        }
        <button class="action-btn delete-btn" data-action="delete" title="Delete task" aria-label="Delete task">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    `;

    fragment.appendChild(li);
  });

  DOM.taskList.innerHTML = '';
  DOM.taskList.appendChild(fragment);

  // If a task is currently being edited, auto-focus the input
  if (state.editingTaskId) {
    const editInput = DOM.taskList.querySelector('.task-edit-input');
    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  }
}

// --------------------------------------------------------------------------
// 10. Floating Toast & Undo Logic
// --------------------------------------------------------------------------
function showUndoToast(message, durationMs = 5000) {
  if (state.undoTimerId) {
    clearTimeout(state.undoTimerId);
    state.undoTimerId = null;
  }

  DOM.toastMessage.textContent = message;
  DOM.toast.classList.add('show');

  // Reset and animate progress bar
  DOM.toastProgressBar.style.transition = 'none';
  DOM.toastProgressBar.style.width = '100%';

  // Force reflow
  void DOM.toastProgressBar.offsetWidth;

  DOM.toastProgressBar.style.transition = `width ${durationMs}ms linear`;
  DOM.toastProgressBar.style.width = '0%';

  state.undoTimerId = setTimeout(() => {
    hideUndoToast();
    state.recentlyDeletedTask = null;
  }, durationMs);
}

function hideUndoToast() {
  if (state.undoTimerId) {
    clearTimeout(state.undoTimerId);
    state.undoTimerId = null;
  }
  DOM.toast.classList.remove('show');
}

// --------------------------------------------------------------------------
// 11. Modals Management
// --------------------------------------------------------------------------
function openShortcutsModal() {
  DOM.shortcutsModal.classList.remove('hidden');
}

function closeShortcutsModal() {
  DOM.shortcutsModal.classList.add('hidden');
}

function openConfirmModal() {
  DOM.confirmModal.classList.remove('hidden');
}

function closeConfirmModal() {
  DOM.confirmModal.classList.add('hidden');
}

// --------------------------------------------------------------------------
// 12. Theme & Audio Toggles
// --------------------------------------------------------------------------
function applyTheme(theme) {
  state.theme = theme;
  DOM.html.setAttribute('data-theme', theme);
  Storage.saveTheme(theme);

  if (theme === 'dark') {
    DOM.themeSunIcon.classList.remove('hidden');
    DOM.themeMoonIcon.classList.add('hidden');
  } else {
    DOM.themeSunIcon.classList.add('hidden');
    DOM.themeMoonIcon.classList.remove('hidden');
  }
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

function applySound(enabled) {
  state.soundEnabled = enabled;
  audio.enabled = enabled;
  Storage.saveSound(enabled);

  if (enabled) {
    DOM.soundIconOn.classList.remove('hidden');
    DOM.soundIconOff.classList.add('hidden');
  } else {
    DOM.soundIconOn.classList.add('hidden');
    DOM.soundIconOff.classList.remove('hidden');
  }
}

function toggleSound() {
  applySound(!state.soundEnabled);
  if (state.soundEnabled) {
    audio.playAdd();
  }
}

// --------------------------------------------------------------------------
// 13. Event Delegation & Listeners Setup
// --------------------------------------------------------------------------

/**
 * Centralized Event Delegation for Task List items
 */
function setupTaskListDelegation() {
  // Click actions: Toggle Checkbox, Edit Button, Delete Button
  DOM.taskList.addEventListener('click', e => {
    const actionTarget = e.target.closest('[data-action]');
    if (!actionTarget) return;

    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.getAttribute('data-id');
    const action = actionTarget.getAttribute('data-action');

    switch (action) {
      case 'toggle':
        toggleTask(taskId);
        break;
      case 'delete':
        deleteTask(taskId);
        break;
      case 'edit':
        state.editingTaskId = taskId;
        render();
        break;
    }
  });

  // Double click on title to edit
  DOM.taskList.addEventListener('dblclick', e => {
    const titleEl = e.target.closest('.task-title-text');
    if (!titleEl) return;

    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.getAttribute('data-id');
    state.editingTaskId = taskId;
    render();
  });

  // Keydown in edit input: Enter saves, Escape cancels
  DOM.taskList.addEventListener('keydown', e => {
    if (!e.target.classList.contains('task-edit-input')) return;

    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    const taskId = taskItem.getAttribute('data-id');

    if (e.key === 'Enter') {
      e.preventDefault();
      updateTaskTitle(taskId, e.target.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      state.editingTaskId = null;
      render();
    }
  });

  // Blur in edit input: auto-save on clicking away
  DOM.taskList.addEventListener('focusout', e => {
    if (e.target.classList.contains('task-edit-input')) {
      const taskItem = e.target.closest('.task-item');
      if (!taskItem) return;
      const taskId = taskItem.getAttribute('data-id');

      // Small delay to allow cancel if user clicked something else
      setTimeout(() => {
        if (state.editingTaskId === taskId) {
          updateTaskTitle(taskId, e.target.value);
        }
      }, 100);
    }
  });
}

/**
 * Setup All Application Event Handlers
 */
function setupEventListeners() {
  // 1. Task Creation Form Submit
  DOM.taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = DOM.taskTitleInput.value;
    const priority = DOM.taskPrioritySelect.value;
    const category = DOM.taskCategorySelect.value;
    const dueDate = DOM.taskDueDateInput.value;

    if (title.trim()) {
      addTask(title, priority, category, dueDate);
      DOM.taskTitleInput.value = '';
      DOM.taskDueDateInput.value = '';
      DOM.taskTitleInput.focus();
    }
  });

  // 2. Status Filter Tabs
  DOM.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      state.filter = tab.getAttribute('data-filter');
      render();
    });
  });

  // 3. Category Filter Dropdown
  DOM.filterCategorySelect.addEventListener('change', e => {
    state.categoryFilter = e.target.value;
    render();
  });

  // 4. Sort Dropdown
  DOM.sortSelect.addEventListener('change', e => {
    state.sortBy = e.target.value;
    render();
  });

  // 5. Search Box & Clear Button
  DOM.searchInput.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    if (state.searchQuery.length > 0) {
      DOM.searchClearBtn.classList.remove('hidden');
    } else {
      DOM.searchClearBtn.classList.add('hidden');
    }
    render();
  });

  DOM.searchClearBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    DOM.searchClearBtn.classList.add('hidden');
    DOM.searchInput.focus();
    render();
  });

  // 6. Bulk Actions (Clear Completed & Clear All)
  DOM.clearCompletedBtn.addEventListener('click', () => {
    clearCompletedTasks();
  });

  DOM.clearAllBtn.addEventListener('click', () => {
    if (state.tasks.length > 0) {
      openConfirmModal();
    }
  });

  DOM.confirmActionBtn.addEventListener('click', () => {
    clearAllTasks();
  });

  DOM.confirmCancelBtn.addEventListener('click', closeConfirmModal);
  DOM.closeConfirmBtn.addEventListener('click', closeConfirmModal);
  DOM.confirmModal.addEventListener('click', e => {
    if (e.target === DOM.confirmModal) closeConfirmModal();
  });

  // 7. Toast Actions
  DOM.toastUndoBtn.addEventListener('click', undoDelete);
  DOM.toastDismissBtn.addEventListener('click', hideUndoToast);

  // 8. Toggles & Modal Triggers
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);
  DOM.soundToggleBtn.addEventListener('click', toggleSound);
  DOM.shortcutsBtn.addEventListener('click', openShortcutsModal);
  DOM.closeShortcutsBtn.addEventListener('click', closeShortcutsModal);
  DOM.shortcutsModal.addEventListener('click', e => {
    if (e.target === DOM.shortcutsModal) closeShortcutsModal();
  });

  // 9. Global Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    // If inside an input or textarea, only allow Escape
    const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);

    if (e.key === 'Escape') {
      closeShortcutsModal();
      closeConfirmModal();
      hideUndoToast();
      if (state.editingTaskId) {
        state.editingTaskId = null;
        render();
      }
      if (document.activeElement === DOM.searchInput) {
        DOM.searchInput.blur();
      }
      return;
    }

    if (isTyping) return;

    // Shortcut: '?' opens shortcuts modal
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      openShortcutsModal();
    }

    // Shortcut: '/' focuses search input
    if (e.key === '/') {
      e.preventDefault();
      DOM.searchInput.focus();
      DOM.searchInput.select();
    }

    // Shortcut: 'N' focuses new task input
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      DOM.taskTitleInput.focus();
    }

    // Shortcut: 'T' toggles theme
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      toggleTheme();
    }

    // Shortcut: 'M' toggles sound
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleSound();
    }
  });

  // 10. Delegate dynamic list events
  setupTaskListDelegation();
}

/**
 * Display formatted current date
 */
function displayCurrentDate() {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const today = new Date().toLocaleDateString(undefined, options);
  DOM.currentDateDisplay.textContent = `${today} • Focus Time`;
}

// --------------------------------------------------------------------------
// 14. Application Initialization Bootstrapper
// --------------------------------------------------------------------------
function init() {
  // 1. Load preferences
  applyTheme(Storage.loadTheme());
  applySound(Storage.loadSound());

  // 2. Load Tasks State
  state.tasks = Storage.loadTasks();

  // 3. Set minimum due date to today
  const todayISO = new Date().toISOString().split('T')[0];
  DOM.taskDueDateInput.setAttribute('min', todayISO);

  // 4. Render date and register events
  displayCurrentDate();
  setupEventListeners();

  // 5. Initial Render
  render();
}

// Bootstrap once DOM content is ready
document.addEventListener('DOMContentLoaded', init);
