// ===============================
// 🌤️ Pro Weather - Full Script
// ===============================
const API_KEY = "1115e21768ba165948eef900e607e2c4";
const ENDPOINT_NOW = "https://api.openweathermap.org/data/2.5/weather";
const ENDPOINT_FORE = "https://api.openweathermap.org/data/2.5/forecast";
const ENDPOINT_AIR = "https://api.openweathermap.org/data/2.5/air_pollution";

// DOM ELEMENTS
const bg = document.getElementById("bg");
const sun = document.getElementById("sun");
const moon = document.getElementById("moon");
const nowCard = document.querySelector(".now-card");

const dateTimeEl = document.getElementById("dateTime");
const cityNameEl = document.getElementById("cityName");
const nowIconEl = document.getElementById("nowIcon");
const nowTempEl = document.getElementById("nowTemp");
const nowDescEl = document.getElementById("nowDesc");
const feelsLikeEl = document.getElementById("feelsLike");
const precipEl = document.getElementById("precip");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");

const hourlyWrap = document.getElementById("hourlyWrap");
const dailyWrap = document.getElementById("dailyWrap");

const aqiBadge = document.getElementById("aqiBadge");
const aqiIndexEl = document.getElementById("aqiIndex");

const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const cityInput = document.getElementById("cityInput");
const historyList = document.getElementById("historyList");
const loader = document.getElementById("loader");
const themeSwitch = document.getElementById("themeSwitch");

// ===============
// Helper Functions
// ===============
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}
function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = saved || (prefersLight ? "light" : "dark");
  setTheme(theme);
  themeSwitch.checked = theme === "light";
}
themeSwitch.addEventListener("change", () => setTheme(themeSwitch.checked ? "light" : "dark"));

function fmtTime(ts, shift = 0) {
  return new Date((ts + shift) * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
setInterval(() => (dateTimeEl.textContent = new Date().toLocaleString()), 1000);

function showLoader(on) {
  loader.classList.toggle("hidden", !on);
}
function saveHistory(city) {
  let arr = JSON.parse(localStorage.getItem("cities") || "[]");
  if (!arr.includes(city)) {
    arr.unshift(city);
    arr = arr.slice(0, 8);
    localStorage.setItem("cities", JSON.stringify(arr));
  }
  renderHistory();
}
function renderHistory() {
  const arr = JSON.parse(localStorage.getItem("cities") || "[]");
  historyList.innerHTML = arr.map((c) => `<option value="${c}"></option>`).join("");
}
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// ===================
// Background Handling
// ===================
function setBgByTime(isDay) {
  bg.className = "bg " + (isDay ? "day" : "night");
  nowCard.classList.remove("day", "night");
  nowCard.classList.add(isDay ? "day" : "night");
  sun.style.display = isDay ? "block" : "none";
  moon.style.display = isDay ? "none" : "block";
}

// ===================
// Load Weather by City
// ===================
async function loadCity(city) {
  if (!city) return;
  showLoader(true);
  try {
    const now = await getJSON(`${ENDPOINT_NOW}?q=${city}&appid=${API_KEY}&units=metric`);
    const fore = await getJSON(`${ENDPOINT_FORE}?q=${city}&appid=${API_KEY}&units=metric`);
    const air = await getJSON(`${ENDPOINT_AIR}?lat=${now.coord.lat}&lon=${now.coord.lon}&appid=${API_KEY}`);
    renderNow(now, fore);
    renderAQI(air);
    renderHourly(fore);
    renderDaily(fore);
    saveHistory(now.name);
  } catch (err) {
    alert("❌ City not found or network error.");
    console.error(err);
  } finally {
    showLoader(false);
  }
}

// ===================
// Render Current Weather
// ===================
function renderNow(now, fore) {
  const { name, weather, main, wind, sys, timezone } = now;
  const icon = weather[0].icon;
  const desc = weather[0].description;
  const isDay = icon.includes("d");

  cityNameEl.textContent = name;
  nowIconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  nowTempEl.textContent = `${Math.round(main.temp)}°C`;
  nowDescEl.textContent = desc.toUpperCase();
  feelsLikeEl.textContent = `${Math.round(main.feels_like)}°C`;
  humidityEl.textContent = `${main.humidity}%`;
  windEl.textContent = `${wind.speed} m/s`;
  pressureEl.textContent = `${main.pressure} hPa`;
  sunriseEl.textContent = fmtTime(sys.sunrise, timezone);
  sunsetEl.textContent = fmtTime(sys.sunset, timezone);
  precipEl.textContent = `${Math.round((fore.list[0]?.pop || 0) * 100)}%`;

  setBgByTime(isDay);
}

// ===================
// Render AQI
// ===================
function renderAQI(air) {
  const aqi = air.list[0].main.aqi;
  aqiIndexEl.textContent = aqi;
  const labels = ["—", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
  aqiBadge.textContent = labels[aqi];
  aqiBadge.className = `aqi aqi-${aqi}`;
}

// ===================
// Render Hourly Forecast
// ===================
function renderHourly(fore) {
  const slots = fore.list.slice(0, 4);
  hourlyWrap.innerHTML = slots
    .map((s) => {
      const time = new Date(s.dt * 1000).toLocaleTimeString([], { hour: "2-digit" });
      const icon = s.weather[0].icon;
      const temp = Math.round(s.main.temp);
      const pop = Math.round((s.pop || 0) * 100);
      return `
        <div class="hour-card">
          <div class="muted">${time}</div>
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
          <div class="t">${temp}°C</div>
          <small class="muted">💧 ${pop}%</small>
        </div>`;
    })
    .join("");
}

// ===================
// Render 5-Day Forecast
// ===================
function renderDaily(fore) {
  const byDay = {};
  fore.list.forEach((item) => {
    const dateKey = new Date(item.dt * 1000).toISOString().split("T")[0];
    if (!byDay[dateKey]) byDay[dateKey] = [];
    byDay[dateKey].push(item);
  });

  const days = Object.keys(byDay)
    .slice(0, 5)
    .map((k) => {
      const arr = byDay[k];
      let best = arr[0],
        diff = 99;
      arr.forEach((it) => {
        const h = new Date(it.dt * 1000).getHours();
        const d = Math.abs(h - 12);
        if (d < diff) {
          diff = d;
          best = it;
        }
      });
      return best;
    });

  dailyWrap.innerHTML = days
    .map((it) => {
      const d = new Date(it.dt * 1000).toLocaleDateString([], { weekday: "short" });
      const icon = it.weather[0].icon;
      const max = Math.round(it.main.temp_max);
      const min = Math.round(it.main.temp_min);
      return `
        <div class="day-card">
          <div class="day-name">${d}</div>
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
          <div><b>${max}°</b> / ${min}°</div>
        </div>`;
    })
    .join("");
}

// ===================
// Event Listeners
// ===================
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) loadCity(city);
});
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

locBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return alert("Geolocation not supported");
  showLoader(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const now = await getJSON(
          `${ENDPOINT_NOW}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        cityInput.value = now.name;
        await loadCity(now.name);
      } catch (err) {
        alert("Failed to detect location.");
      } finally {
        showLoader(false);
      }
    },
    () => {
      showLoader(false);
      alert("Location permission denied.");
    }
  );
});

// ===================
// Initialization
// ===================
(function init() {
  initTheme();
  renderHistory();
  const last = JSON.parse(localStorage.getItem("cities") || "[]")[0] || "Mumbai";
  cityInput.value = last;
  loadCity(last);
})();
