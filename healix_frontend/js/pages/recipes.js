pages['recipes'] = {
  render: async () => `
    <div class="page-header">
      <h2 class="page-title">Recipe Library</h2>
      <p class="page-desc">Healthy, goal-aligned recipes with step-by-step instructions.</p>
    </div>

    <div class="card" style="margin-bottom:20px;padding:14px 20px">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:200px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:0 12px;height:38px">
          <i class="fas fa-search" style="color:var(--sub);font-size:13px"></i>
          <input id="recSearch" type="text" placeholder="Search recipes..." style="background:none;border:none;outline:none;color:var(--text);font-size:13px;flex:1;font-family:inherit" oninput="pages.recipes.filter()">
        </div>
        <div style="display:flex;gap:6px;align-items:center;font-size:13px;color:var(--sub)">
          <i class="fas fa-sort-amount-down"></i>
          <select id="recSort" class="input-wrap" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:6px 10px;color:var(--text);font-size:13px;font-family:inherit" onchange="pages.recipes.filter()">
            <option value="default">Default</option>
            <option value="cal_asc">Calories ↑</option>
            <option value="cal_desc">Calories ↓</option>
            <option value="time_asc">Prep Time ↑</option>
          </select>
        </div>
      </div>
    </div>

    <div id="recipesGrid" class="grid-4">
      <div style="grid-column:span 4;text-align:center;padding:40px;color:var(--sub)"><div class="spinner" style="margin:0 auto 12px"></div>Loading recipes...</div>
    </div>
  `,
  init: async () => {
    const res = await Content.getRecipes();
    const grid = document.getElementById('recipesGrid');
    if (!res.ok) { grid.innerHTML = '<div style="grid-column:span 4;color:var(--red);text-align:center;padding:40px"><i class="fas fa-exclamation-circle" style="font-size:32px;margin-bottom:12px;display:block"></i>Failed to load recipes.</div>'; return; }
    window.loadedRecipes = res.data.data || [];
    pages.recipes.filter();
  },
  filter: () => {
    const grid = document.getElementById('recipesGrid');
    const q    = (document.getElementById('recSearch')?.value || '').toLowerCase();
    const sort = document.getElementById('recSort')?.value || 'default';
    let items  = [...(window.loadedRecipes || [])];
    if (q) items = items.filter(r => r.name.toLowerCase().includes(q));
    if (sort === 'cal_asc')  items.sort((a,b) => a.calories - b.calories);
    if (sort === 'cal_desc') items.sort((a,b) => b.calories - a.calories);
    if (sort === 'time_asc') items.sort((a,b) => a.prep_time_min - b.prep_time_min);

    if (items.length === 0) {
      grid.innerHTML = '<div style="grid-column:span 4;text-align:center;padding:60px;color:var(--sub)"><i class="fas fa-search" style="font-size:36px;margin-bottom:12px;display:block;opacity:0.4"></i>No recipes match your search.</div>';
      return;
    }

    const emojis = ['🥗','🍲','🥙','🍱','🥘','🫕','🥩','🍛','🥦','🍜'];
    grid.innerHTML = items.map((r, idx) => `
      <div class="recipe-card" onclick="pages.recipes.view(${r.recipe_id})" style="cursor:pointer">
        <div class="recipe-img" style="position:relative;overflow:hidden;">
          ${r.thumbnail_url
            ? `<img src="${r.thumbnail_url}" alt="${r.name}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:52px;background:linear-gradient(135deg,rgba(26,122,212,0.15),rgba(77,195,232,0.08));position:absolute;top:0;left:0">${emojis[idx % emojis.length]}</div>`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:52px;background:linear-gradient(135deg,rgba(26,122,212,0.15),rgba(77,195,232,0.08))">${emojis[idx % emojis.length]}</div>`
          }
        </div>
        <div class="recipe-info">
          <h4>${r.name}</h4>
          <div class="recipe-meta" style="margin-top:6px">
            <span style="color:var(--orange)"><i class="fas fa-fire" style="margin-right:3px"></i>${r.calories || '?'} kcal</span>
            <span>•</span>
            <span style="color:var(--teal)"><i class="fas fa-clock" style="margin-right:3px"></i>${r.prep_time_min || '?'}m</span>
          </div>
        </div>
      </div>
    `).join('');
  },
  view: (id) => {
    const recipe = window.loadedRecipes.find(r => r.recipe_id === id);
    if (!recipe) return;
    const steps = (recipe.instructions || '').split(/\d+\.\s+/).filter(s => s.trim()).map(s => s.trim());

    // Build embed URL: if already an embed URL use as-is, else extract video ID
    const getYouTubeEmbedUrl = (url) => {
      if (!url) return null;
      if (url.includes('youtube.com/embed')) return url;
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
      return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
    };
    const embedUrl = getYouTubeEmbedUrl(recipe.video_url);

    const modalBox = document.getElementById('modalBox');
    if (modalBox) {
      modalBox.style.maxWidth = embedUrl ? '640px' : '440px';
    }

    const html = `
      <h3 class="modal-title" style="margin-bottom:8px">${recipe.name}</h3>
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <span class="badge badge-orange"><i class="fas fa-fire" style="margin-right:3px"></i>${recipe.calories || '?'} kcal</span>
        <span class="badge badge-teal"><i class="fas fa-clock" style="margin-right:3px"></i>${recipe.prep_time_min || '?'} mins</span>
      </div>
      ${embedUrl ? `
      <div style="margin-bottom:20px;border-radius:12px;overflow:hidden;position:relative;padding-bottom:56.25%;height:0;">
        <iframe
          src="${embedUrl}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;"
          allowfullscreen
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
        </iframe>
      </div>
      ` : recipe.thumbnail_url ? `
      <div style="margin-bottom:20px;border-radius:12px;overflow:hidden;max-height:220px;">
        <img src="${recipe.thumbnail_url}" alt="${recipe.name}" style="width:100%;height:220px;object-fit:cover;display:block;"
          onerror="this.parentElement.style.display='none'">
      </div>
      ` : ''}
      <div style="font-weight:700;margin-bottom:12px;font-size:14px"><i class="fas fa-list-ol" style="color:var(--teal);margin-right:6px"></i>Instructions</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${steps.length > 0 ? steps.map((s, i) => `
          <div style="display:flex;gap:12px;background:var(--card2);padding:14px;border-radius:10px;align-items:flex-start">
            <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--navy-light));color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${i+1}</div>
            <div style="font-size:14px;line-height:1.6;padding-top:2px">${s}</div>
          </div>
        `).join('') : `<div style="background:var(--card2);padding:16px;border-radius:10px;font-size:14px;line-height:1.7">${recipe.instructions || 'No instructions provided.'}</div>`}
      </div>
      <div class="modal-actions" style="margin-top:20px">
        <button class="btn-sm btn-outline" onclick="closeModal()">Close</button>
      </div>
    `;
    openModal(html);
  }
};
