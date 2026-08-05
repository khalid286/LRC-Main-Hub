document.addEventListener("DOMContentLoaded", () => {
    const resources = Array.isArray(window.BOOKMARKS) ? window.BOOKMARKS : [];
    const grid = document.getElementById("resource-grid");
    const categories = document.getElementById("categories");
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

    const categoryOrder = [
        "Quick Links", "Main Tutoring Pages", "Scheduling & Student Tools",
        "Forms", "Related LRC Resources", "Beacon",
        "Beacon / Main Pages", "Beacon / Student Links", "Beacon / SI Leader Forms",
        "Beacon / Worksheet/Timesheet", "Beacon / Group Requests Forms",
        "Beacon / Email Templates", "Beacon / Hrly Formulas",
        "Beacon / Hiring", "Meetings", "G/E", "Rooms", "ARC Home", "ARC Book Store",
        "Campus Hours", "HomeBases", "Vending Machines"
    ];

    const categoryGroups = {
        "Quick Links": "Essentials",
        "Main Tutoring Pages": "Tutoring",
        "Scheduling & Student Tools": "Tutoring",
        "Forms": "Tutoring",
        "Related LRC Resources": "Tutoring",
        "Beacon": "Beacon Program",
        "Beacon / Main Pages": "Beacon Program",
        "Beacon / Student Links": "Beacon Program",
        "Beacon / SI Leader Forms": "Beacon Program",
        "Beacon / Worksheet/Timesheet": "Beacon Program",
        "Beacon / Group Requests Forms": "Beacon Program",
        "Beacon / Email Templates": "Beacon Program",
        "Beacon / Hrly Formulas": "Beacon Program",
        "Beacon / Hiring": "Beacon Program",
        "Meetings": "Administration",
        "G/E": "Administration",
        "Rooms": "Administration",
        "ARC Home": "Campus",
        "ARC Book Store": "Campus",
        "Campus Hours": "Campus",
        "HomeBases": "Campus",
        "Vending Machines": "Campus"
    };

    const counts = resources.reduce((map, item) => {
        map[item.category] = (map[item.category] || 0) + 1;
        return map;
    }, {});

    const categoryNames = categoryOrder.filter(name => counts[name]);
    Object.keys(counts).forEach(name => {
        if (!categoryNames.includes(name)) categoryNames.push(name);
    });

    const escapeHtml = value => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const initials = domain => {
        const base = domain.replace(/^www\./, "").split(".")[0];
        const parts = base.split(/[-_]/).filter(Boolean);
        return (parts.length > 1 ? parts.map(part => part[0]).join("") : base.slice(0, 2)).slice(0, 2);
    };

    const externalIcon = `
        <svg class="external-icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>
        </svg>`;

    function buildCategories() {
        const entries = categoryNames.map(name => [name, counts[name]]);
        let previousGroup = "";
        categories.innerHTML = entries.map(([name, count]) => {
            const group = categoryGroups[name] || "Other";
            const groupHeading = group !== previousGroup
                ? `<p class="category-group-label">${escapeHtml(group)}</p>`
                : "";
            previousGroup = group;
            const isBeaconSubcategory = name.startsWith("Beacon / ");
            const label = isBeaconSubcategory ? name.replace("Beacon / ", "") : name;
            return `${groupHeading}
            <button class="category-button${name === activeCategory ? " active" : ""}${isBeaconSubcategory ? " subcategory-button" : ""}" type="button" data-category="${escapeHtml(name)}">
                <span>${escapeHtml(label)}</span>
                <span>${count}</span>
            </button>
        `}).join("");

        categories.querySelectorAll(".category-button").forEach(button => {
            button.addEventListener("click", () => {
                activeCategory = button.dataset.category;
                buildCategories();
                render();
            });
        });
    }

    function filteredResources() {
        const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
        return resources.filter(item => {
            const categoryMatch = item.category === activeCategory;
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

        grid.innerHTML = filtered.map(item => {
            const openingTag = item.url
                ? `<a class="resource-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.title)}">`
                : `<div class="resource-card information-card">`;
            const closingTag = item.url ? "</a>" : "</div>";
            return `
            ${openingTag}
                <span class="card-top">
                    <span class="site-icon" aria-hidden="true">${escapeHtml(initials(item.domain))}</span>
                    ${item.url ? externalIcon : ""}
                </span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description || item.domain)}</p>
            ${closingTag}
        `}).join("");
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
