document.addEventListener("DOMContentLoaded", () => {
    const bookmarkResources = Array.isArray(window.BOOKMARKS) ? window.BOOKMARKS : [];
    const existingCampusUrls = new Set(
        bookmarkResources.filter(item => item.category === "Campus Hours").map(item => item.url)
    );
    const campusHourGroups = [
        "Admissions and Enrollment",
        "Counseling, Career, and Transfer",
        "Business and Student Services",
        "Library, Tutoring, and Academic Support",
        "Support Programs",
        "Basic Needs and Student Wellness",
        "UNITE Center and Cultural Programs",
        "Student Technology",
        "Educational Centers and Specialized Locations"
    ];
    const campusGroupForIndex = index => {
        if (index < 5) return campusHourGroups[0];
        if (index < 10) return campusHourGroups[1];
        if (index < 14) return campusHourGroups[2];
        if (index < 26) return campusHourGroups[3];
        if (index < 35) return campusHourGroups[4];
        if (index < 38) return campusHourGroups[5];
        if (index < 47) return campusHourGroups[6];
        if (index < 48) return campusHourGroups[7];
        return campusHourGroups[8];
    };
    const additionalCampusHours = (Array.isArray(window.CAMPUS_HOURS) ? window.CAMPUS_HOURS : [])
        .map((entry, index) => [...entry, campusGroupForIndex(index)])
        .filter(([, url]) => !existingCampusUrls.has(url))
        .map(([title, url, campusGroup]) => ({
            title,
            url,
            category: "Campus Hours",
            domain: new URL(url).hostname.replace(/^www\./, ""),
            campusGroup
        }));
    const resources = [...bookmarkResources, ...additionalCampusHours];
    const grid = document.getElementById("resource-grid");
    const categories = document.getElementById("categories");
    const primaryNavigation = document.getElementById("primary-navigation");
    const sidebarTitle = document.getElementById("sidebar-title");
    const search = document.getElementById("resource-search");
    const searchForm = document.getElementById("search-form");
    const clearSearch = document.getElementById("clear-search");
    const title = document.getElementById("section-title");
    const resultCount = document.getElementById("result-count");
    const total = document.getElementById("resource-total");
    const emptyState = document.getElementById("empty-state");
    const resetFilters = document.getElementById("reset-filters");
    const viewToggle = document.getElementById("view-toggle");

    let activeCategory = "Quick Links";
    let query = "";
    const favoriteKey = item => `${item.category}|${item.title}|${item.url || ""}`;
    let favorites;
    try {
        favorites = new Set(JSON.parse(localStorage.getItem("lrc-hub-favorites") || "[]"));
    } catch {
        favorites = new Set();
    }

    const categoryOrder = [
    "Quick Links",
    "Favorites",
    "Main Tutoring Pages",
    "Scheduling & Student Tools",
    "Related LRC Resources",
    "Beacon",
    "Beacon / Student Links",
    "Beacon / SI Leader Forms",
    "Beacon / Worksheet/Timesheet",
    "Beacon / Group Requests Forms",
    "Beacon / Email Templates",
    "Beacon / Hourly Formulas",
    "Beacon / Hiring",
    "Beacon / Rosters/Roster Sheets",
    "General Tutoring",
    "Rooms",
    "Staff Contact Info",
    "ARC Home",
    "ARC Book Store",
    "Campus Hours",
    "HomeBases",
    "Vending Machines",
    "Test"
];

    const categoryGroups = {
    "Quick Links": "Essentials",
    "Favorites": "Essentials",
    "Main Tutoring Pages": "Tutoring",
    "Scheduling & Student Tools": "Tutoring",
    "Related LRC Resources": "Tutoring",
    "Beacon": "Beacon Program",
    "Beacon / Student Links": "Beacon Program",
    "Beacon / SI Leader Forms": "Beacon Program",
    "Beacon / Worksheet/Timesheet": "Beacon Program",
    "Beacon / Group Requests Forms": "Beacon Program",
    "Beacon / Email Templates": "Beacon Program",
    "Beacon / Hourly Formulas": "Beacon Program",
    "Beacon / Hiring": "Beacon Program",
    "General Tutoring": "Administration",
    "Rooms": "Administration",
    "ARC Home": "Campus",
    "ARC Book Store": "Campus",
    "Campus Hours": "Campus",
    "HomeBases": "Campus",
    "Vending Machines": "Campus",
    "Staff Contact Info": "Administration",
    "Beacon / Rosters/Roster Sheets": "Beacon Program",
    "Test": "Test"
};

    const counts = resources.reduce((map, item) => {
        map[item.category] = (map[item.category] || 0) + 1;
        return map;
    }, {});

        const categoryNames = [...categoryOrder];

        Object.keys(counts).forEach(name => {
            if (!categoryNames.includes(name)) {
                categoryNames.push(name);
            }
        });

    const escapeHtml = value => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const icon = path => `<svg class="link-type-icon" aria-hidden="true" viewBox="0 0 24 24">${path}</svg>`;
    const linkIcon = item => {
        const url = item.url || "";
        if (item.domain === "drive.google.com") return icon('<path d="M3 7.5h7l2 2h9v10H3z"/><path d="M3 7.5v-3h7l2 3"/>');
        if (item.domain === "docs.google.com" && url.includes("/spreadsheets/")) return icon('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h8M12 8v8"/>');
        if (item.domain === "docs.google.com" && url.includes("/forms/")) return icon('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>');
        if (item.domain === "docs.google.com") return icon('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>');
        if (item.domain === "calendar.google.com") return icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2"/>');
        if (item.domain.includes("zoom.us")) return icon('<rect x="3" y="7" width="12" height="10" rx="2"/><path d="m15 10 6-3v10l-6-3"/>');
        if (item.domain.includes("penjiapp.com")) return icon('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>');
        if (!item.url) return icon('<path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/>');
        return icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>');
    };

    const groupOrder = [
    "Essentials",
    "Tutoring",
    "Beacon Program",
    "Administration",
    "Campus",
    "Test",
    "Other"
];
    const groupLabels = {
    "Tutoring": "General Tutoring",
    "Beacon Program": "Beacon"
};
    let activeGroup = categoryGroups[activeCategory] || "Essentials";

    function buildCategories() {
        buildPrimaryNavigation();
        const entries = categoryNames
            .filter(name => (categoryGroups[name] || "Other") === activeGroup)
            .map(name => [name, name === "Favorites" ? favorites.size : (counts[name] || 0)]);
        sidebarTitle.textContent = groupLabels[activeGroup] || activeGroup;
        categories.innerHTML = entries.map(([name, count]) => {
            const isBeaconSubcategory = name.startsWith("Beacon / ");
            const label = name === "Beacon / SI Leader Forms"
                ? "Beacon SI Leader Forms"
                : isBeaconSubcategory ? name.replace("Beacon / ", "") : name;
            return `<button class="category-button${name === activeCategory ? " active" : ""}${isBeaconSubcategory ? " subcategory-button" : ""}" type="button" data-category="${escapeHtml(name)}">
                <span>${escapeHtml(label)}</span>
                <span class="category-count">${count}</span>
            </button>
        `}).join("");

        categories.querySelectorAll(".category-button").forEach(button => {
            button.addEventListener("click", () => {
                activeCategory = button.dataset.category;
                activeGroup = categoryGroups[activeCategory] || "Other";
                query = "";
                search.value = "";
                buildCategories();
                render();
            });
        });
        document.dispatchEvent(new CustomEvent("hub:categories-rendered"));
    }

    function buildPrimaryNavigation() {
        const availableGroups = groupOrder.filter(group => categoryNames.some(name => (categoryGroups[name] || "Other") === group));
        const primaryButtons = availableGroups.map(group => `
            <button class="primary-nav-button${group === activeGroup ? " active" : ""}" type="button" data-group="${escapeHtml(group)}" aria-pressed="${group === activeGroup}">
                ${escapeHtml(groupLabels[group] || group)}
            </button>
        `);
        primaryButtons.splice(1, 0, `
            <button class="primary-nav-button my-links-open" id="my-links-open" type="button">
                My Links <span class="primary-nav-count" id="my-links-count">0</span>
            </button>`);
        primaryNavigation.innerHTML = primaryButtons.join("");

primaryNavigation
    .querySelectorAll(".primary-nav-button:not(.my-links-open)")
    .forEach(button => {
        button.addEventListener("click", () => {
            activeGroup = button.dataset.group;

            activeCategory =
                categoryNames.find(
                    name =>
                        (categoryGroups[name] || "Other") === activeGroup &&
                        !name.includes(" / ")
                ) || activeCategory;

            query = "";
            search.value = "";

            document.dispatchEvent(
                new CustomEvent("hub:show-directory")
            );

            buildCategories();
            render();
        });
    });
}

    function filteredResources() {
        const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
        return resources.filter(item => {
            const categoryMatch = Boolean(query)
                || (activeCategory === "Favorites" ? favorites.has(favoriteKey(item)) : item.category === activeCategory);
            const haystack = `${item.title} ${item.domain} ${item.category}`.toLocaleLowerCase();
            return categoryMatch && terms.every(term => haystack.includes(term));
        });
    }

    function render() {
        const filtered = filteredResources();
        title.textContent = query
            ? `Results for “${query}”`
            : activeCategory;
        resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "resource" : "resources"}`;
        searchForm.classList.toggle("has-value", Boolean(query));
        emptyState.hidden = filtered.length !== 0;
        grid.hidden = filtered.length === 0;

const cardMarkup = item => {

    // ----------------------------------------------
    // CONTACT
    // ----------------------------------------------

    if (item.type === "contact") {

        return `
            <article class="contact-card">

                <div class="contact-info">

                    <h3>
                        ${escapeHtml(item.title)}
                    </h3>

                    ${item.phone ? `
                        <p class="contact-phone">
                            ${escapeHtml(item.phone)}
                        </p>
                    ` : ""}

                    ${item.email ? `
                        <p class="contact-email">
                            ${escapeHtml(item.email)}
                        </p>
                    ` : ""}

                </div>

            </article>
        `;
    }


    // ----------------------------------------------
    // NORMAL RESOURCE
    // ----------------------------------------------

    const key =
        favoriteKey(item);

    const isFavorite =
        favorites.has(key);

    const openingTag =
        item.url
            ? `<a class="resource-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.title)}">`
            : `<div class="resource-link">`;

    const closingTag =
        item.url
            ? "</a>"
            : "</div>";

    return `
        <article class="resource-card${item.url ? "" : " information-card"}">

            ${openingTag}

            <div class="title-row">

                <span class="site-icon" aria-hidden="true">
                    ${linkIcon(item)}
                </span>

                <h3>
                    ${escapeHtml(item.title)}
                </h3>

            </div>

            ${query ? `
                <span class="card-category">
                    ${escapeHtml(item.category)}
                </span>
            ` : ""}

            ${item.description ? `
                <p>
                    ${escapeHtml(item.description)}
                </p>
            ` : ""}

            ${closingTag}

            <button
                class="favorite-button${isFavorite ? " is-favorite" : ""}"
                type="button"
                data-favorite-key="${escapeHtml(key)}"
                aria-label="${isFavorite ? "Remove from" : "Add to"} Favorites"
                aria-pressed="${isFavorite}"
            >
                &#9733;
            </button>

        </article>
    `;
};

        const groupedCampusHours = activeCategory === "Campus Hours" && !query;
        grid.classList.toggle("campus-groups", groupedCampusHours);
        if (groupedCampusHours) {
            grid.innerHTML = campusHourGroups.map(group => {
                const groupItems = filtered.filter(item => (item.campusGroup || (
                    item.title === "Counseling and Transfer Hours" ? campusHourGroups[1]
                    : item.title === "Book Store Hours" ? campusHourGroups[2]
                    : campusHourGroups[3]
                )) === group);
                if (!groupItems.length) return "";
                return `<section class="resource-group">
                    <button class="resource-group-toggle" type="button" aria-expanded="false">
                        <span>${escapeHtml(group)}</span>
                        <span class="group-count">${groupItems.length}</span>
                        <span class="group-chevron" aria-hidden="true">&#8964;</span>
                    </button>
                    <div class="resource-group-grid is-collapsed" hidden>${groupItems.map(cardMarkup).join("")}</div>
                </section>`;
            }).join("");
        } else {
            grid.innerHTML = filtered.map(cardMarkup).join("");
        }

        grid.querySelectorAll(".favorite-button").forEach(button => {
            button.addEventListener("click", () => {
                const key = button.dataset.favoriteKey;
                favorites.has(key) ? favorites.delete(key) : favorites.add(key);
                localStorage.setItem("lrc-hub-favorites", JSON.stringify([...favorites]));
                buildCategories();
                render();
            });
        });

        grid.querySelectorAll(".resource-group-toggle").forEach(button => {
            button.addEventListener("click", () => {
                const expanded = button.getAttribute("aria-expanded") === "true";
                button.setAttribute("aria-expanded", String(!expanded));
                button.nextElementSibling.hidden = expanded;
                button.nextElementSibling.classList.toggle("is-collapsed", expanded);
            });
        });
    }

    search.addEventListener("input", event => {
        query = event.target.value.trim();
        render();
    });

    searchForm.addEventListener("submit", event => event.preventDefault());

    clearSearch.addEventListener("click", () => {
        search.value = "";
        query = "";
        search.focus();
        render();
    });

    resetFilters.addEventListener("click", () => {
        activeCategory = "Quick Links";
        activeGroup = "Essentials";
        query = "";
        search.value = "";
        buildCategories();
        render();
    });

    viewToggle.addEventListener("click", () => {
        const compact = grid.classList.toggle("compact");
        viewToggle.setAttribute("aria-pressed", String(compact));
        viewToggle.setAttribute("aria-label", compact ? "Switch to card view" : "Switch to compact view");
        localStorage.setItem("arc-hub-view", compact ? "compact" : "cards");
    });

    document.addEventListener("keydown", event => {
        if (event.key === "/" && document.activeElement !== search) {
            event.preventDefault();
            search.focus();
        }
        if (event.key === "Escape" && document.activeElement === search) {
            search.value = "";
            query = "";
            render();
            search.blur();
        }
    });

    if (localStorage.getItem("arc-hub-view") === "compact") {
        grid.classList.add("compact");
        viewToggle.setAttribute("aria-pressed", "true");
        viewToggle.setAttribute("aria-label", "Switch to card view");
    }

    total.textContent = `${resources.length} saved resources`;
    buildCategories();
    render();
});
