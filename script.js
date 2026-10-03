const searchInput = document.querySelector("#search-input");
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

  if (isResultsPage) {
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    window.location.href = url.href;
  } else {
    const resultsUrl = new URL("search/index.html", window.location.href);
    resultsUrl.searchParams.set("q", query);
    window.location.href = resultsUrl.href;
  }
});

if (isResultsPage) {
  const query = new URLSearchParams(window.location.search).get("q") || "";
  searchInput.value = query;
  displayResults(query);
}
