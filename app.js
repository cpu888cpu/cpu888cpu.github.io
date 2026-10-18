/* =========================================================
   个人主页 · 配置区
   —— 只改下面这几行，网站内容会自动从 GitHub 同步
   ========================================================= */

const CONFIG = {
  // 【必填】你的 GitHub 用户名
  githubUser: "cpu888cpu",

  // 可选：最多显示多少个仓库
  maxRepos: 9,

  // 可选：不显示的仓库名（例如 dotfiles、测试仓库）
  excludeRepos: [],

  // 可选：额外链接，留空则自动隐藏
  blogUrl: "",
  email: "",

  // 可选：自定义「关于」段落；留空则使用 GitHub 上的个人简介
  aboutText: ""
};

/* =========================================================
   以下不用改
   ========================================================= */

const $ = (id) => document.getElementById(id);
const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", "C#": "#178600", Go: "#00ADD8",
  Rust: "#dea584", Shell: "#89e051", Kotlin: "#A97BFF", Swift: "#F05138",
  PHP: "#4F5D95", Ruby: "#701516", Dart: "#00B4AB", Lua: "#000080"
};

let allRepos = [];
let activeLang = "全部";

const nf = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));

async function gh(path) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}
async function init() {
  $("year").textContent = new Date().getFullYear();

  // 刷新时回到顶部（带锚点访问则保留锚点）
  if (!location.hash) window.scrollTo(0, 0);


  const user = (CONFIG.githubUser || "").trim();

  if (!user || user === "your-username") {
    showConfigHint();
    return;
  }

  document.title = `${user} · 个人主页`;
  $("footer-name").textContent = user;
  $("link-github").href = `https://github.com/${user}`;

  if (CONFIG.blogUrl) {
    $("link-blog").href = CONFIG.blogUrl;
  } else {
    $("link-blog").remove();
  }

  if (CONFIG.email) {
    $("link-mail").href = `mailto:${CONFIG.email}`;
  } else {
    $("link-mail").remove();
  }

  try {
    const [profile, repos] = await Promise.all([
      gh(`users/${user}`),
      gh(`users/${user}/repos?per_page=100&sort=updated`)
    ]);

    renderProfile(profile);
    renderRepos(repos);
  } catch (err) {
    showError(err);
  }
}

function renderProfile(p) {
  $("avatar").src = p.avatar_url;
  $("avatar").alt = `${p.login} 的头像`;
  $("name").textContent = p.name || p.login;
  $("login").textContent = "@" + p.login;
  $("bio").textContent = p.bio || "";
  if (!p.bio) $("bio").remove();

  $("stat-repos").textContent = p.public_repos ?? "–";
  $("stat-followers").textContent = nf(p.followers ?? 0);
  $("stat-stars").textContent = "…";

  const blogEl = document.getElementById("link-blog");
  if (blogEl && p.blog) {
    blogEl.href = p.blog.startsWith("http") ? p.blog : "https://" + p.blog;
  }

  if (CONFIG.aboutText) {
    $("about-text").textContent = CONFIG.aboutText;
  } else if (p.bio) {
    $("about-text").textContent = p.bio;
  } else {
    $("about-text").textContent =
      "这里还空着。去 GitHub 个人资料里填一句 bio，或者改 app.js 里的 aboutText，这句话就会被替换掉。";
  }
}

function renderRepos(repos) {
  const list = repos
    .filter((r) => !r.fork && !r.archived)
    .filter((r) => !CONFIG.excludeRepos.includes(r.name))
    .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at));

  allRepos = list;

  const totalStars = list.reduce((s, r) => s + r.stargazers_count, 0);
  $("stat-stars").textContent = nf(totalStars);

  // 需要额外请求时补齐 star 数据（fork 的也计入总量就够，不再多请求）
  renderFilters(list);
  renderGrid(list);
  renderLangs(list);

  if (!list.length) {
    $("repo-grid").innerHTML = `<div class="card"><p class="card-desc">这个账号还没有公开仓库。</p></div>`;
  }
}

function renderFilters(list) {
  const langs = [...new Set(list.map((r) => r.language).filter(Boolean))]
    .slice(0, 8);
  if (langs.length < 2) return;

  const box = $("filters");
  box.innerHTML = "";

  const chips = ["全部", ...langs];

  chips.forEach((lang) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.lang = lang;
    b.textContent = lang;
    b.onclick = () => {
      activeLang = lang;
      syncActiveChip();
      renderGrid(allRepos);
    };
    box.appendChild(b);
  });

  syncActiveChip();

  function syncActiveChip() {
    [...box.children].forEach((c) => {
      c.classList.toggle("active", c.dataset.lang === activeLang);
    });
  }
}

function renderGrid(list) {
  const shown = list
    .filter((r) => activeLang === "全部" || r.language === activeLang)
    .slice(0, CONFIG.maxRepos);

  const grid = $("repo-grid");
  grid.innerHTML = "";

  if (!shown.length) {
    grid.innerHTML = `<div class="card"><p class="card-desc">这个语言下暂时没有公开仓库。</p></div>`;
    return;
  }

  shown.forEach((r) => {
    const a = document.createElement("a");
    a.className = "card";
    a.href = r.html_url;
    a.target = "_blank";
    a.rel = "noopener";

    const color = LANG_COLORS[r.language] || "#8b96ab";
    const desc = r.description ? escapeHtml(r.description) : "暂无简介";
    const updated = new Date(r.pushed_at).toLocaleDateString("zh-CN");

    a.innerHTML = `
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(r.name)}</h3>
        <span class="card-meta">★ ${r.stargazers_count}</span>
      </div>
      <p class="card-desc">${desc}</p>
      <div class="card-foot">
        ${r.language ? `<span><i class="dot" style="background:${color}"></i>${escapeHtml(r.language)}</span>` : ""}
        <span>${updated} 更新</span>
      </div>
    `;
    grid.appendChild(a);
  });

  const shownCount = list.filter((r) => activeLang === "全部" || r.language === activeLang).length;
  $("repo-note").textContent =
    shownCount > shown.length
      ? `共 ${shownCount} 个仓库，显示前 ${shown.length} 个（可在 app.js 的 maxRepos 调整）`
      : "";
}

function renderLangs(list) {
  const count = {};
  list.forEach((r) => {
    if (r.language) count[r.language] = (count[r.language] || 0) + 1;
  });

  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const box = $("langs");
  box.innerHTML = "";
  top.forEach(([lang, n]) => {
    const span = document.createElement("span");
    span.className = "lang";
    span.innerHTML = `<i class="dot" style="background:${LANG_COLORS[lang] || "#8b96ab"}"></i><b>${escapeHtml(lang)}</b> ${n}`;
    box.appendChild(span);
  });
}

function showConfigHint() {
  $("name").textContent = "还没配置呢";
  $("login").textContent = "";
  $("bio").textContent = "打开 app.js，把 CONFIG.githubUser 换成你的 GitHub 用户名，刷新一下就好。";
  $("stats").style.display = "none";
  $("repo-grid").innerHTML =
    `<div class="card"><p class="card-desc">配置完成后，这里会自动列出你的公开仓库。</p></div>`;
  $("link-github").href = "#";
}

function showError(err) {
  console.error(err);
  $("repo-grid").innerHTML =
    `<div class="card"><p class="card-desc">拿不到 GitHub 数据：${escapeHtml(err.message)}。
     可能是用户名写错了，或者触发了 API 频率限制（未登录每小时 60 次），过一会儿再刷新试试。</p></div>`;
  $("repo-note").textContent = "";
}

const HTML_ESCAPES = {
  "&": "\u0026amp;",
  "<": "\u0026lt;",
  ">": "\u0026gt;",
  '"': "\u0026quot;",
  "'": "\u0026#39;"
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

document.addEventListener("DOMContentLoaded", init);
