const GITHUB_USER = 'Rafaelbrk75';

const grid = document.getElementById('projects-grid');
const filtersEl = document.getElementById('lang-filters');
const statRepos = document.getElementById('stat-repos');
const statLangs = document.getElementById('stat-langs');
const statStars = document.getElementById('stat-stars');

let repos = [];
let activeFilter = 'Todos';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });

function renderStats() {
  const langs = new Set(repos.map(r => r.language).filter(Boolean));
  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  statRepos.textContent = repos.length;
  statLangs.textContent = langs.size;
  statStars.textContent = stars;
}

function renderFilters() {
  const langs = ['Todos', ...new Set(repos.map(r => r.language).filter(Boolean))];
  filtersEl.innerHTML = '';
  langs.forEach(lang => {
    const btn = document.createElement('button');
    btn.textContent = lang;
    btn.className = lang === activeFilter ? 'active' : '';
    btn.addEventListener('click', () => {
      activeFilter = lang;
      renderFilters();
      renderGrid();
    });
    filtersEl.appendChild(btn);
  });
}

function renderGrid() {
  const filtered = activeFilter === 'Todos'
    ? repos
    : repos.filter(r => r.language === activeFilter);

  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-msg">Nenhum repositório nessa categoria.</p>';
    return;
  }

  grid.innerHTML = '';
  filtered.forEach((repo, i) => {
    const card = document.createElement('div');
    card.className = 'project-card' + (i % 3 === 1 ? ' alt' : '');
    card.innerHTML = `
      <div class="pc-top">
        <h3>${repo.name}</h3>
        <span class="pc-date">${dateFmt.format(new Date(repo.pushed_at))}</span>
      </div>
      <p class="pc-desc">${repo.description ? escapeHtml(repo.description) : 'Sem descrição no GitHub.'}</p>
      <div class="pc-bottom">
        <span class="pc-lang">${repo.language || '—'}</span>
        <span class="pc-meta">
          <span>★ ${repo.stargazers_count}</span>
          <span>⑂ ${repo.forks_count}</span>
        </span>
      </div>
      <a class="pc-link" href="${repo.html_url}" target="_blank" rel="noopener" aria-label="Abrir ${repo.name} no GitHub"></a>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error('GitHub API ' + res.status);
    repos = await res.json();
    if (!Array.isArray(repos)) throw new Error('Resposta inesperada da API');
    renderStats();
    renderFilters();
    renderGrid();
  } catch (err) {
    grid.innerHTML = `<p class="error-msg">Não foi possível carregar os repositórios agora. (${err.message})</p>`;
  }
}

loadRepos();
