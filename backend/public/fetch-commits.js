// Client-side script to fetch all commits from GitHub and populate the table
(function () {
  const COMMITS_URL = 'https://api.github.com/repos/s-pl/RobEurope/commits';

  async function fetchPage(page = 1, perPage = 100) {
    const url = `${COMMITS_URL}?per_page=${perPage}&page=${page}`;
    const resp = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!resp.ok) throw new Error(`GitHub API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    return { data, link: resp.headers.get('link') };
  }

  function parseLinkHeader(header) {
    if (!header) return {};
    const parts = header.split(',');
    const links = {};
    parts.forEach((p) => {
      const section = p.split(';');
      if (section.length !== 2) return;
      const url = section[0].replace(/<(.*)>/, '$1').trim();
      const name = section[1].replace(/rel=\"(.*)\"/, '$1').trim();
      links[name] = url;
    });
    return links;
  }

  function formatDate(datestr) {
    try {
      const d = new Date(datestr);
      return d.toLocaleString('es-ES', { timeZone: 'UTC' }) + ' UTC';
    } catch (e) {
      return datestr;
    }
  }

  function createRow(commit) {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e1e4e8';
    tr.style.verticalAlign = 'middle';
    tr.innerHTML = `
      <td style="padding:8px 12px;display:flex;align-items:center;gap:0.5em;">
        <img src="${(commit.author && commit.author.avatar_url) || 'https://avatars.githubusercontent.com/u/0?v=4'}" alt="author" style="width:28px;height:28px;border-radius:50%;vertical-align:middle;">
        <a href="${(commit.author && commit.author.html_url) || '#'}" style="color:#0366d6;text-decoration:none;font-weight:500;">${(commit.commit && commit.commit.author && commit.commit.author.name) || (commit.author && commit.author.login) || 'Unknown'}</a>
      </td>
      <td style="padding:8px 12px;">${formatDate(commit.commit.author.date)}</td>
      <td style="padding:8px 12px;">${escapeHtml(commit.commit.message).replace(/\n/g, '<br>')}</td>
      <td style="padding:8px 12px;"><code style="background:#eaeaea;padding:2px 6px;border-radius:4px;">${commit.sha}</code></td>
      <td style="padding:8px 12px;"><a href="${commit.html_url}" style="color:#0366d6;text-decoration:none;">Ver commit</a></td>
    `;
    return tr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function fetchAllAndRender(statusEl, tbodyEl, perPage = 100) {
    statusEl.textContent = 'Fetching commits...';
    tbodyEl.innerHTML = '';
    let page = 1;
    let allCommits = [];
    try {
      while (true) {
        statusEl.textContent = `Fetching page ${page}...`;
        const { data, link } = await fetchPage(page, perPage);
        if (!data || data.length === 0) break;
        allCommits = allCommits.concat(data);
        data.forEach((commit) => tbodyEl.appendChild(createRow(commit)));
        const links = parseLinkHeader(link);
        if (!links.next) break;
        page += 1;
      }
      statusEl.textContent = `Fetched ${allCommits.length} commits.`;
      return allCommits;
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
      console.error(err);
      return [];
    }
  }

  function setup() {
    const btn = document.getElementById('load-commits-btn');
    const statusEl = document.getElementById('commits-status');
    const tbodyEl = document.getElementById('commits-tbody');
    if (!btn || !statusEl || !tbodyEl) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await fetchAllAndRender(statusEl, tbodyEl);
      btn.disabled = false;
    });
    // Auto-load all commits on page load (can be commented out if you prefer manual load)
    (async () => {
      btn.disabled = true;
      await fetchAllAndRender(statusEl, tbodyEl);
      btn.disabled = false;
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

/*
  Notes:
  - This script follows pagination by checking the Link header.
  - It appends rows to existing table body with id "commits-tbody".
  - It uses per_page=100 to minimize requests. If the repo has many commits, this will paginate automatically.
*/
