const API_URL = "https://mindscore-1.onrender.com";

const countries = [
  "India", "USA", "Canada", "Australia", "UK", "Germany", "Mexico", "Turkey", "France",
  "Japan", "China", "South Korea", "Brazil", "Spain", "Italy", "Netherlands", "Singapore",
  "New Zealand", "Switzerland", "Sweden", "Norway", "Denmark", "Ireland", "Belgium",
  "Austria", "Portugal", "Poland", "Russia", "South Africa", "Other"
];

const state = {
  step: 0,
  data: {
    age: null,
    gender: null,
    country: null,
    academic_level: null,
    most_used_platform: null,
    purpose_of_use: null,
    avg_daily_usage_hours: 4.5,
    daily_unlocks: 42,
    study_hours: 6,
    physical_activity_hours: 1.5,
    sleep_hours_per_night: 7.5,
    stress_level: null
  },
  lastPayload: null
};

const questions = [
  {
    key: "age",
    title: "How old are you?",
    description: "Your age helps us understand the context of your responses.",
    render: () => `
      <input class="number-input" id="ageInput" type="number" min="10" max="100"
        placeholder="21" value="${state.data.age ?? ""}" autofocus>
    `,
    read: () => {
      const v = Number(document.querySelector("#ageInput").value);
      if (!Number.isInteger(v) || v < 10 || v > 100) return false;
      state.data.age = v; return true;
    }
  },
  {
    key: "gender",
    title: "How do you identify?",
    description: "Select the option that best represents your response.",
    render: () => optionGrid(["Male", "Female"], state.data.gender),
    read: () => readOption("gender")
  },
  {
    key: "country",
    title: "Where are you from?",
    description: "Search for your country. We keep the selector simple so you can find it quickly.",
    render: () => `
      <div class="search-box">
        <input class="country-input" id="countryInput" autocomplete="off"
          placeholder="Search your country..." value="${state.data.country ?? ""}">
        <div class="country-list" id="countryList"></div>
      </div>
    `,
    read: () => {
      const value = document.querySelector("#countryInput").value.trim();
      if (!value) return false;
      state.data.country = value;
      return true;
    }
  },
  {
    key: "academic_level",
    title: "What's your academic level?",
    description: "Choose the option that best describes your current level of study.",
    render: () => optionGrid(["High School", "Undergraduate", "Graduate"], state.data.academic_level, true),
    read: () => readOption("academic_level")
  },
  {
    key: "most_used_platform",
    title: "Which platform do you use most?",
    description: "Pick the social platform you use most frequently.",
    render: () => optionGrid(
      ["Facebook","LinkedIn","Instagram","Snapchat","Twitter","YouTube","TikTok","LINE","KakaoTalk","VKontakte","WhatsApp","WeChat"],
      state.data.most_used_platform, false, true
    ),
    read: () => readOption("most_used_platform")
  },
  {
    key: "purpose_of_use",
    title: "What's your main purpose for using social media?",
    description: "Choose the reason that most closely matches your typical use.",
    render: () => optionGrid(["Networking", "Education", "Entertainment", "News"], state.data.purpose_of_use),
    read: () => readOption("purpose_of_use")
  },
  {
    key: "avg_daily_usage_hours",
    title: "How much time do you spend on social media each day?",
    description: "Move the slider to your approximate average.",
    render: () => rangeInput("avg_daily_usage_hours", 0, 24, .1, state.data.avg_daily_usage_hours, "hours"),
    read: () => readRange("avg_daily_usage_hours")
  },
  {
    key: "daily_unlocks",
    title: "How many times do you unlock your phone?",
    description: "An approximate daily count is completely fine.",
    render: () => `
      <div class="stepper">
        <button type="button" id="minusBtn">−</button>
        <input id="unlockInput" type="number" min="0" value="${state.data.daily_unlocks}">
        <button type="button" id="plusBtn">+</button>
      </div>
    `,
    read: () => {
      const v = Number(document.querySelector("#unlockInput").value);
      if (!Number.isInteger(v) || v < 0) return false;
      state.data.daily_unlocks = v; return true;
    }
  },
  {
    key: "study_hours",
    title: "How many hours do you study each day?",
    description: "Estimate your average daily study time.",
    render: () => rangeInput("study_hours", 0, 24, .5, state.data.study_hours, "hours"),
    read: () => readRange("study_hours")
  },
  {
    key: "physical_activity_hours",
    title: "How much physical activity do you get?",
    description: "Include exercise, sports, walking, or other physical activity.",
    render: () => rangeInput("physical_activity_hours", 0, 24, .5, state.data.physical_activity_hours, "hours"),
    read: () => readRange("physical_activity_hours")
  },
  {
    key: "sleep_hours_per_night",
    title: "How much do you sleep on an average night?",
    description: "Use 0.5-hour increments for a simple estimate.",
    render: () => rangeInput("sleep_hours_per_night", 0, 24, .5, state.data.sleep_hours_per_night, "hours"),
    read: () => readRange("sleep_hours_per_night")
  },
  {
    key: "stress_level",
    title: "How would you describe your stress level?",
    description: "Choose the option that best represents your usual experience.",
    render: () => optionGrid(["Low", "Medium", "High", "Very High"], state.data.stress_level),
    read: () => readOption("stress_level")
  }
];

function optionGrid(options, selected, three = false, platforms = false) {
  const cls = platforms ? "platform-grid" : `option-grid${three ? " three" : ""}`;
  return `<div class="${cls}">${options.map(x =>
    `<button type="button" class="option ${x === selected ? "selected" : ""}" data-value="${escapeHtml(x)}">${escapeHtml(x)}</button>`
  ).join("")}</div>`;
}

function rangeInput(key, min, max, step, value, unit) {
  const shown = Number(value).toFixed(step < 1 ? 1 : 0);
  return `
    <div class="range-wrap">
      <div class="range-value"><strong id="${key}Value">${shown}</strong><span>${unit}</span></div>
      <input id="${key}Range" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
      <div class="range-labels"><span>0h</span><span>24h</span></div>
    </div>
  `;
}

function renderQuestion(direction = "forward") {
  const q = questions[state.step];
  const area = document.querySelector("#questionArea");

  area.innerHTML = `
    <div class="question">
      <div class="question-number">${String(state.step + 1).padStart(2, "0")}</div>
      <h3>${q.title}</h3>
      <p class="question-description">${q.description}</p>
      ${q.render()}
    </div>
  `;

  document.querySelector("#stepLabel").textContent =
    `${String(state.step + 1).padStart(2, "0")} / 12`;
  const pct = Math.round(((state.step + 1) / 12) * 100);
  document.querySelector("#progressPercent").textContent = `${pct}%`;
  document.querySelector("#progressBar").style.width = `${pct}%`;
  document.querySelector("#backBtn").disabled = state.step === 0;
  document.querySelector("#continueBtn").innerHTML =
    state.step === questions.length - 1 ? "Analyze <span>→</span>" : "Continue <span>→</span>";

  bindQuestionControls();

  if (q.key === "country") {
    const input = document.querySelector("#countryInput");
    input.addEventListener("focus", () => filterCountries(""));
    input.addEventListener("input", e => filterCountries(e.target.value));
  }

  const auto = document.querySelector("input[autofocus]");
  if (auto) setTimeout(() => auto.focus(), 30);
}

function bindQuestionControls() {
  document.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  const minus = document.querySelector("#minusBtn");
  const plus = document.querySelector("#plusBtn");
  const unlock = document.querySelector("#unlockInput");

  if (minus && plus && unlock) {
    minus.addEventListener("click", () => {
      unlock.value = Math.max(0, Number(unlock.value || 0) - 1);
    });
    plus.addEventListener("click", () => {
      unlock.value = Number(unlock.value || 0) + 1;
    });
  }

  const range = document.querySelector("input[type='range']");
  if (range) {
    const key = range.id.replace("Range", "");
    const out = document.querySelector(`#${key}Value`);
    range.addEventListener("input", () => {
      out.textContent = Number(range.value).toFixed(.1 < Number(range.step) ? 0 : 1);
    });
  }
}

function filterCountries(query) {
  const list = document.querySelector("#countryList");
  if (!list) return;
  const q = query.toLowerCase();
  const matches = countries.filter(c => c.toLowerCase().includes(q)).slice(0, 8);
  list.innerHTML = matches.map(c =>
    `<div class="country-item ${c === state.data.country ? "selected" : ""}" data-country="${escapeHtml(c)}">${escapeHtml(c)}</div>`
  ).join("");
  list.classList.add("show");

  list.querySelectorAll(".country-item").forEach(item => {
    item.addEventListener("click", () => {
      state.data.country = item.dataset.country;
      document.querySelector("#countryInput").value = item.dataset.country;
      list.classList.remove("show");
    });
  });
}

function readOption(key) {
  const selected = document.querySelector(".option.selected");
  if (!selected) return false;
  state.data[key] = selected.dataset.value;
  return true;
}

function readRange(key) {
  const el = document.querySelector("input[type='range']");
  if (!el) return false;
  state.data[key] = Number(el.value);
  return true;
}

function validateCurrent() {
  return questions[state.step].read();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelector(`#${id}`).classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function next() {
  if (!validateCurrent()) {
    shakeQuestion();
    return;
  }

  if (state.step < questions.length - 1) {
    state.step++;
    renderQuestion();
  } else {
    submitAssessment();
  }
}

function previous() {
  if (state.step > 0) {
    state.step--;
    renderQuestion("back");
  }
}

function shakeQuestion() {
  const q = document.querySelector(".question");
  q.animate([
    { transform: "translateX(0)" },
    { transform: "translateX(-7px)" },
    { transform: "translateX(7px)" },
    { transform: "translateX(0)" }
  ], { duration: 250 });
}

async function submitAssessment() {
  showScreen("loading");

  const payload = {
    age: state.data.age,
    gender: state.data.gender,
    country: state.data.country,
    academic_level: state.data.academic_level,
    most_used_platform: state.data.most_used_platform,
    purpose_of_use: state.data.purpose_of_use,
    avg_daily_usage_hours: Number(state.data.avg_daily_usage_hours),
    daily_unlocks: Number(state.data.daily_unlocks),
    study_hours: Number(state.data.study_hours),
    physical_activity_hours: Number(state.data.physical_activity_hours),
    sleep_hours_per_night: Number(state.data.sleep_hours_per_night),
    stress_level: state.data.stress_level
  };

  state.lastPayload = payload;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API error ${response.status}`);

    const result = await response.json();
    const score = Number(result.predicted_mental_health_score);

    if (!Number.isFinite(score)) throw new Error("Invalid score");

    await sleep(900);
    renderResult(Math.max(0, Math.min(10, score)));
  } catch (error) {
    console.error(error);
    showScreen("error");
  }
}

function getCategory(score) {
  if (score <= 3.9) {
    return {
      title: "Needs Attention",
      message: "Your estimated score suggests that some areas of your current habits may deserve more attention. Consider looking at your sleep, stress, physical activity, and social-media usage patterns."
    };
  }
  if (score <= 5.9) {
    return {
      title: "Below Average",
      message: "Your estimated score indicates some room for improvement. Small changes to daily habits and maintaining a healthy balance with social media may be helpful."
    };
  }
  if (score <= 7.4) {
    return {
      title: "Good",
      message: "Your estimated score suggests generally positive patterns across the information you provided. Keep maintaining a balanced routine and healthy daily habits."
    };
  }
  if (score <= 8.9) {
    return {
      title: "Very Good",
      message: "Your estimated score suggests strong patterns across your reported habits. Continue maintaining a balanced lifestyle and healthy relationship with technology."
    };
  }
  return {
    title: "Excellent",
    message: "Your estimated score is in the highest range. Your reported habits show generally strong patterns associated with a positive estimated score."
  };
}

function renderResult(score) {
  const category = getCategory(score);
  document.querySelector("#scoreCategory").textContent = category.title;
  document.querySelector("#interpretation").textContent = category.message;

  const grid = document.querySelector("#responseGrid");
  const labels = {
    age: "Age",
    gender: "Gender",
    country: "Country",
    academic_level: "Academic Level",
    most_used_platform: "Most Used Platform",
    purpose_of_use: "Purpose of Use",
    avg_daily_usage_hours: "Daily Usage",
    daily_unlocks: "Daily Unlocks",
    study_hours: "Study Hours",
    physical_activity_hours: "Physical Activity",
    sleep_hours_per_night: "Sleep",
    stress_level: "Stress Level"
  };

  grid.innerHTML = Object.entries(labels).map(([key, label]) => {
    let value = state.data[key];
    if (key === "avg_daily_usage_hours" || key === "study_hours" ||
        key === "physical_activity_hours" || key === "sleep_hours_per_night") {
      value = `${Number(value).toFixed(1)} hrs`;
    }
    if (key === "daily_unlocks") value = `${value}`;
    return `<div class="response-item"><span class="label">${label}</span><span class="value">${escapeHtml(String(value))}</span></div>`;
  }).join("");

  showScreen("result");

  const target = score;
  const duration = 1300;
  const start = performance.now();
  const scoreEl = document.querySelector("#scoreValue");

  function animateScore(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    scoreEl.textContent = (target * eased).toFixed(2);
    if (progress < 1) requestAnimationFrame(animateScore);
  }
  requestAnimationFrame(animateScore);

  const circumference = 2 * Math.PI * 96;
  const ring = document.querySelector("#scoreRing");
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference;

  requestAnimationFrame(() => {
    setTimeout(() => {
      ring.style.strokeDashoffset = circumference * (1 - score / 10);
      document.querySelector("#scaleMarker").style.left = `${score * 10}%`;
    }, 80);
  });
}

function resetAssessment() {
  state.step = 0;
  state.data = {
    age: null,
    gender: null,
    country: null,
    academic_level: null,
    most_used_platform: null,
    purpose_of_use: null,
    avg_daily_usage_hours: 4.5,
    daily_unlocks: 42,
    study_hours: 6,
    physical_activity_hours: 1.5,
    sleep_hours_per_night: 7.5,
    stress_level: null
  };
  renderQuestion();
  showScreen("assessment");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

document.querySelector("#startBtn").addEventListener("click", resetAssessment);
document.querySelector("#continueBtn").addEventListener("click", next);
document.querySelector("#backBtn").addEventListener("click", previous);
document.querySelector("#againBtn").addEventListener("click", resetAssessment);
document.querySelector("#retryBtn").addEventListener("click", () => submitAssessment());
document.querySelector("#homeBtn").addEventListener("click", () => showScreen("home"));
document.querySelector("#resultHomeBtn").addEventListener("click", () => showScreen("home"));

document.addEventListener("keydown", e => {
  if (!document.querySelector("#assessment").classList.contains("active")) return;

  if (e.key === "Enter") {
    e.preventDefault();
    next();
  }
  if (e.key === "ArrowLeft" && state.step > 0) previous();
  if (e.key === "ArrowRight") next();
});

renderQuestion();
