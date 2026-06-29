pages['exlib'] = {
  render: async () => `
    <div class="page-header">
      <h2 class="page-title">Exercise Library</h2>
      <p class="page-desc">Browse and learn proper form for every exercise.</p>
    </div>

    <div class="card" style="margin-bottom:20px;padding:14px 20px">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:200px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:0 12px;height:38px">
          <i class="fas fa-search" style="color:var(--sub);font-size:13px"></i>
          <input id="exSearch" type="text" placeholder="Search exercises..." style="background:none;border:none;outline:none;color:var(--text);font-size:13px;flex:1;font-family:inherit" oninput="pages.exlib.filter()">
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap" id="exFilters">
          <button class="btn-sm btn-teal" onclick="pages.exlib.setFilter(null, this)">All</button>
          <button class="btn-sm btn-outline" onclick="pages.exlib.setFilter('Strength', this)">💪 Strength</button>
          <button class="btn-sm btn-outline" onclick="pages.exlib.setFilter('Cardio', this)">🏃 Cardio</button>
          <button class="btn-sm btn-outline" onclick="pages.exlib.setFilter('Core', this)">🎯 Core</button>
          <button class="btn-sm btn-outline" onclick="pages.exlib.setFilter('Flexibility', this)">🧘 Flexibility</button>
        </div>
      </div>
    </div>

    <div id="exGrid" class="grid-4">
      <div style="grid-column:span 4;text-align:center;padding:40px;color:var(--sub)"><div class="spinner" style="margin:0 auto 12px"></div>Loading exercises...</div>
    </div>
  `,
  init: async () => {
    const res = await Content.getExercises();
    const grid = document.getElementById('exGrid');
    if (!res.ok) { grid.innerHTML = '<div style="grid-column:span 4;color:var(--red);text-align:center;padding:40px"><i class="fas fa-exclamation-circle" style="font-size:32px;margin-bottom:12px;display:block"></i>Failed to load exercises.</div>'; return; }
    const exercises = res.data.data || [];
    window.loadedExercises = exercises;
    window.exlibFilter = null;
    pages.exlib.render_grid();
  },
  setFilter: (cat, btn) => {
    window.exlibFilter = cat;
    document.querySelectorAll('#exFilters .btn-sm').forEach(b => { b.className = 'btn-sm btn-outline'; });
    btn.className = 'btn-sm btn-teal';
    pages.exlib.render_grid();
  },
  filter: () => { pages.exlib.render_grid(); },
  render_grid: () => {
    const grid = document.getElementById('exGrid');
    const q = (document.getElementById('exSearch')?.value || '').toLowerCase();
    const cat = window.exlibFilter;
    let items = window.loadedExercises || [];
    if (cat) items = items.filter(e => e.category === cat);
    if (q) items = items.filter(e => e.name.toLowerCase().includes(q) || (e.category||'').toLowerCase().includes(q));

    const catColors = { Strength: '#EF4444', Cardio: '#F59E0B', Core: '#1A7AD4', Flexibility: '#9B59B6', Default: '#4DC3E8' };
    const catIcons  = { Strength: 'fa-dumbbell', Cardio: 'fa-person-running', Core: 'fa-bullseye', Flexibility: 'fa-spa', Default: 'fa-play' };

    if (items.length === 0) { grid.innerHTML = '<div style="grid-column:span 4;text-align:center;padding:60px;color:var(--sub)"><i class="fas fa-search" style="font-size:36px;margin-bottom:12px;display:block;opacity:0.4"></i>No exercises match your search.</div>'; return; }

    grid.innerHTML = items.map(ex => {
      const color = catColors[ex.category] || catColors.Default;
      const icon  = catIcons[ex.category]  || catIcons.Default;
      return `
        <div class="exercise-card" onclick="pages.exlib.view(${ex.exercise_id})" style="cursor:pointer">
          <div class="exercise-card-icon" style="background:${color}22;color:${color}"><i class="fas ${icon}"></i></div>
          <h4>${ex.name}</h4>
          <p style="margin-top:4px">${ex.category || 'General'}</p>
          <div style="margin-top:12px">
            <span class="badge" style="background:${color}20;color:${color};font-size:10px"><i class="fas fa-play-circle" style="margin-right:3px"></i>Watch Video</span>
          </div>
        </div>
      `;
    }).join('');
  },
  view: (id) => {
    const ex = window.loadedExercises.find(e => e.exercise_id === id);
    if (!ex) return;
    let embedUrl = ex.youtube_url || '';
    if (embedUrl.includes('watch?v=')) embedUrl = embedUrl.replace('watch?v=', 'embed/');

    const html = `
      <h3 class="modal-title" style="margin-bottom:8px">${ex.name}</h3>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <span class="badge badge-teal">${ex.category || 'General'}</span>
      </div>
      ${embedUrl ? `
      <div style="border-radius:10px;overflow:hidden;margin-bottom:20px;background:#000;aspect-ratio:16/9">
        <iframe width="100%" height="100%" src="${embedUrl}" title="${ex.name}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
      </div>` : ''}
      <div style="font-weight:700;margin-bottom:10px;font-size:14px"><i class="fas fa-list-ol" style="color:var(--teal);margin-right:6px"></i>Instructions</div>
      <div style="background:var(--card2);padding:16px;border-radius:10px;font-size:14px;line-height:1.7;color:var(--text)">
        ${(ex.instructions || 'No instructions provided.').replace(/\n/g, '<br>')}
      </div>
      <div class="modal-actions" style="margin-top:20px">
        <button class="btn-sm btn-outline" onclick="closeModal()">Close</button>
        ${embedUrl ? `<a href="${ex.youtube_url}" target="_blank" class="btn-sm btn-teal" style="text-decoration:none"><i class="fas fa-external-link-alt" style="margin-right:4px"></i>Open on YouTube</a>` : ''}
      </div>
    `;
    openModal(html);
  }
};
