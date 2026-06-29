pages['challenges'] = {
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Challenges</h2>
        <p class="page-desc">Push your limits with time-bound goals.</p>
      </div>
      <div id="chalList" class="grid-2">
        <div style="text-align:center;padding:40px;color:var(--sub);grid-column:span 2">Loading challenges...</div>
      </div>
    `;
  },
  init: async () => {
    const res = await Community.getChallenges();
    const box = document.getElementById('chalList');
    if (!res.ok) { box.innerHTML = '<div class="alert alert-error">Error</div>'; return; }
    
    const ch = res.data.data || [];
    if (ch.length === 0) { box.innerHTML = '<div>No active challenges.</div>'; return; }
    
    // We would also get MyChallenges to see if joined
    const myRes = await Community.getMyChallenges();
    const joinedIds = myRes.ok ? (myRes.data.data || []).map(c => c.challenge_id) : [];

    box.innerHTML = ch.map(c => {
      const isJoined = joinedIds.includes(c.challenge_id);
      return `
        <div class="card">
          <div class="card-header" style="margin-bottom:10px">
            <h3 class="card-title">${c.title}</h3>
            <span class="badge badge-orange">${c.challenge_type}</span>
          </div>
          <p style="font-size:13px;color:var(--sub);margin-bottom:16px;line-height:1.5">${c.description}</p>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;color:var(--sub)"><i class="fas fa-users"></i> ${c.participant_count} joined</div>
            ${isJoined 
              ? `<button class="btn-sm" style="background:var(--card2);color:var(--mint);border:1px solid var(--mint)" disabled>Joined</button>`
              : `<button class="btn-sm btn-outline" onclick="pages.challenges.join(${c.challenge_id})">Join Challenge</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  },
  join: async (id) => {
    await Community.joinChallenge(id);
    toast('Challenge joined!', 'success');
    pages.challenges.init();
  }
};
