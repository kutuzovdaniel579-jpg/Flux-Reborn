const searchInput = document.querySelector("#search-input");
const searchSite = document.querySelector("#search-site");
const searchForm = document.querySelector(".search-form");
const searchResults = document.querySelector("#search-results");
const year = document.querySelector("#year");
const currentPath = window.location.pathname.replace(/\/+$/, "");
const isResultsPage = currentPath.endsWith("/search/index.html") || currentPath.endsWith("/search");

let databasePromise;

if (year) {
  year.textContent = new Date().getFullYear();
}

function loadDatabase() {
  if (!databasePromise) {
    const databasePath = isResultsPage ? "../database.json" : "database.json";
    databasePromise = fetch(databasePath).then((response) => {
      if (!response.ok) {
        throw new Error("Could not load the search database.");
      }
      return response.json();
    });
  }
  return databasePromise;
}

function searchUrlFor(item, query) {
  const siteUrl = new URL(item.url);
  const encodedQuery = encodeURIComponent(query);
  const searchPaths = {
    "youtube.com": `https://www.youtube.com/results?search_query=${encodedQuery}`,
    "tiktok.com": `https://www.tiktok.com/search?q=${encodedQuery}`,
    "reddit.com": `https://www.reddit.com/search/?q=${encodedQuery}`,
    "google.com": `https://www.google.com/search?q=${encodedQuery}`,
    "wikipedia.org": `https://en.wikipedia.org/w/index.php?search=${encodedQuery}`,
    "github.com": `https://github.com/search?q=${encodedQuery}`,
    "amazon.com": `https://www.amazon.com/s?k=${encodedQuery}`,
    "spotify.com": `https://open.spotify.com/search/${encodedQuery}`,
    "pinterest.com": `https://www.pinterest.com/search/pins/?q=${encodedQuery}`,
    "ebay.com": `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}`,
    "twitch.tv": `https://www.twitch.tv/search?term=${encodedQuery}`,
    "roblox.com": `https://www.roblox.com/search/experiences?keyword=${encodedQuery}`
  };
  const domain = siteUrl.hostname.replace(/^www\./, "");
  return searchPaths[domain] || `https://www.google.com/search?q=${encodeURIComponent(`site:${siteUrl.hostname} ${query}`)}`;
}

loadDatabase().then((database) => {
  if (!searchSite) return;
  for (const [key, item] of Object.entries(database)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = item.title || key;
    searchSite.append(option);
  }
  if (isResultsPage) {
    searchSite.value = new URLSearchParams(window.location.search).get("site") || "";
  }
}).catch(() => {});

function showMessage(message) {
  searchResults.replaceChildren();
  searchResults.textContent = message;
  searchResults.hidden = false;
}

async function displayResults(query) {
  if (!query) {
    showMessage("Enter a search term to find sites in the Flux directory.");
    return;
  }

  showMessage("Searching…");

  try {
    const database = await loadDatabase();
    const selectedSite = searchSite?.value;
    if (selectedSite) {
      const entry = Object.entries(database).find(([key]) => key.toLowerCase() === selectedSite.toLowerCase());
      if (!entry) {
        showMessage("That site is not in the Flux directory.");
        return;
      }

      const [key, item] = entry;
      const siteUrl = new URL(item.url);
      if (siteUrl.protocol !== "https:" && siteUrl.protocol !== "http:") {
        showMessage("This site does not have a valid search destination.");
        return;
      }

      const result = document.createElement("article");
      result.className = "result-card";
      const link = document.createElement("a");
      link.className = "result-title";
      link.href = searchUrlFor(item, query);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `Search ${item.title || key} for “${query}”`;
      const description = document.createElement("p");
      description.className = "result-description";
      description.textContent = `Open this search on ${item.title || key}.`;
      const address = document.createElement("p");
      address.className = "result-url";
      address.textContent = siteUrl.hostname;
      result.append(link, description, address);
      searchResults.replaceChildren(result);
      searchResults.hidden = false;
      return;
    }

    const terms = query.toLowerCase().split(/\s+/);
    const matches = Object.entries(database).filter(([key, item]) => {
      const aliases = Array.isArray(item.aliases) ? item.aliases.join(" ") : "";
      const searchableText = `${key} ${item.title || ""} ${item.desc || ""} ${item.url || ""} ${aliases}`.toLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });

    searchResults.replaceChildren();
    for (const [key, item] of matches) {
      let url;
      try {
        url = new URL(item.url);
      } catch {
        continue;
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;

      const result = document.createElement("article");
      result.className = "result-card";

      const link = document.createElement("a");
      link.className = "result-title";
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.title || key;

      const description = document.createElement("p");
      description.className = "result-description";
      description.textContent = item.desc || "";

      const address = document.createElement("p");
      address.className = "result-url";
      address.textContent = url.hostname;

      result.append(link, description, address);
      searchResults.append(result);
    }

    if (!searchResults.hasChildNodes()) {
      showMessage(matches.length ? "No valid results found in the database." : "No matches found. Try another search.");
    } else {
      searchResults.hidden = false;
    }
  } catch {
    showMessage("The search database could not be loaded.");
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    return;
  }

  const selectedSite = searchSite?.value;
  let engine = "flux";
  try {
    engine = localStorage.getItem("flux-search-engine") || "flux";
  } catch {
    // Use Flux search when browser storage is unavailable.
  }
  if (!selectedSite && engine === "google") {
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return;
  }
  if (!selectedSite && engine === "duckduckgo") {
    window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    return;
  }

  const destination = isResultsPage
    ? new URL(window.location.href)
    : new URL("search/index.html", window.location.href);
  destination.searchParams.set("q", query);
  if (searchSite?.value) {
    destination.searchParams.set("site", searchSite.value);
  } else {
    destination.searchParams.delete("site");
  }
  window.location.href = destination.href;
});

if (isResultsPage) {
  const parameters = new URLSearchParams(window.location.search);
  const query = parameters.get("q") || "";
  searchInput.value = query;
  displayResults(query);
}
