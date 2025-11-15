#!/usr/bin/env node
// Node quick test script to fetch all commits using GitHub API with pagination
// Usage: node backend/scripts/fetch_commits_node.js

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

async function fetchAll() {
  let page = 1;
  const perPage = 100;
  let all = [];
  while (true) {
    console.log(`Fetching page ${page}...`);
    const { data, link } = await fetchPage(page, perPage);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    const links = parseLinkHeader(link);
    if (!links.next) break;
    page += 1;
  }
  return all;
}

(async () => {
  try {
    const commits = await fetchAll();
    console.log(`Fetched ${commits.length} commits.`);
    commits.slice(0, 5).forEach((c, i) => {
      console.log(`#${i + 1}: ${c.sha} - ${c.commit.author.name} - ${c.commit.author.date} - ${c.commit.message.split('\n')[0]}`);
    });
  } catch (err) {
    console.error('Error fetching commits', err);
    process.exit(1);
  }
})();
