pages['community'] = {
  render: async () => {
    return `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 class="page-title">Community</h2>
          <p class="page-desc">Share progress and get motivated.</p>
        </div>
        <button class="btn-primary btn-sm" onclick="pages.community.openAdd()"><i class="fas fa-edit"></i> Create Post</button>
      </div>

      <div style="max-width:680px;margin:0 auto" id="postFeed">
        <div style="text-align:center;padding:40px;color:var(--sub)">Loading feed...</div>
      </div>
    `;
  },
  init: async () => {
    pages.community.load();
  },
  load: async () => {
    const res = await Community.getPosts();
    const feed = document.getElementById('postFeed');
    if (!res.ok) { feed.innerHTML = '<div class="alert alert-error">Failed to load feed.</div>'; return; }
    
    const posts = res.data.data || [];
    if (posts.length === 0) {
      feed.innerHTML = '<div style="text-align:center;padding:40px;color:var(--sub)">No posts yet. Be the first to share!</div>';
      return;
    }
    
    feed.innerHTML = posts.map(p => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-avatar">${p.display_name[0].toUpperCase()}</div>
          <div class="post-meta">
            <div class="post-author">${p.display_name} <span class="badge" style="background:rgba(255,255,255,0.05);font-size:9px;margin-left:6px">${p.post_type}</span></div>
            <div class="post-time">${formatDate(p.created_at)} at ${formatTime(p.created_at)}</div>
          </div>
        </div>
        <div class="post-content">${p.content}</div>
        <div class="post-actions">
          <button class="post-action" onclick="pages.community.like(${p.post_id})"><i class="fas fa-heart"></i> ${p.likes} Likes</button>
          <button class="post-action"><i class="fas fa-comment"></i> Reply</button>
        </div>
      </div>
    `).join('');
  },
  openAdd: () => {
    const html = `
      <h3 class="modal-title">Create Post</h3>
      <div class="form-group">
        <label>Post Type</label>
        <select id="cp_type" class="input-wrap" style="width:100%">
          <option value="motivation">Motivation</option>
          <option value="progress">Progress Update</option>
          <option value="workout">Workout</option>
          <option value="meal">Meal Idea</option>
        </select>
      </div>
      <div class="form-group">
        <label>What's on your mind?</label>
        <textarea id="cp_text" class="input-wrap" style="width:100%;min-height:120px;padding:12px;font-family:inherit" required></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-sm btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn-sm btn-primary" onclick="pages.community.submitAdd()">Post</button>
      </div>
    `;
    openModal(html);
  },
  submitAdd: async () => {
    const content = document.getElementById('cp_text').value;
    const post_type = document.getElementById('cp_type').value;
    if (!content) return;
    
    await Community.createPost({ content, post_type });
    closeModal();
    pages.community.load();
  },
  like: async (id) => {
    await Community.likePost(id);
    pages.community.load();
  }
};
