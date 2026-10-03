const preferenceKeys = {
  engine: "flux-search-engine",
  theme: "flux-theme",
  gradientStart: "flux-gradient-start",
  gradientEnd: "flux-gradient-end",
  backgroundImage: "flux-background-image",
  reduceMotion: "flux-reduce-motion"
};

function readPreference(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep the current page usable if browser storage is unavailable.
  }
}

function applyPreferences() {
  const theme = readPreference(preferenceKeys.theme, "dark");
  const validTheme = ["dark", "light", "custom"].includes(theme) ? theme : "dark";
  document.body.dataset.theme = validTheme === "light" ? "light" : "dark";
  document.body.classList.toggle("custom-theme", validTheme === "custom");
  document.body.classList.toggle("reduce-motion", readPreference(preferenceKeys.reduceMotion, "false") === "true");

  if (theme === "custom") {
    const start = readPreference(preferenceKeys.gradientStart, "#5957df");
    const end = readPreference(preferenceKeys.gradientEnd, "#141626");
    const image = readPreference(preferenceKeys.backgroundImage, "");
    let background = `linear-gradient(135deg, ${start}, ${end})`;
    if (image) {
      try {
        const imageUrl = new URL(image);
        if (imageUrl.protocol === "https:" || imageUrl.protocol === "http:") {
          background = `linear-gradient(rgba(15, 17, 30, 0.35), rgba(15, 17, 30, 0.55)), url("${imageUrl.href.replaceAll('"', "%22")}") center / cover fixed`;
        }
      } catch {
        // Fall back to the selected gradient when the saved image URL is invalid.
      }
    }
    document.body.style.background = background;
  } else {
    document.body.style.removeProperty("background");
  }
}

applyPreferences();

const preferencesYear = document.querySelector("#year");
if (preferencesYear) preferencesYear.textContent = new Date().getFullYear();

const engineControl = document.querySelector("#preferred-engine");
const themeControl = document.querySelector("#preferred-theme");
const gradientStartControl = document.querySelector("#gradient-start");
const gradientEndControl = document.querySelector("#gradient-end");
const backgroundImageControl = document.querySelector("#background-image");
const customOptions = document.querySelector("#custom-background-options");
const reduceMotionControl = document.querySelector("#reduce-motion");
const settingsStatus = document.querySelector("#settings-status");

if (engineControl && themeControl) {
  engineControl.value = readPreference(preferenceKeys.engine, "flux");
  themeControl.value = readPreference(preferenceKeys.theme, "dark");
  gradientStartControl.value = readPreference(preferenceKeys.gradientStart, "#5957df");
  gradientEndControl.value = readPreference(preferenceKeys.gradientEnd, "#141626");
  backgroundImageControl.value = readPreference(preferenceKeys.backgroundImage, "");
  reduceMotionControl.checked = readPreference(preferenceKeys.reduceMotion, "false") === "true";

  const updateCustomOptions = () => {
    customOptions.hidden = themeControl.value !== "custom";
  };

  const saveAppearance = () => {
    savePreference(preferenceKeys.theme, themeControl.value);
    savePreference(preferenceKeys.gradientStart, gradientStartControl.value);
    savePreference(preferenceKeys.gradientEnd, gradientEndControl.value);
    savePreference(preferenceKeys.backgroundImage, backgroundImageControl.value.trim());
    applyPreferences();
  };

  engineControl.addEventListener("change", () => {
    savePreference(preferenceKeys.engine, engineControl.value);
    settingsStatus.textContent = "Search engine preference saved.";
  });

  themeControl.addEventListener("change", () => {
    updateCustomOptions();
    saveAppearance();
    settingsStatus.textContent = "Theme preference saved.";
  });

  gradientStartControl.addEventListener("input", saveAppearance);
  gradientEndControl.addEventListener("input", saveAppearance);
  backgroundImageControl.addEventListener("change", () => {
    saveAppearance();
    settingsStatus.textContent = backgroundImageControl.value && !backgroundImageControl.validity.valid
      ? "Enter a valid image URL."
      : "Background preference saved.";
  });

  reduceMotionControl.addEventListener("change", () => {
    savePreference(preferenceKeys.reduceMotion, String(reduceMotionControl.checked));
    applyPreferences();
    settingsStatus.textContent = "Motion preference saved.";
  });

  document.querySelector("#reset-settings").addEventListener("click", () => {
    for (const key of Object.values(preferenceKeys)) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Reset the visible controls even if browser storage is unavailable.
      }
    }
    engineControl.value = "flux";
    themeControl.value = "dark";
    gradientStartControl.value = "#5957df";
    gradientEndControl.value = "#141626";
    backgroundImageControl.value = "";
    reduceMotionControl.checked = false;
    updateCustomOptions();
    applyPreferences();
    settingsStatus.textContent = "Settings reset to their defaults.";
  });

  updateCustomOptions();
}
