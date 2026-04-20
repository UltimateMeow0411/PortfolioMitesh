const contactStorageKey = "orangutanContactSubmissions";
const chatbotStorageKey = "orangutanChatbotMessages";
const newsCacheKey = "orangutanLatestNewsCache";

const newsConfig = {
    maxItems: 12,
    sources: {
        liquipediaBgmi: "https://liquipedia.net/bgmi/api.php?action=query&list=recentchanges&rclimit=4&rcprop=title|timestamp|comment|user&format=json&origin=*",
        liquipediaValorant: "https://liquipedia.net/valorant/api.php?action=query&list=recentchanges&rclimit=4&rcprop=title|timestamp|comment|user&format=json&origin=*",
        youtube: "https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=UCUm7FZcnD_4n0S4btbHL1HQ",
        xFeed: "https://api.rss2json.com/v1/api.json?rss_url=https://nitter.net/orangutan_gg/rss",
        instagram: "https://www.instagram.com/api/v1/users/web_profile_info/?username=orangutan.gg",
        instagramProfile: "https://www.instagram.com/orangutan.gg/"
    }
};

const chatbotKnowledge = {
    merch: "The merch page currently features the Orangutan Jersey, Orange Hoodie, Black Hoodie, and Travel Polo with a working live cart in the browser demo.",
    teams: "The teams page highlights the BGMI squad, the Valorant team, and the FIFA team. If you want, we can expand it later with player cards, roles, and achievements.",
    contact: "Visitors can use the contact form or jump straight to Orangutan's Instagram, X, and YouTube links from the contact page.",
    partners: "The partners page currently highlights OPA, Red Bull, Logitech G, and Intel as featured collaborators.",
    news: "The News page now aggregates live updates from Liquipedia, YouTube, and X, and it also attempts to pull Instagram updates when Meta allows the browser request."
};

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        };
        return map[char] || char;
    });
}

function stripHtml(value) {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncateText(value, limit) {
    if (!value) return "";
    return value.length > limit ? value.slice(0, limit - 1).trim() + "..." : value;
}

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    localStorage.setItem("orangutanTheme", document.body.classList.contains("light-mode") ? "light" : "dark");
}

function initializeTheme() {
    const savedTheme = localStorage.getItem("orangutanTheme");
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }
}

function changeQty(id, change) {
    const el = document.getElementById(id);
    if (!el) return;

    let value = parseInt(el.innerText, 10) || 0;
    value += change;

    if (value < 0) value = 0;

    el.innerText = value;
    updateCart();
}

function formatPrice(value) {
    return "Rs. " + value.toLocaleString("en-IN");
}

function updateCart() {
    const prices = {
        jersey: 999,
        hoodieOrange: 1499,
        hoodieBlack: 1599,
        travelPolo: 1199
    };

    let totalItems = 0;
    let totalPrice = 0;

    Object.keys(prices).forEach(function(id) {
        const el = document.getElementById(id);
        if (!el) return;

        const qty = parseInt(el.innerText, 10) || 0;
        totalItems += qty;
        totalPrice += qty * prices[id];
    });

    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    if (cartItems) {
        cartItems.innerText = totalItems;
    }

    if (cartTotal) {
        cartTotal.innerText = formatPrice(totalPrice);
    }
}

function filterProducts(category, button) {
    const products = document.querySelectorAll(".product");
    const buttons = document.querySelectorAll(".filter-chip");

    products.forEach(function(product) {
        const match = category === "all" || product.dataset.category === category;
        product.style.display = match ? "block" : "none";
    });

    buttons.forEach(function(chip) {
        chip.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }
}

function initializeFaq() {
    const faqButtons = document.querySelectorAll(".faq-item");

    faqButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            const panel = button.nextElementSibling;
            const isOpen = panel.classList.contains("open");

            document.querySelectorAll(".faq-panel").forEach(function(item) {
                item.classList.remove("open");
            });

            document.querySelectorAll(".faq-item strong").forEach(function(icon) {
                icon.innerText = "+";
            });

            if (!isOpen) {
                panel.classList.add("open");
                const icon = button.querySelector("strong");
                if (icon) icon.innerText = "-";
            }
        });
    });
}

function readStoredContacts() {
    try {
        return JSON.parse(localStorage.getItem(contactStorageKey)) || [];
    } catch (error) {
        return [];
    }
}

function renderStoredContacts() {
    const container = document.getElementById("savedMessages");
    if (!container) return;

    const entries = readStoredContacts();

    if (!entries.length) {
        container.innerHTML = "<p>No submissions yet.</p>";
        return;
    }

    container.innerHTML = entries.slice(-3).reverse().map(function(entry) {
        return `
            <div class="saved-entry">
                <strong>${escapeHtml(entry.name)}</strong>
                <p>${escapeHtml(entry.subject)}</p>
                <small>${escapeHtml(entry.email)}</small>
            </div>
        `;
    }).join("");
}

function initializeContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    renderStoredContacts();

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message"),
            savedAt: new Date().toISOString()
        };

        const entries = readStoredContacts();
        entries.push(payload);
        localStorage.setItem(contactStorageKey, JSON.stringify(entries));

        const formStatus = document.getElementById("formStatus");
        if (formStatus) {
            formStatus.innerText = "Your message has been saved in this browser demo.";
        }

        form.reset();
        renderStoredContacts();
    });
}

function formatNewsTime(value) {
    if (!value) return "Live update";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
    });
}

function relativeNewsTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.round(hours / 24);
    return days + "d ago";
}

function compareArticles(a, b) {
    const first = new Date(a.publishedAt).getTime() || 0;
    const second = new Date(b.publishedAt).getTime() || 0;
    return second - first;
}

function uniqueArticles(items) {
    const seen = new Set();

    return items.filter(function(item) {
        const key = [item.source, item.title].join("|").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function cacheNewsArticles(articles) {
    localStorage.setItem(newsCacheKey, JSON.stringify(articles.slice(0, 12)));
}

function readCachedNewsArticles() {
    try {
        return JSON.parse(localStorage.getItem(newsCacheKey)) || [];
    } catch (error) {
        return [];
    }
}

function renderNewsArticles(articles) {
    const newsGrid = document.getElementById("newsGrid");
    if (!newsGrid) return;

    if (!articles.length) {
        newsGrid.innerHTML = `
            <div class="card news-card news-card-empty">
                <h3>No live stories yet</h3>
                <p>Try refreshing again in a moment. If the problem continues, one or more external sources may be rate-limiting requests.</p>
            </div>
        `;
        return;
    }

    newsGrid.innerHTML = articles.map(function(article) {
        return `
            <article class="card news-card">
                <div class="news-card-head">
                    <span class="news-card-tag">${escapeHtml(article.category || "Gaming")}</span>
                    <time datetime="${escapeHtml(article.publishedAt || "")}">${escapeHtml(relativeNewsTime(article.publishedAt) || formatNewsTime(article.publishedAt))}</time>
                </div>
                <div>
                    <h3>${escapeHtml(article.title || "Latest gaming update")}</h3>
                    <p>${escapeHtml(truncateText(article.summary || article.description || "Latest community update from the feed.", 220))}</p>
                </div>
                <div class="news-card-footer">
                    <small>${escapeHtml(article.source || "Source pending")}</small>
                    <a class="news-link" href="${escapeHtml(article.url || "#")}" target="_blank" rel="noopener noreferrer">Open story</a>
                </div>
            </article>
        `;
    }).join("");
}

function renderSourceStatuses(statuses) {
    const sourceGrid = document.getElementById("sourceStatusGrid");
    if (!sourceGrid) return;

    sourceGrid.innerHTML = statuses.map(function(status) {
        return `
            <div class="card source-card">
                <div class="source-card-head">
                    <strong>${escapeHtml(status.label)}</strong>
                    <span class="source-state ${escapeHtml(status.state)}">${escapeHtml(status.stateLabel)}</span>
                </div>
                <p>${escapeHtml(status.message)}</p>
            </div>
        `;
    }).join("");
}

function createSourceStatus(label, state, message) {
    const stateLabels = {
        live: "Live",
        warning: "Limited",
        error: "Blocked"
    };

    return {
        label: label,
        state: state,
        stateLabel: stateLabels[state] || "Unknown",
        message: message
    };
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error("Request failed with status " + response.status);
    }

    return response.json();
}

async function fetchLiquipediaNews(url, categoryLabel) {
    const data = await fetchJson(url);
    const changes = data && data.query && Array.isArray(data.query.recentchanges)
        ? data.query.recentchanges
        : [];

    return changes.map(function(change) {
        const detail = change.comment ? " Update: " + change.comment : "";
        return {
            title: change.title,
            category: categoryLabel,
            publishedAt: change.timestamp,
            source: "Liquipedia",
            summary: "Liquipedia edit by " + change.user + "." + detail,
            url: "https://liquipedia.net/" + (categoryLabel === "BGMI" ? "bgmi/" : "valorant/") + encodeURIComponent(change.title).replace(/%2F/g, "/")
        };
    });
}

async function fetchYoutubeNews() {
    const data = await fetchJson(newsConfig.sources.youtube);
    const items = Array.isArray(data.items) ? data.items.slice(0, 4) : [];

    return items.map(function(item) {
        return {
            title: item.title,
            category: "YouTube",
            publishedAt: item.pubDate,
            source: "Orangutan TV",
            summary: stripHtml(item.description) || "Fresh video or short uploaded on Orangutan TV.",
            url: item.link,
            image: item.thumbnail || ""
        };
    });
}

async function fetchXNews() {
    const data = await fetchJson(newsConfig.sources.xFeed);
    const items = Array.isArray(data.items) ? data.items.slice(0, 4) : [];

    return items.map(function(item) {
        return {
            title: stripHtml(item.title),
            category: "X",
            publishedAt: item.pubDate,
            source: "Orangutan on X",
            summary: stripHtml(item.description) || "Latest post from Orangutan on X.",
            url: item.link.replace("nitter.net", "x.com")
        };
    });
}

async function fetchInstagramNews() {
    const data = await fetchJson(newsConfig.sources.instagram, {
        headers: {
            "x-ig-app-id": "936619743392459"
        }
    });

    const mediaEdges = data &&
        data.data &&
        data.data.user &&
        data.data.user.edge_felix_video_timeline &&
        Array.isArray(data.data.user.edge_felix_video_timeline.edges)
            ? data.data.user.edge_felix_video_timeline.edges.slice(0, 3)
            : [];

    return mediaEdges.map(function(edge) {
        const node = edge.node || {};
        return {
            title: node.title || node.accessibility_caption || "Latest Instagram update from Orangutan",
            category: "Instagram",
            publishedAt: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : "",
            source: "Instagram",
            summary: stripHtml(node.accessibility_caption || "Latest reel or post from Orangutan on Instagram."),
            url: "https://www.instagram.com/p/" + (node.shortcode || ""),
            image: node.display_url || ""
        };
    });
}

async function loadNewsFeed() {
    const newsGrid = document.getElementById("newsGrid");
    const newsStatus = document.getElementById("newsStatus");
    const newsMeta = document.getElementById("newsMeta");
    const refreshButton = document.getElementById("refreshNewsButton");

    if (!newsGrid || !newsStatus || !newsMeta) return;

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.innerText = "Refreshing...";
    }

    newsStatus.innerText = "Fetching live gaming updates from Liquipedia, YouTube, X, and Instagram...";
    newsMeta.innerText = "";

    const sourceStatuses = [];
    const collectedArticles = [];

    try {
        const results = await Promise.allSettled([
            fetchLiquipediaNews(newsConfig.sources.liquipediaBgmi, "BGMI"),
            fetchLiquipediaNews(newsConfig.sources.liquipediaValorant, "Valorant"),
            fetchYoutubeNews(),
            fetchXNews(),
            fetchInstagramNews()
        ]);

        results.forEach(function(result, index) {
            if (result.status === "fulfilled") {
                if (Array.isArray(result.value) && result.value.length) {
                    collectedArticles.push.apply(collectedArticles, result.value);
                }
            }

            if (index === 0) {
                sourceStatuses.push(
                    result.status === "fulfilled"
                        ? createSourceStatus("Liquipedia BGMI", "live", "Recent competitive changes are loading directly from Liquipedia.")
                        : createSourceStatus("Liquipedia BGMI", "error", "Liquipedia BGMI did not respond on this refresh.")
                );
            }

            if (index === 1) {
                sourceStatuses.push(
                    result.status === "fulfilled"
                        ? createSourceStatus("Liquipedia Valorant", "live", "Recent Valorant ecosystem edits are flowing in live.")
                        : createSourceStatus("Liquipedia Valorant", "error", "Liquipedia Valorant did not respond on this refresh.")
                );
            }

            if (index === 2) {
                sourceStatuses.push(
                    result.status === "fulfilled"
                        ? createSourceStatus("YouTube", "live", "Latest uploads from Orangutan TV are coming through in real time.")
                        : createSourceStatus("YouTube", "error", "YouTube feed fetch failed on this refresh.")
                );
            }

            if (index === 3) {
                sourceStatuses.push(
                    result.status === "fulfilled"
                        ? createSourceStatus("X", "live", "Latest posts from Orangutan on X are flowing through the live feed.")
                        : createSourceStatus("X", "warning", "The X mirror feed is temporarily unavailable right now.")
                );
            }

            if (index === 4) {
                sourceStatuses.push(
                    result.status === "fulfilled" && result.value.length
                        ? createSourceStatus("Instagram", "live", "Latest Orangutan Instagram media was fetched successfully.")
                        : createSourceStatus("Instagram", "warning", "Instagram may block direct browser access in some environments, so this source can be intermittent.")
                );
            }
        });

        const finalArticles = uniqueArticles(collectedArticles)
            .sort(compareArticles)
            .slice(0, newsConfig.maxItems);

        renderNewsArticles(finalArticles);
        renderSourceStatuses(sourceStatuses);
        cacheNewsArticles(finalArticles);

        if (finalArticles.length) {
            newsStatus.innerText = "Live gaming feed updated successfully.";
            newsMeta.innerText = "Last refresh: " + new Date().toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit"
            });
        } else {
            throw new Error("No live stories were returned.");
        }
    } catch (error) {
        const cachedArticles = readCachedNewsArticles();
        renderNewsArticles(cachedArticles);
        renderSourceStatuses([
            createSourceStatus("Sources", "warning", "Live fetch ran into an issue. Showing the most recent cached stories instead.")
        ]);
        newsStatus.innerText = "Live refresh hit a rate limit or network issue.";
        newsMeta.innerText = cachedArticles.length
            ? "Showing the latest cached stories saved in this browser."
            : "No cached stories are available yet.";
    } finally {
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.innerText = "Refresh Feed";
        }
    }
}

function readStoredChatMessages() {
    try {
        return JSON.parse(localStorage.getItem(chatbotStorageKey)) || [];
    } catch (error) {
        return [];
    }
}

function saveChatMessages(messages) {
    localStorage.setItem(chatbotStorageKey, JSON.stringify(messages.slice(-14)));
}

function renderChatMessages(messages) {
    const container = document.getElementById("chatbotMessages");
    if (!container) return;

    container.innerHTML = messages.map(function(message) {
        return `
            <div class="chatbot-message ${escapeHtml(message.role)}">
                <strong>${message.role === "assistant" ? "Bot Support" : "You"}</strong>
                <p>${escapeHtml(message.text)}</p>
            </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
}

function buildLocalChatReply(message) {
    const normalized = message.toLowerCase();
    const latestNews = readCachedNewsArticles();

    if (normalized.includes("latest") && normalized.includes("news")) {
        if (latestNews.length) {
            return "Here are the freshest stories I have right now: " + latestNews.slice(0, 3).map(function(item) {
                return item.title;
            }).join(" | ");
        }

        return "The live news page can pull from Liquipedia, YouTube, X, and sometimes Instagram. Open the News page and tap Refresh Feed to populate the latest stories.";
    }

    if (normalized.includes("news") || normalized.includes("gaming") || normalized.includes("liquipedia")) {
        return chatbotKnowledge.news;
    }

    if (normalized.includes("shop") || normalized.includes("merch") || normalized.includes("jersey") || normalized.includes("hoodie")) {
        return chatbotKnowledge.merch;
    }

    if (normalized.includes("team") || normalized.includes("roster") || normalized.includes("bgmi") || normalized.includes("valorant")) {
        return chatbotKnowledge.teams;
    }

    if (normalized.includes("partner") || normalized.includes("sponsor")) {
        return chatbotKnowledge.partners;
    }

    if (normalized.includes("contact") || normalized.includes("support") || normalized.includes("email")) {
        return chatbotKnowledge.contact;
    }

    if (normalized.includes("refresh")) {
        return "Use the Refresh Feed button on the News page to fetch the latest stories again. It now re-runs the live fetch instead of staying on fallback content.";
    }

    if (normalized.includes("instagram")) {
        return "Instagram is the trickiest source in a browser-only setup because Meta can block direct feed access. This build still attempts it live, but if Meta blocks the request you will still see the other live sources working.";
    }

    if (normalized.includes("x ") || normalized.includes("twitter")) {
        return "The live X section is powered through a public feed mirror so visitors still get fresh updates without needing an X API key on the site.";
    }

    return "I can help with the latest news feed, merch, teams, partners, or contact details. Try asking things like 'latest news', 'what merch is available', or 'where can I contact Orangutan?'.";
}

async function askChatAssistant(message) {
    return buildLocalChatReply(message);
}

function createChatbotWidget() {
    const widget = document.createElement("div");
    widget.className = "chatbot-widget";
    widget.innerHTML = `
        <section class="chatbot-panel" id="chatbotPanel" hidden>
            <div class="chatbot-header">
                <div>
                    <div class="chatbot-title">Bot Support</div>
                    <p class="chatbot-subtitle">Fast answers for news, merch, teams, and contact help.</p>
                </div>
                <button type="button" class="chatbot-close" id="chatbotClose" aria-label="Close support chat">x</button>
            </div>
            <div class="chatbot-messages" id="chatbotMessages"></div>
            <div class="chatbot-input-row">
                <textarea id="chatbotInput" class="chatbot-input" rows="2" placeholder="Ask about latest news, merch, teams, or support"></textarea>
                <button type="button" class="chatbot-send" id="chatbotSend">Send</button>
            </div>
            <p class="chatbot-disclaimer">This assistant is now tuned to the site and can answer from the latest cached news feed in this browser.</p>
        </section>
        <button type="button" class="chatbot-launcher" id="chatbotLauncher" aria-label="Open bot support chat">
            <svg class="bot-symbol" viewBox="0 0 64 64" aria-hidden="true">
                <rect x="14" y="18" width="36" height="30" rx="12"></rect>
                <circle cx="26" cy="31" r="4"></circle>
                <circle cx="38" cy="31" r="4"></circle>
                <path d="M24 41h16"></path>
                <path d="M32 11v7"></path>
                <path d="M22 18l-5-6"></path>
                <path d="M42 18l5-6"></path>
            </svg>
            <span>Open chat</span>
        </button>
    `;

    document.body.appendChild(widget);

    const panel = document.getElementById("chatbotPanel");
    const launcher = document.getElementById("chatbotLauncher");
    const closeButton = document.getElementById("chatbotClose");
    const input = document.getElementById("chatbotInput");
    const sendButton = document.getElementById("chatbotSend");

    const messages = readStoredChatMessages();
    if (!messages.length) {
        messages.push({
            role: "assistant",
            text: "Hi, I am the Orangutan bot assistant. Ask me about the latest news, merch, teams, partners, or contact options."
        });
        saveChatMessages(messages);
    }

    renderChatMessages(messages);

    function openChat() {
        panel.hidden = false;
        launcher.hidden = true;
        input.focus();
    }

    function closeChat() {
        panel.hidden = true;
        launcher.hidden = false;
    }

    async function submitChatMessage() {
        const value = input.value.trim();
        if (!value) return;

        messages.push({
            role: "user",
            text: value
        });
        renderChatMessages(messages);
        saveChatMessages(messages);
        input.value = "";
        sendButton.disabled = true;

        const reply = await askChatAssistant(value);
        messages.push({
            role: "assistant",
            text: reply
        });
        renderChatMessages(messages);
        saveChatMessages(messages);
        sendButton.disabled = false;
    }

    launcher.addEventListener("click", openChat);
    closeButton.addEventListener("click", closeChat);
    sendButton.addEventListener("click", submitChatMessage);
    input.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submitChatMessage();
        }
    });
}

initializeTheme();
updateCart();
initializeFaq();
initializeContactForm();
createChatbotWidget();
loadNewsFeed();

const refreshNewsButton = document.getElementById("refreshNewsButton");
if (refreshNewsButton) {
    refreshNewsButton.addEventListener("click", loadNewsFeed);
}
