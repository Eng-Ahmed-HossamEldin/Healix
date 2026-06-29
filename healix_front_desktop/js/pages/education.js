pages['education'] = {
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Education</h2>
        <p class="page-desc">Learn about nutrition, fitness, and wellness.</p>
      </div>

      <div class="article-card">
        <div class="article-icon" style="background:rgba(26,122,212,0.1);color:#1A7AD4"><i class="fas fa-droplet"></i></div>
        <div class="article-body">
          <h4>The Science of Hydration</h4>
          <p>Why drinking enough water is crucial for your metabolism and energy levels.</p>
          <div class="article-tag">Nutrition</div>
        </div>
      </div>

      <div class="article-card">
        <div class="article-icon" style="background:rgba(155,89,182,0.1);color:#9B59B6"><i class="fas fa-moon"></i></div>
        <div class="article-body">
          <h4>Sleep and Weight Loss</h4>
          <p>Discover the hidden link between sleep deprivation and weight gain.</p>
          <div class="article-tag">Wellness</div>
        </div>
      </div>

      <div class="article-card">
        <div class="article-icon" style="background:rgba(239,68,68,0.1);color:#EF4444"><i class="fas fa-dumbbell"></i></div>
        <div class="article-body">
          <h4>Progressive Overload 101</h4>
          <p>The fundamental principle behind building muscle and getting stronger.</p>
          <div class="article-tag">Fitness</div>
        </div>
      </div>
    `;
  }
};
