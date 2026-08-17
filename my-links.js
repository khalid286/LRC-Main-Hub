document.addEventListener("DOMContentLoaded", () => {
    const storageKey = "lrc-hub-my-links-v1";
    const directory = document.querySelector(".directory");
    const panel = document.getElementById("my-links-panel");
    const groups = document.getElementById("my-links-groups");
    const emptyState = document.getElementById("my-links-empty");
    const fileInput = document.getElementById("bookmark-file");
    const importButton = document.getElementById("import-bookmarks");
    const addButton = document.getElementById("add-my-link");
    const exportButton = document.getElementById("export-my-links");
    const clearButton = document.getElementById("clear-my-links");
    const editor = document.getElementById("my-link-editor");
    const idInput = document.getElementById("my-link-id");
    const titleInput = document.getElementById("my-link-title");
    const urlInput = document.getElementById("my-link-url");
    const folderInput = document.getElementById("my-link-folder");
    const cancelButton = document.getElementById("cancel-my-link");
    const error = document.getElementById("my-link-error");
    const notice = document.getElementById("my-links-notice");

    let links = loadLinks();

    function loadLinks() {
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
            return Array.isArray(stored) ? stored.filter(isValidRecord) : [];
        } catch {
            return [];
        }
    }

    function isSafeUrl(value) {
        try {
            const parsed = new URL(value);
            return parsed.protocol === "https:" || parsed.protocol === "http:";
        } catch {
            return false;
        }
    }

    function isValidRecord(item) {
        return item && typeof item.id === "string" && typeof item.title === "string"
            && typeof item.url === "string" && isSafeUrl(item.url);
    }

    function saveLinks() {
        localStorage.setItem(storageKey, JSON.stringify(links));
        render();
    }

    function makeId() {
        return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function folderName(value) {
        return String(value || "General").trim() || "General";
    }

    function render() {
        updateNav();
        emptyState.hidden = links.length !== 0;
        groups.hidden = links.length === 0;

        const grouped = links.reduce((map, link) => {
            const folder = folderName(link.folder);
            if (!map.has(folder)) map.set(folder, []);
            map.get(folder).push(link);
            return map;
        }, new Map());

        groups.innerHTML = [...grouped.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([folder, folderLinks]) => `
                <section class="my-link-group">
                    <div class="my-link-group-heading">
                        <h2>${escapeHtml(folder)}</h2>
                        <span>${folderLinks.length}</span>
                    </div>
                    <div class="my-link-list">
                        ${folderLinks.sort((a, b) => a.title.localeCompare(b.title)).map(link => `
                            <article class="my-link-row">
                                <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                                    <span class="my-link-symbol" aria-hidden="true">↗</span>
                                    <span>${escapeHtml(link.title)}</span>
                                </a>
                                <div class="my-link-row-actions">
                                    <button type="button" data-edit="${escapeHtml(link.id)}">Edit</button>
                                    <button type="button" data-delete="${escapeHtml(link.id)}" class="delete-link">Delete</button>
                                </div>
                            </article>
                        `).join("")}
                    </div>
                </section>
            `).join("");

        groups.querySelectorAll("[data-edit]").forEach(button => {
            button.addEventListener("click", () => openEditor(links.find(link => link.id === button.dataset.edit)));
        });
        groups.querySelectorAll("[data-delete]").forEach(button => {
            button.addEventListener("click", () => {
                const link = links.find(item => item.id === button.dataset.delete);
                if (!link || !confirm(`Delete “${link.title}”?`)) return;
                links = links.filter(item => item.id !== link.id);
                saveLinks();
            });
        });
    }

    function updateNav() {
        const button = document.getElementById("my-links-open");
        const count = document.getElementById("my-links-count");
        if (count) count.textContent = links.length;
        if (button) button.classList.toggle("active", !panel.hidden);
    }

    function showPanel() {
        directory.hidden = true;
        panel.hidden = false;
        document.body.classList.add("my-links-mode");
        render();
    }

    function hidePanel() {
        panel.hidden = true;
        directory.hidden = false;
        document.body.classList.remove("my-links-mode");
        updateNav();
        closeEditor();
    }

    function openEditor(link) {
        idInput.value = link?.id || "";
        titleInput.value = link?.title || "";
        urlInput.value = link?.url || "";
        folderInput.value = link?.folder || "General";
        error.textContent = "";
        editor.hidden = false;
        titleInput.focus();
    }

    function closeEditor() {
        editor.reset();
        idInput.value = "";
        error.textContent = "";
        editor.hidden = true;
    }

    function parseBookmarkFile(html) {
        const documentNode = new DOMParser().parseFromString(html, "text/html");
        const imported = [];
        const seenAnchors = new Set();

        function addAnchor(anchor, folder) {
            if (!anchor || seenAnchors.has(anchor)) return;
            seenAnchors.add(anchor);
            const url = anchor.getAttribute("href") || "";
            if (!isSafeUrl(url)) return;
            imported.push({ id: makeId(), title: anchor.textContent.trim() || url, url, folder: folderName(folder) });
        }

        function walk(element, path = []) {
            const children = [...element.children];
            for (let index = 0; index < children.length; index += 1) {
                const child = children[index];
                if (child.tagName === "DT") {
                    const heading = child.querySelector(":scope > H3");
                    const anchor = child.querySelector(":scope > A");
                    const nested = child.querySelector(":scope > DL")
                        || (children[index + 1]?.tagName === "DL" ? children[index + 1] : null);
                    if (anchor) addAnchor(anchor, path.at(-1));
                    if (nested) {
                        walk(nested, heading ? [...path, heading.textContent.trim()] : path);
                        if (nested === children[index + 1]) index += 1;
                    }
                } else if (child.tagName === "DL" || child.tagName === "P") {
                    walk(child, path);
                }
            }
        }

        const root = documentNode.querySelector("dl");
        if (root) walk(root);
        documentNode.querySelectorAll("a[href]").forEach(anchor => addAnchor(anchor, "Imported"));
        return imported;
    }

    document.getElementById("categories").addEventListener("click", event => {
        if (event.target.closest(".my-links-open")) showPanel();
        else if (event.target.closest(".category-button")) hidePanel();
    });
    document.addEventListener("hub:categories-rendered", updateNav);
    importButton.addEventListener("click", () => fileInput.click());
    addButton.addEventListener("click", () => openEditor());
    cancelButton.addEventListener("click", closeEditor);

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        try {
            const imported = parseBookmarkFile(await file.text());
            const existingUrls = new Set(links.map(link => link.url));
            const newLinks = imported.filter(link => {
                if (existingUrls.has(link.url)) return false;
                existingUrls.add(link.url);
                return true;
            });
            links.push(...newLinks);
            saveLinks();
            notice.textContent = `Imported ${newLinks.length} new link${newLinks.length === 1 ? "" : "s"}.`;
        } catch {
            notice.textContent = "That bookmark file could not be imported.";
        } finally {
            fileInput.value = "";
        }
    });

    editor.addEventListener("submit", event => {
        event.preventDefault();
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        if (!title || !isSafeUrl(url)) {
            error.textContent = "Enter a name and a valid http:// or https:// URL.";
            return;
        }
        const record = { id: idInput.value || makeId(), title, url, folder: folderName(folderInput.value) };
        const existingIndex = links.findIndex(link => link.id === record.id);
        if (existingIndex >= 0) links[existingIndex] = record;
        else links.push(record);
        closeEditor();
        saveLinks();
    });

    exportButton.addEventListener("click", () => {
        if (!links.length) {
            notice.textContent = "There are no My Links to export yet.";
            return;
        }
        const grouped = links.reduce((map, link) => {
            const folder = folderName(link.folder);
            if (!map.has(folder)) map.set(folder, []);
            map.get(folder).push(link);
            return map;
        }, new Map());
        const body = [...grouped.entries()].map(([folder, folderLinks]) =>
            `<DT><H3>${escapeHtml(folder)}</H3><DL><p>${folderLinks.map(link => `<DT><A HREF="${escapeHtml(link.url)}">${escapeHtml(link.title)}</A>`).join("\n")}</DL><p>`
        ).join("\n");
        const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1><META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8"><TITLE>My Links</TITLE><H1>My Links</H1><DL><p>${body}</DL><p>`;
        const download = document.createElement("a");
        download.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
        download.download = "lrc-my-links-bookmarks.html";
        download.click();
        URL.revokeObjectURL(download.href);
    });

    clearButton.addEventListener("click", () => {
        if (!links.length) {
            notice.textContent = "There are no My Links to clear.";
            return;
        }
        const confirmation = prompt("Type DELETE to permanently remove all My Links. This will not affect Favorites or browser history.");
        if (confirmation !== "DELETE") {
            notice.textContent = "Clear All was canceled.";
            return;
        }
        links = [];
        localStorage.removeItem(storageKey);
        closeEditor();
        render();
        notice.textContent = "All My Links were removed. Favorites and browser history were not changed.";
    });

    render();
});
