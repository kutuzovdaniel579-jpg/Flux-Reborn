const siteList = document.querySelector("#supported-sites");
const siteSearch = document.querySelector("#site-search");
const siteSearchStatus = document.querySelector("#site-search-status");
const year = document.querySelector("#year");

const siteCategories = {
  zolaria: "Community & Social",
  reddit: "Community & Social",
  instagram: "Community & Social",
  facebook: "Community & Social",
  discord: "Community & Social",
  x: "Community & Social",
  pinterest: "Community & Social",
  google: "Search & Reference",
  wikipedia: "Search & Reference",
  youtube: "Video & Streaming",
  tiktok: "Video & Streaming",
  netflix: "Video & Streaming",
  twitch: "Video & Streaming",
  roblox: "Gaming",
  steam: "Gaming",
  spotify: "Music & Audio",
  amazon: "Shopping",
  ebay: "Shopping",
  logitech: "Technology & Hardware",
  apple: "Technology & Hardware",
  microsoft: "Technology & Hardware",
  canva: "Design & Creativity",
  csb: "Development & Tools",
  github: "Development & Tools"
};

const categoryOrder = [
  "Community & Social",
  "Search & Reference",
  "Video & Streaming",
  "Music & Audio",
  "Gaming",
  "Shopping",
  "Technology & Hardware",
  "Design & Creativity",
  "Development & Tools",
  "Other"
];

if (year) {
  year.textContent = new Date().getFullYear();
}

fetch("../../database.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Could not load the site directory.");
    }
    return response.json();
  })
  .then((database) => {
    siteList.replaceChildren();
    const groups = new Map();

    for (const [key, item] of Object.entries(database)) {
      let url;
      try {
        url = new URL(item.url);
      } catch {
        continue;
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;

      const category = siteCategories[key.toLowerCase()] || "Other";
      if (!groups.has(category)) groups.set(category, []);

      const card = document.createElement("article");
      card.className = "result-card";
      card.dataset.searchText = `${key} ${item.title || ""} ${item.desc || ""} ${url.hostname}`.toLowerCase();

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

      card.append(link, description, address);
      groups.get(category).push(card);
    }

    for (const category of categoryOrder) {
      const cards = groups.get(category);
      if (!cards || cards.length === 0) continue;

      const group = document.createElement("section");
      group.className = "site-category";

      const heading = document.createElement("h2");
      heading.className = "site-category-title";
      heading.textContent = category;

      const categorySites = document.createElement("div");
      categorySites.className = "site-category-sites";
      categorySites.append(...cards);
      group.append(heading, categorySites);
      siteList.append(group);
    }

    if (siteSearch) {
      siteSearch.addEventListener("input", () => {
        const query = siteSearch.value.trim().toLowerCase();
        const terms = query.split(/\s+/).filter(Boolean);
        const matches = [];

        for (const card of siteList.querySelectorAll(".result-card")) {
          const isMatch = !query || terms.every((term) => card.dataset.searchText.includes(term));
          card.hidden = !isMatch;
          if (isMatch && query) matches.push(card);
        }

        for (const group of siteList.querySelectorAll(".site-category")) {
          group.hidden = !group.querySelector(".result-card:not([hidden])");
        }

        if (siteSearchStatus) {
          if (!query) {
            siteSearchStatus.textContent = "Type a website name to check if it’s supported.";
          } else if (matches.length) {
            const names = matches.map((card) => card.querySelector(".result-title").textContent);
            siteSearchStatus.textContent = `Supported: ${names.join(", ")}.`;
          } else {
            siteSearchStatus.textContent = `“${siteSearch.value.trim()}” isn’t currently supported.`;
          }
        }
      });
    }

    if (!siteList.hasChildNodes()) {
      siteList.textContent = "No supported sites are available right now.";
    }
  })
  .catch(() => {
    siteList.textContent = "The site directory could not be loaded.";
  });
