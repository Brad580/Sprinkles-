const elements = {
  body: document.body,
  searchForm: document.querySelector("#searchForm"),
  cityInput: document.querySelector("#cityInput"),
  locationButton: document.querySelector("#locationButton"),
  unitButtons: [...document.querySelectorAll(".unit-button")],
  status: document.querySelector("#status"),
  dashboard: document.querySelector("#weatherDashboard"),
  welcome: document.querySelector("#welcomeState"),
  locationName: document.querySelector("#locationName"),
  currentDate: document.querySelector("#currentDate"),
  updatedTime: document.querySelector("#updatedTime"),
  currentIcon: document.querySelector("#currentIcon"),
  currentTemperature: document.querySelector("#currentTemperature"),
  currentCondition: document.querySelector("#currentCondition"),
  feelsLike: document.querySelector("#feelsLike"),
  todayHigh: document.querySelector("#todayHigh"),
  todayLow: document.querySelector("#todayLow"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#windSpeed"),
  precipitation: document.querySelector("#precipitation"),
  sunset: document.querySelector("#sunset"),
  timezoneLabel: document.querySelector("#timezoneLabel"),
  hourlyForecast: document.querySelector("#hourlyForecast"),
  dailyForecast: document.querySelector("#dailyForecast"),
};

const WEATHER_CODES = {
  0: ["Clear sky", "☀", "clear"],
  1: ["Mostly clear", "☀", "clear"],
  2: ["Partly cloudy", "◒", "cloudy"],
  3: ["Overcast", "☁", "cloudy"],
  45: ["Foggy", "≋", "fog"],
  48: ["Rime fog", "≋", "fog"],
  51: ["Light drizzle", "☂", "rain"],
  53: ["Drizzle", "☂", "rain"],
  55: ["Heavy drizzle", "☂", "rain"],
  56: ["Freezing drizzle", "☂", "snow"],
  57: ["Freezing drizzle", "☂", "snow"],
  61: ["Light rain", "☂", "rain"],
  63: ["Rain", "☂", "rain"],
  65: ["Heavy rain", "☂", "rain"],
  66: ["Freezing rain", "☂", "snow"],
  67: ["Freezing rain", "☂", "snow"],
  71: ["Light snow", "✣", "snow"],
  73: ["Snow", "✣", "snow"],
  75: ["Heavy snow", "✣", "snow"],
  77: ["Snow grains", "✣", "snow"],
  80: ["Light showers", "☂", "rain"],
  81: ["Showers", "☂", "rain"],
  82: ["Heavy showers", "☂", "rain"],
  85: ["Snow showers", "✣", "snow"],
  86: ["Heavy snow showers", "✣", "snow"],
  95: ["Thunderstorm", "ϟ", "storm"],
  96: ["Storm with hail", "ϟ", "storm"],
  99: ["Storm with heavy hail", "ϟ", "storm"],
};

const state = {
  unit: localStorage.getItem("sprinkles-unit") || "fahrenheit",
  location: null,
  weather: null,
};

function weatherDetails(code) {
  const [label, icon, theme] = WEATHER_CODES[code] || ["Mixed conditions", "◌", "cloudy"];
  return { label, icon, theme };
}

function setStatus(message = "", type = "") {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`.trim();
}

function setLoading(isLoading, message = "Gathering the forecast…") {
  elements.searchForm.classList.toggle("is-loading", isLoading);
  elements.locationButton.disabled = isLoading;
  elements.cityInput.disabled = isLoading;
  elements.searchForm.querySelector("button").disabled = isLoading;
  setStatus(isLoading ? message : "");
}

function showError(message) {
  setStatus(message, "is-error");
}

function formatTemperature(value) {
  return `${Math.round(value)}°`;
}

function localDate(value) {
  return new Date(value.includes("T") ? `${value}Z` : `${value}T12:00:00Z`);
}

function formatHour(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    timeZone: "UTC",
  }).format(localDate(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(localDate(value));
}

function formatDate(value, options) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options,
  }).format(localDate(value));
}

function unitParams() {
  return state.unit === "fahrenheit"
    ? {
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",
        precipitation_unit: "inch",
      }
    : {
        temperature_unit: "celsius",
        wind_speed_unit: "kmh",
        precipitation_unit: "mm",
      };
}

async function geocodeCity(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json",
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error("We couldn’t search for that place. Please try again.");

  const data = await response.json();
  if (!data.results?.length) {
    throw new Error(`We couldn’t find “${query}”. Check the spelling and try again.`);
  }

  const result = data.results[0];
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name: result.name,
    area: result.admin1,
    country: result.country,
  };
}

async function reverseGeocode(latitude, longitude) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    count: "1",
    language: "en",
    format: "json",
  });

  try {
    const response = await fetch(url);
    const data = await response.json();
    const result = data.results?.[0];
    if (result) {
      return {
        latitude,
        longitude,
        name: result.name,
        area: result.admin1,
        country: result.country,
      };
    }
  } catch {
    // The forecast can still load when reverse geocoding is unavailable.
  }

  return { latitude, longitude, name: "Your location", area: "", country: "" };
}

async function fetchWeather(location) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
    ...unitParams(),
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error("The forecast service is unavailable right now.");
  return response.json();
}

async function loadLocation(location) {
  setLoading(true);
  try {
    state.location = location;
    state.weather = await fetchWeather(location);
    renderWeather();
    elements.welcome.hidden = true;
    elements.dashboard.hidden = false;
    setStatus("");
  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

function renderCurrent() {
  const { current, daily, timezone_abbreviation: abbreviation } = state.weather;
  const details = weatherDetails(current.weather_code);
  const placeParts = [state.location.name];
  if (state.location.area && state.location.area !== state.location.name) {
    placeParts.push(state.location.area);
  }
  if (state.location.country) placeParts.push(state.location.country);

  elements.body.dataset.weather = details.theme;
  elements.locationName.textContent = placeParts.join(", ");
  elements.currentDate.textContent = formatDate(current.time, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  elements.updatedTime.textContent = `Updated ${formatTime(current.time)}`;
  elements.currentIcon.textContent = details.icon;
  elements.currentTemperature.textContent = formatTemperature(current.temperature_2m);
  elements.currentCondition.textContent = details.label;
  elements.feelsLike.textContent = `Feels like ${formatTemperature(current.apparent_temperature)}`;
  elements.todayHigh.textContent = formatTemperature(daily.temperature_2m_max[0]);
  elements.todayLow.textContent = formatTemperature(daily.temperature_2m_min[0]);
  elements.humidity.textContent = `${current.relative_humidity_2m}%`;
  elements.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} ${
    state.unit === "fahrenheit" ? "mph" : "km/h"
  }`;
  elements.precipitation.textContent = `${daily.precipitation_probability_max[0] ?? 0}%`;
  elements.sunset.textContent = formatTime(daily.sunset[0]);
  elements.timezoneLabel.textContent = abbreviation || "Local time";
}

function renderHourly() {
  const { hourly, current } = state.weather;
  let startIndex = hourly.time.findIndex((time) => time >= current.time);
  if (startIndex < 0) startIndex = 0;

  elements.hourlyForecast.innerHTML = hourly.time
    .slice(startIndex, startIndex + 9)
    .map((time, index) => {
      const dataIndex = startIndex + index;
      const details = weatherDetails(hourly.weather_code[dataIndex]);
      return `
        <article class="hour-card ${index === 0 ? "is-current" : ""}">
          <time datetime="${time}">${index === 0 ? "Now" : formatHour(time)}</time>
          <span class="hour-icon" aria-label="${details.label}" role="img">${details.icon}</span>
          <strong>${formatTemperature(hourly.temperature_2m[dataIndex])}</strong>
          <span class="rain-chance">${hourly.precipitation_probability[dataIndex] ?? 0}% rain</span>
        </article>`;
    })
    .join("");
}

function renderDaily() {
  const { daily } = state.weather;
  elements.dailyForecast.innerHTML = daily.time
    .map((date, index) => {
      const details = weatherDetails(daily.weather_code[index]);
      const dayLabel = index === 0 ? "Today" : formatDate(date, { weekday: "long" });
      return `
        <article class="day-row">
          <time datetime="${date}">${dayLabel}</time>
          <div class="day-condition"><span aria-hidden="true">${details.icon}</span><span>${details.label}</span></div>
          <span class="day-rain">☂ ${daily.precipitation_probability_max[index] ?? 0}%</span>
          <div class="day-temperatures">
            <strong>${formatTemperature(daily.temperature_2m_max[index])}</strong>
            <span>${formatTemperature(daily.temperature_2m_min[index])}</span>
          </div>
        </article>`;
    })
    .join("");
}

function renderWeather() {
  renderCurrent();
  renderHourly();
  renderDaily();
}

async function handleSearch(event) {
  event.preventDefault();
  const query = elements.cityInput.value.trim();
  if (!query) return;

  setLoading(true, `Finding ${query}…`);
  try {
    const location = await geocodeCity(query);
    elements.cityInput.value = "";
    await loadLocation(location);
  } catch (error) {
    showError(error.message || "We couldn’t load that forecast.");
    setLoading(false);
  }
}

function handleLocationRequest() {
  if (!navigator.geolocation) {
    showError("Location services aren’t supported by this browser.");
    return;
  }

  setLoading(true, "Finding your location…");
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const location = await reverseGeocode(coords.latitude, coords.longitude);
      await loadLocation(location);
    },
    () => {
      setLoading(false);
      showError("We couldn’t access your location. Search for a city instead.");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

async function changeUnit(unit) {
  if (unit === state.unit) return;
  state.unit = unit;
  localStorage.setItem("sprinkles-unit", unit);
  elements.unitButtons.forEach((button) => {
    const isActive = button.dataset.unit === unit;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  if (state.location) await loadLocation(state.location);
}

elements.searchForm.addEventListener("submit", handleSearch);
elements.locationButton.addEventListener("click", handleLocationRequest);
elements.unitButtons.forEach((button) => {
  button.addEventListener("click", () => changeUnit(button.dataset.unit));
  button.setAttribute("aria-pressed", String(button.dataset.unit === state.unit));
  button.classList.toggle("is-active", button.dataset.unit === state.unit);
});

loadLocation({
  latitude: 40.7128,
  longitude: -74.006,
  name: "New York",
  area: "New York",
  country: "United States",
});
