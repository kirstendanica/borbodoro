let timer = null;
let isRunning = false;
let isWorkTime = true;
let timeLeft = 25 * 60;

let workDuration = 25 * 60;
let breakDuration = 5 * 60;

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const timeDisplay = document.getElementById('time-display');
const sessionLabel = document.getElementById('session-label');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');
const workInput = document.getElementById('work-duration');
const breakInput = document.getElementById('break-duration');
const alarmSound = document.getElementById('alarm-sound');
const progressCircle = document.querySelector('.progress-ring-circle');
const themeToggle = document.getElementById('theme-toggle');

let completedSessions = JSON.parse(localStorage.getItem('completedSessions')) || [];

progressCircle.style.strokeDasharray = CIRCUMFERENCE;

// ========== UPDATE FUNCTIONALITY ========== //
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  sessionLabel.textContent = isWorkTime ? 'Work Time' : 'Break Time';
  updateProgress();
}

function updateProgress() {
  const duration = isWorkTime ? workDuration : breakDuration;
  const offset = CIRCUMFERENCE - (timeLeft / duration) * CIRCUMFERENCE;
  progressCircle.style.strokeDashoffset = offset;
}

function updateDurations() {
  workDuration = parseInt(workInput.value) * 60;
  breakDuration = parseInt(breakInput.value) * 60;
}

// ========== TIMER LOGIC ========== //
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;

  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
      saveSession();
    } else {
      handleSessionSwitch();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  isRunning = false;
  startBtn.disabled = false;
}

function resetTimer() {
  stopTimer();
  isWorkTime = true;
  updateDurations();
  timeLeft = workDuration;
  updateDisplay();
}

// ========== SESSION HANDLING ========== //
function handleSessionSwitch() {
  if (isWorkTime) {
    logSession();
    updateStatsPanel();
  }

  isWorkTime = !isWorkTime;
  timeLeft = isWorkTime ? workDuration : breakDuration;
  sessionLabel.textContent = isWorkTime ? 'Work Time' : 'Break Time';
  updateDisplay();
  alarmSound.play();

  alert(isWorkTime ? '⏳ Back to work! Let’s go!' : '🎉 Break time! You earned it!');
  saveSession();
}

function logSession() {
  completedSessions.push({
    timestamp: new Date().toISOString(),
    duration: workDuration
  });
  localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
}

function saveSession() {
  localStorage.setItem('isWorkTime', isWorkTime);
  localStorage.setItem('timeLeft', timeLeft);
}

function loadSession() {
  updateDurations();
  const savedWorkTime = localStorage.getItem('isWorkTime');
  const savedTimeLeft = localStorage.getItem('timeLeft');

  isWorkTime = savedWorkTime === 'true';
  timeLeft = savedTimeLeft ? parseInt(savedTimeLeft) : workDuration;
  updateDisplay();
}

// ========== STATS LOGIC ========== //
function getSessionStats() {
  const now = new Date();
  let daily = 0, weekly = 0, monthly = 0, totalMinutes = 0;

  completedSessions.forEach(({ timestamp, duration }) => {
    const date = new Date(timestamp);
    totalMinutes += duration / 60;

    if (isSameDay(date, now)) daily++;
    if (isSameWeek(date, now)) weekly++;
    if (isSameMonth(date, now)) monthly++;
  });

  return {
    today: daily,
    thisWeek: weekly,
    thisMonth: monthly,
    totalHours: (totalMinutes / 60).toFixed(1)
  };
}

function updateStatsPanel() {
  const stats = getSessionStats();
  document.getElementById('stat-today').textContent = stats.today;
  document.getElementById('stat-week').textContent = stats.thisWeek;
  document.getElementById('stat-month').textContent = stats.thisMonth;
  document.getElementById('stat-hours').textContent = stats.totalHours;
}

// ========== DATE UTILITIES ========== //
function isSameDay(d1, d2) {
  return d1.toDateString() === d2.toDateString();
}

function isSameWeek(d1, d2) {
  const getWeek = date =>
    Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 86400000) + date.getDay() + 1) / 7);

  return d1.getFullYear() === d2.getFullYear() && getWeek(d1) === getWeek(d2);
}

function isSameMonth(d1, d2) {
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

// ========== EVENT LISTENERS ========== //
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

workInput.addEventListener('change', () => {
  updateDurations();
  if (isWorkTime) {
    timeLeft = workDuration;
    updateDisplay();
  }
});

breakInput.addEventListener('change', () => {
  updateDurations();
  if (!isWorkTime) {
    timeLeft = breakDuration;
    updateDisplay();
  }
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.setAttribute('aria-pressed', document.body.classList.contains('dark'));
});

window.addEventListener('beforeunload', e => {
  if (isRunning) {
    e.preventDefault();
    e.returnValue = 'Your timer is still running! Are you sure you want to leave?';
  }
});

loadSession();
updateStatsPanel();
