const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "docs", "diagram-pdfs");
fs.mkdirSync(outDir, { recursive: true });

const colors = {
  ink: "#1f2937",
  muted: "#64748b",
  line: "#78909c",
  blue: "#dbeafe",
  blueDark: "#1d4ed8",
  green: "#dcfce7",
  greenDark: "#15803d",
  amber: "#fef3c7",
  amberDark: "#b45309",
  rose: "#ffe4e6",
  roseDark: "#be123c",
  violet: "#ede9fe",
  violetDark: "#6d28d9",
  cyan: "#cffafe",
  cyanDark: "#0e7490",
  gray: "#f8fafc",
  grayDark: "#475569",
  white: "#ffffff",
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(value, maxChars = 28) {
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) lines.push(current);
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      current = "";
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function svgDefs() {
  return `
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${colors.line}" />
    </marker>
    <marker id="arrowDark" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${colors.ink}" />
    </marker>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
  </defs>`;
}

function titleBlock(title, subtitle, width) {
  return `
    <text x="${width / 2}" y="42" text-anchor="middle" class="diagram-title">${esc(title)}</text>
    <text x="${width / 2}" y="72" text-anchor="middle" class="diagram-subtitle">${esc(subtitle)}</text>`;
}

function line(points, label = "", options = {}) {
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const stroke = options.stroke || colors.line;
  const width = options.width || 2;
  const dash = options.dash ? `stroke-dasharray="${options.dash}"` : "";
  const marker = options.arrow ? `marker-end="url(#${options.dark ? "arrowDark" : "arrow"})"` : "";
  const mid = points[Math.floor(points.length / 2)];
  const labelSvg = label
    ? `<text x="${mid[0] + (options.labelDx || 0)}" y="${mid[1] + (options.labelDy || -8)}" class="line-label">${esc(label)}</text>`
    : "";
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ${dash} ${marker}/>${labelSvg}`;
}

function classBox(x, y, w, title, sections, options = {}) {
  const headerH = options.headerH || 32;
  const lineH = options.lineH || 17;
  const pad = 10;
  const titleFill = options.titleFill || colors.blueDark;
  const fill = options.fill || colors.white;
  const sectionHeights = sections.map((section) => Math.max(26, section.lines.length * lineH + 12));
  const h = headerH + sectionHeights.reduce((a, b) => a + b, 0);
  let currentY = y + headerH;
  let svg = `
    <g filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="#cbd5e1" stroke-width="1.4"/>
      <rect x="${x}" y="${y}" width="${w}" height="${headerH}" rx="8" fill="${titleFill}"/>
      <path d="M${x},${y + headerH - 8} H${x + w} V${y + headerH} H${x} Z" fill="${titleFill}"/>
      <text x="${x + w / 2}" y="${y + 22}" text-anchor="middle" class="class-title">${esc(title)}</text>`;

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    if (i > 0 || options.drawFirstSeparator) {
      svg += `<line x1="${x}" y1="${currentY}" x2="${x + w}" y2="${currentY}" stroke="#e2e8f0"/>`;
    }
    let textY = currentY + 17;
    if (section.label) {
      svg += `<text x="${x + pad}" y="${textY}" class="section-label">${esc(section.label)}</text>`;
      textY += 15;
    }
    for (const item of section.lines) {
      svg += `<text x="${x + pad}" y="${textY}" class="class-text">${esc(item)}</text>`;
      textY += lineH;
    }
    currentY += sectionHeights[i];
  }
  svg += `</g>`;
  return { svg, h };
}

function simpleBox(x, y, w, h, title, lines = [], options = {}) {
  const fill = options.fill || colors.white;
  const stroke = options.stroke || "#cbd5e1";
  let svg = `
    <g filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>
      <text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" class="box-title">${esc(title)}</text>`;
  let ty = y + 52;
  for (const item of lines) {
    for (const wrapped of wrapText(item, Math.floor(w / 9))) {
      svg += `<text x="${x + 14}" y="${ty}" class="box-text">${esc(wrapped)}</text>`;
      ty += 17;
    }
  }
  svg += `</g>`;
  return svg;
}

function entityBox(x, y, w, name, fields, options = {}) {
  const lineH = options.lineH || 16;
  const headerH = 30;
  const h = headerH + fields.length * lineH + 18;
  const fill = options.fill || colors.white;
  const headerFill = options.headerFill || colors.greenDark;
  let svg = `
    <g filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fill}" stroke="#cbd5e1"/>
      <rect x="${x}" y="${y}" width="${w}" height="${headerH}" rx="7" fill="${headerFill}"/>
      <path d="M${x},${y + headerH - 7} H${x + w} V${y + headerH} H${x} Z" fill="${headerFill}"/>
      <text x="${x + w / 2}" y="${y + 21}" text-anchor="middle" class="entity-title">${esc(name)}</text>`;
  let ty = y + headerH + 18;
  for (const field of fields) {
    const cls = /\bPK\b/.test(field) ? "entity-key" : /\bFK\b/.test(field) ? "entity-fk" : "entity-text";
    svg += `<text x="${x + 10}" y="${ty}" class="${cls}">${esc(field)}</text>`;
    ty += lineH;
  }
  svg += `</g>`;
  return { svg, h, cx: x + w / 2, cy: y + h / 2, left: x, right: x + w, top: y, bottom: y + h };
}

function actor(x, y, label) {
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="18" fill="${colors.white}" stroke="${colors.ink}" stroke-width="3"/>
      <line x1="${x}" y1="${y + 18}" x2="${x}" y2="${y + 78}" stroke="${colors.ink}" stroke-width="3"/>
      <line x1="${x - 36}" y1="${y + 42}" x2="${x + 36}" y2="${y + 42}" stroke="${colors.ink}" stroke-width="3"/>
      <line x1="${x}" y1="${y + 78}" x2="${x - 32}" y2="${y + 124}" stroke="${colors.ink}" stroke-width="3"/>
      <line x1="${x}" y1="${y + 78}" x2="${x + 32}" y2="${y + 124}" stroke="${colors.ink}" stroke-width="3"/>
      <text x="${x}" y="${y + 156}" text-anchor="middle" class="actor-label">${esc(label)}</text>
    </g>`;
}

function useCase(x, y, w, h, label, options = {}) {
  let text = "";
  const lines = wrapText(label, Math.max(14, Math.floor(w / 10)));
  const startY = y - ((lines.length - 1) * 8);
  lines.forEach((lineText, index) => {
    text += `<text x="${x}" y="${startY + index * 17}" text-anchor="middle" class="usecase-text">${esc(lineText)}</text>`;
  });
  return `
    <g filter="url(#shadow)">
      <ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="${options.fill || colors.white}" stroke="${options.stroke || "#94a3b8"}" stroke-width="1.5"/>
      ${text}
    </g>`;
}

function baseCss() {
  return `
    @page { size: 24in 16in; margin: 0.35in; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2f7; color: ${colors.ink}; font-family: Arial, Helvetica, sans-serif; }
    .sheet { width: 100%; min-height: 100vh; padding: 18px; background: #eef2f7; }
    svg { width: 100%; height: auto; display: block; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; }
    .diagram-title { font-size: 28px; font-weight: 800; fill: ${colors.ink}; }
    .diagram-subtitle { font-size: 15px; fill: ${colors.muted}; }
    .class-title, .entity-title { font-size: 14px; font-weight: 800; fill: #ffffff; }
    .class-text, .box-text, .entity-text { font-size: 12px; fill: ${colors.ink}; }
    .entity-key { font-size: 12px; fill: #0f766e; font-weight: 800; }
    .entity-fk { font-size: 12px; fill: #7c3aed; font-weight: 700; }
    .section-label { font-size: 11px; fill: ${colors.muted}; font-weight: 700; }
    .box-title { font-size: 15px; font-weight: 800; fill: ${colors.ink}; }
    .line-label { font-size: 11px; fill: ${colors.grayDark}; font-weight: 700; paint-order: stroke; stroke: #f8fafc; stroke-width: 4px; }
    .group-label { font-size: 17px; fill: ${colors.ink}; font-weight: 800; }
    .actor-label { font-size: 17px; fill: ${colors.ink}; font-weight: 800; }
    .usecase-text { font-size: 13px; fill: ${colors.ink}; font-weight: 700; }
    .note { font-size: 12px; fill: ${colors.muted}; }
    .schema-page { page-break-after: always; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; padding: 30px; min-height: 15.2in; }
    .schema-page:last-child { page-break-after: auto; }
    h1 { margin: 0 0 6px; font-size: 34px; }
    h2 { margin: 22px 0 12px; font-size: 22px; color: ${colors.ink}; }
    p { margin: 0 0 16px; color: ${colors.muted}; }
    .schema-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .relation { background: white; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; break-inside: avoid; box-shadow: 0 4px 12px rgba(15,23,42,.08); }
    .relation h3 { margin: 0 0 8px; font-size: 15px; color: ${colors.blueDark}; }
    .relation code { display: block; white-space: normal; line-height: 1.45; font-family: Consolas, "Courier New", monospace; font-size: 11.4px; color: ${colors.ink}; }
    .fk { color: ${colors.violetDark}; font-weight: 700; }
    .pk { color: #0f766e; font-weight: 800; }
    .schema-note { padding: 12px 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; color: #9a3412; font-size: 13px; }
  `;
}

function htmlPage(title, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <style>${baseCss()}</style>
</head>
<body>${body}</body>
</html>`;
}

function writeHtml(name, html) {
  const file = path.join(outDir, `${name}.html`);
  fs.writeFileSync(file, html, "utf8");
  return file;
}

function findChrome() {
  const candidates = [
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error("Chrome or Edge was not found. Cannot print PDFs.");
  }
  return found;
}

function printPdf(htmlFile, pdfFile) {
  const chrome = findChrome();
  const profile = path.join(outDir, `chrome-profile-${path.basename(pdfFile, ".pdf")}`);
  fs.mkdirSync(profile, { recursive: true });
  if (fs.existsSync(pdfFile)) fs.rmSync(pdfFile);
  const result = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-gpu-sandbox",
    "--disable-software-rasterizer",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-features=UseSkiaRenderer,VizDisplayCompositor,CanvasOopRasterization,WebGPU,DawnGraphiteBackend,SkiaGraphite",
    "--use-gl=swiftshader",
    "--use-angle=swiftshader",
    "--allow-file-access-from-files",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=1000",
    "--no-pdf-header-footer",
    `--user-data-dir=${profile}`,
    `--print-to-pdf=${pdfFile}`,
    pathToFileURL(htmlFile).href,
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error(`Chrome failed while printing ${path.basename(pdfFile)}\n${result.stderr || result.stdout}`);
  }
}

function umlClassDiagram() {
  const W = 2200;
  const H = 1500;
  const items = [];

  items.push(`<rect x="28" y="95" width="300" height="620" rx="16" fill="${colors.blue}" stroke="#bfdbfe"/>`);
  items.push(`<text x="178" y="125" text-anchor="middle" class="group-label">Client Applications</text>`);
  items.push(classBox(60, 160, 240, "BrowserClient", [
    { lines: ["HTML pages", "JS page modules", "api.js HTTP client", "auth.js session handling"] },
  ], { titleFill: colors.blueDark }).svg);
  items.push(classBox(60, 360, 240, "ElectronDesktop", [
    { lines: ["main.js", "loads frontend", "desktop packaging"] },
  ], { titleFill: colors.blueDark }).svg);
  items.push(classBox(60, 540, 240, "FlutterMobile", [
    { lines: ["ApiService", "AuthService", "UserSession", "Feature screens"] },
  ], { titleFill: colors.blueDark }).svg);

  items.push(classBox(390, 150, 260, "ExpressApp", [
    { lines: ["cors()", "express.json()", "morgan()", "static /uploads", "mountRoutes()", "errorHandler()"] },
  ], { titleFill: colors.greenDark }).svg);
  items.push(classBox(390, 380, 260, "HttpSocketServer", [
    { lines: ["startServer()", "Socket.IO rooms", "cron jobs", "global.io"] },
  ], { titleFill: colors.greenDark }).svg);
  items.push(classBox(390, 620, 260, "Middleware", [
    { label: "classes", lines: ["AuthMiddleware", "RoleMiddleware", "ValidateMiddleware", "ErrorHandler"] },
  ], { titleFill: colors.greenDark }).svg);

  const routes = ["AuthRoutes", "UserRoutes", "DoctorRoutes", "AdminRoutes", "PlanRoutes", "TrackingRoutes", "MedicalRoutes", "CommunityRoutes", "MessagingRoutes", "SubscriptionRoutes", "AgentRoutes", "ContentRoutes", "FoodRoutes"];
  items.push(simpleBox(720, 100, 300, 560, "Route Modules", routes, { fill: colors.amber }));

  const controllers = [
    ["AuthController", ["registerUser()", "registerDoctor()", "login()", "me()"]],
    ["UserController", ["profile()", "subscribe()", "requestDoctor()"]],
    ["DoctorController", ["getUserCase()", "respondRequest()", "updateTargets()"]],
    ["AdminController", ["manage accounts", "manage content", "stats()"]],
    ["PlanController", ["meal plans", "exercise plans", "meal items"]],
    ["TrackingController", ["logs", "dailySummary()"]],
    ["CommunityController", ["habits", "fasting", "posts", "challenges"]],
    ["MessagingController", ["chat history", "sendMessage()", "notifications"]],
    ["SubscriptionController", ["requestUpgrade()", "reviewRequest()"]],
    ["AiAgentController", ["chat()", "history()", "generate plans"]],
  ];
  controllers.forEach(([name, methods], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    items.push(classBox(1080 + col * 250, 80 + row * 135, 220, name, [{ lines: methods }], { titleFill: colors.violetDark }).svg);
  });

  const models = [
    "AuthModel", "UserModel", "DoctorModel", "AdminModel", "FoodModel",
    "MedicalModel", "RequirementModel", "PlanModel", "TrackingModel", "CommunityModel", "ContentModel",
  ];
  items.push(simpleBox(1620, 90, 280, 500, "Model Layer", models, { fill: colors.cyan }));
  items.push(classBox(1620, 650, 280, "Utilities", [
    { lines: ["JwtUtil", "ResponseUtil", "NotificationService", "asyncHandler"] },
  ], { titleFill: colors.cyanDark }).svg);
  items.push(classBox(1970, 360, 180, "MySqlPool", [
    { lines: ["mysql2/promise", "query()", "getConnection()"] },
  ], { titleFill: colors.roseDark }).svg);

  items.push(line([[300, 250], [390, 240]], "REST JSON", { arrow: true }));
  items.push(line([[300, 440], [390, 240]], "wraps app", { arrow: true }));
  items.push(line([[300, 620], [390, 240]], "REST JSON", { arrow: true }));
  items.push(line([[650, 260], [720, 250]], "mounts", { arrow: true }));
  items.push(line([[1020, 330], [1080, 330]], "dispatches", { arrow: true }));
  items.push(line([[1545, 360], [1620, 340]], "uses", { arrow: true }));
  items.push(line([[1900, 340], [1970, 430]], "SQL", { arrow: true }));
  items.push(line([[650, 510], [720, 520]], "guards", { arrow: true, dash: "8 6" }));
  items.push(line([[520, 380], [520, 300]], "server owns app", { arrow: true }));
  items.push(line([[1760, 650], [1970, 470]], "notifications", { arrow: true, dash: "8 6" }));

  items.push(`<text x="60" y="1410" class="note">Notes: This UML is module/class-level because the backend uses CommonJS modules and raw MySQL queries rather than ORM entity classes.</text>`);
  items.push(`<text x="60" y="1432" class="note">Main dependency flow: Client -> Express routes -> middleware -> controllers -> models/utilities -> MySQL/Socket.IO.</text>`);

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="UML class diagram">
    ${svgDefs()}
    <rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc"/>
    ${titleBlock("Healix UML Class Diagram", "Module-level UML generated from backend, web, desktop, and mobile source structure", W)}
    ${items.join("\n")}
  </svg>`;

  return htmlPage("Healix UML Class Diagram", `<div class="sheet">${svg}</div>`);
}

const tableData = [
  ["USER_ACCOUNT", ["PK user_username", "email", "password_hash", "first_name", "last_name", "phone_no", "subscription_tier", "subscription_end_date", "FK assigned_doctor_username"]],
  ["DOCTOR", ["PK doctor_username", "email", "password_hash", "first_name", "last_name", "phone_no", "address", "certification"]],
  ["ADMIN_ACCOUNT", ["PK admin_username", "email", "password_hash"]],
  ["USER_DOCTOR_CONSULTATION", ["PK/FK user_username", "PK/FK doctor_username", "status", "created_at"]],
  ["SUBSCRIPTION_REQUESTS", ["PK id", "FK user_username", "requested_tier", "FK doctor_username", "status", "admin_note"]],
  ["NOTIFICATION", ["PK id", "user_username", "message", "is_read", "created_at"]],
  ["DOCTOR_PATIENT_CHAT", ["PK id", "sender_username", "receiver_username", "message", "is_read", "created_at"]],
  ["USER_AI_TOKENS", ["PK/FK user_username", "tokens_left", "last_reset_at"]],
  ["AI_CHAT_HISTORY", ["PK id", "FK user_username", "role", "message", "created_at"]],
  ["USER_REQUIREMENT", ["PK req_id", "FK user_username", "height_cm", "weight_kg", "goal", "target_calories", "sleep_hours_target", "water_cups_target"]],
  ["MEDICAL_CONDITION", ["PK condition_id", "condition_name", "description"]],
  ["CONDITION_DIET_RULE", ["PK rule_id", "FK condition_id", "nutrient_key", "rule_type", "threshold_value"]],
  ["USER_MEDICAL_HISTORY", ["PK history_id", "FK user_username", "FK condition_id", "FK diagnosed_by_doctor_username", "diagnosis_date", "severity"]],
  ["USER_MEDICAL_RECORD", ["PK record_id", "FK user_username", "condition_name", "condition_type", "file_path", "file_type"]],
  ["CONDITIONS", ["PK condition_id", "name", "description"]],
  ["USER_CONDITIONS", ["PK/FK user_username", "PK/FK condition_id"]],
  ["FOOD", ["PK food_id", "food_name", "category", "description", "serving_size"]],
  ["NUTRITION_FACTS", ["PK nutrition_id", "FK food_id", "calories", "protein_g", "total_carbs_g", "total_fat_g"]],
  ["FOOD_MEDICAL", ["PK foodmed_id", "FK food_id", "foodmed_name"]],
  ["MEALTIME", ["PK mealtime_id", "FK food_id", "mealtime_name"]],
  ["DIET_PLAN", ["PK plan_id", "FK user_username", "FK doctor_username", "goal_type", "start_date", "end_date", "target_calories"]],
  ["PLAN_MEAL", ["PK plan_meal_id", "FK plan_id", "meal_name", "meal_time", "weekday", "day_no"]],
  ["PLAN_MEAL_ITEM", ["PK plan_item_id", "FK plan_meal_id", "FK food_id", "qty", "unit", "instruction"]],
  ["EXERCISES", ["PK exercise_id", "name", "category", "youtube_url", "instructions"]],
  ["EXERCISE_PLANS", ["PK plan_id", "FK user_username", "FK doctor_username", "goal_type", "created_at"]],
  ["PLAN_EXERCISES", ["PK plan_exercise_id", "FK plan_id", "FK exercise_id", "day_number", "sets", "reps"]],
  ["RECIPES", ["PK recipe_id", "name", "calories", "prep_time_min", "instructions", "image_url"]],
  ["FOOD_LOG", ["PK log_id", "FK user_username", "food_name", "meal_type", "calories", "protein_g", "logged_at"]],
  ["WEIGHT_LOG", ["PK log_id", "FK user_username", "weight_kg", "notes", "logged_at"]],
  ["WATER_LOG", ["PK log_id", "FK user_username", "cups", "ml", "log_date"]],
  ["SLEEP_LOG", ["PK log_id", "FK user_username", "hours", "quality", "stress_level", "log_date"]],
  ["STEP_LOG", ["PK log_id", "FK user_username", "steps", "distance_km", "calories_burned", "log_date"]],
  ["EXERCISE_LOG", ["PK log_id", "FK user_username", "exercise_name", "duration_min", "calories_burned", "logged_at"]],
  ["HABIT", ["PK habit_id", "FK user_username", "habit_name", "frequency", "reminder_time", "color"]],
  ["HABIT_LOG", ["PK habit_log_id", "FK habit_id", "FK user_username", "completed_date"]],
  ["FASTING_SESSION", ["PK session_id", "FK user_username", "protocol", "start_time", "end_time", "status"]],
  ["COMMUNITY_POST", ["PK post_id", "FK user_username", "content", "post_type", "likes", "created_at"]],
  ["CHALLENGE", ["PK challenge_id", "title", "description", "start_date", "end_date", "participant_count"]],
  ["CHALLENGE_PARTICIPANT", ["PK/FK challenge_id", "PK/FK user_username", "progress", "joined_at"]],
];

function erdDiagram() {
  const W = 2300;
  const H = 1850;
  const boxes = {};
  const items = [];
  const palette = [colors.greenDark, colors.blueDark, colors.violetDark, colors.amberDark, colors.cyanDark, colors.roseDark];
  const positions = [
    ["USER_ACCOUNT", 40, 120, 315, 0],
    ["DOCTOR", 40, 350, 315, 0],
    ["ADMIN_ACCOUNT", 40, 548, 315, 0],
    ["USER_DOCTOR_CONSULTATION", 410, 155, 330, 0],
    ["SUBSCRIPTION_REQUESTS", 410, 360, 330, 0],
    ["NOTIFICATION", 410, 585, 330, 0],
    ["DOCTOR_PATIENT_CHAT", 410, 765, 330, 0],
    ["USER_AI_TOKENS", 40, 760, 315, 0],
    ["AI_CHAT_HISTORY", 40, 930, 315, 0],

    ["USER_REQUIREMENT", 800, 120, 325, 1],
    ["MEDICAL_CONDITION", 800, 360, 325, 1],
    ["CONDITION_DIET_RULE", 1170, 360, 325, 1],
    ["USER_MEDICAL_HISTORY", 800, 555, 325, 1],
    ["USER_MEDICAL_RECORD", 1170, 555, 325, 1],
    ["CONDITIONS", 800, 790, 325, 1],
    ["USER_CONDITIONS", 1170, 790, 325, 1],

    ["FOOD", 1560, 120, 320, 2],
    ["NUTRITION_FACTS", 1940, 120, 320, 2],
    ["FOOD_MEDICAL", 1560, 330, 320, 2],
    ["MEALTIME", 1940, 360, 320, 2],
    ["DIET_PLAN", 1560, 555, 320, 3],
    ["PLAN_MEAL", 1940, 555, 320, 3],
    ["PLAN_MEAL_ITEM", 1940, 765, 320, 3],

    ["EXERCISES", 1560, 1010, 320, 4],
    ["EXERCISE_PLANS", 1940, 1010, 320, 4],
    ["PLAN_EXERCISES", 1940, 1210, 320, 4],
    ["RECIPES", 1560, 1210, 320, 4],

    ["FOOD_LOG", 40, 1190, 315, 5],
    ["WEIGHT_LOG", 410, 1190, 315, 5],
    ["WATER_LOG", 800, 1190, 315, 5],
    ["SLEEP_LOG", 1170, 1190, 315, 5],
    ["STEP_LOG", 40, 1430, 315, 5],
    ["EXERCISE_LOG", 410, 1430, 315, 5],
    ["HABIT", 800, 1430, 315, 5],
    ["HABIT_LOG", 1170, 1430, 315, 5],
    ["FASTING_SESSION", 1560, 1430, 315, 5],
    ["COMMUNITY_POST", 1940, 1430, 315, 5],
    ["CHALLENGE", 1560, 1640, 315, 5],
    ["CHALLENGE_PARTICIPANT", 1940, 1640, 315, 5],
  ];

  for (const [name, x, y, w, colorIndex] of positions) {
    const [, fields] = tableData.find((entry) => entry[0] === name);
    boxes[name] = entityBox(x, y, w, name, fields, { headerFill: palette[colorIndex] });
  }

  const rel = [];
  const c = (a, sideA, b, sideB, label, options = {}) => {
    const A = boxes[a];
    const B = boxes[b];
    const from = {
      right: [A.right, A.cy],
      left: [A.left, A.cy],
      top: [A.cx, A.top],
      bottom: [A.cx, A.bottom],
    }[sideA];
    const to = {
      right: [B.right, B.cy],
      left: [B.left, B.cy],
      top: [B.cx, B.top],
      bottom: [B.cx, B.bottom],
    }[sideB];
    const midX = options.midX ?? (from[0] + to[0]) / 2;
    rel.push(line([from, [midX, from[1]], [midX, to[1]], to], label, { arrow: true, stroke: "#94a3b8", labelDx: options.labelDx || 0, labelDy: options.labelDy || -8 }));
  };

  c("USER_ACCOUNT", "right", "USER_DOCTOR_CONSULTATION", "left", "1 to many");
  c("DOCTOR", "right", "USER_DOCTOR_CONSULTATION", "left", "1 to many", { midX: 385 });
  c("USER_ACCOUNT", "right", "SUBSCRIPTION_REQUESTS", "left", "submits", { midX: 385 });
  c("DOCTOR", "right", "SUBSCRIPTION_REQUESTS", "left", "requested");
  c("USER_ACCOUNT", "right", "USER_REQUIREMENT", "left", "has");
  c("USER_ACCOUNT", "right", "USER_AI_TOKENS", "left", "quota", { midX: 385 });
  c("USER_ACCOUNT", "right", "AI_CHAT_HISTORY", "left", "history", { midX: 385 });
  c("MEDICAL_CONDITION", "right", "CONDITION_DIET_RULE", "left", "rules");
  c("USER_ACCOUNT", "right", "USER_MEDICAL_HISTORY", "left", "has", { midX: 770 });
  c("MEDICAL_CONDITION", "bottom", "USER_MEDICAL_HISTORY", "top", "diagnosis");
  c("USER_ACCOUNT", "right", "USER_MEDICAL_RECORD", "left", "uploads", { midX: 760 });
  c("CONDITIONS", "right", "USER_CONDITIONS", "left", "selected");
  c("USER_ACCOUNT", "right", "USER_CONDITIONS", "left", "legacy tags", { midX: 770 });
  c("FOOD", "right", "NUTRITION_FACTS", "left", "1 to 1");
  c("FOOD", "bottom", "FOOD_MEDICAL", "top", "tags");
  c("FOOD", "right", "MEALTIME", "left", "mealtimes");
  c("USER_ACCOUNT", "right", "DIET_PLAN", "left", "owns", { midX: 1520 });
  c("DOCTOR", "right", "DIET_PLAN", "left", "creates", { midX: 1520 });
  c("DIET_PLAN", "right", "PLAN_MEAL", "left", "contains");
  c("PLAN_MEAL", "bottom", "PLAN_MEAL_ITEM", "top", "items");
  c("FOOD", "bottom", "PLAN_MEAL_ITEM", "left", "used");
  c("USER_ACCOUNT", "right", "EXERCISE_PLANS", "left", "owns", { midX: 1520 });
  c("EXERCISE_PLANS", "bottom", "PLAN_EXERCISES", "top", "contains");
  c("EXERCISES", "right", "PLAN_EXERCISES", "left", "assigned");
  c("HABIT", "right", "HABIT_LOG", "left", "completed");
  c("CHALLENGE", "right", "CHALLENGE_PARTICIPANT", "left", "participants");

  items.push(...rel);
  items.push(...Object.values(boxes).map((box) => box.svg));
  items.push(`<text x="40" y="1815" class="note">Crow-foot/cardinality is inferred from query usage. Username fields in notification and chat are polymorphic across users, doctors, and admins.</text>`);

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Entity relationship diagram">
    ${svgDefs()}
    <rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc"/>
    ${titleBlock("Healix Entity Relationship Diagram", "Inferred from Express/MySQL model, route, controller, seed, and server SQL references", W)}
    ${items.join("\n")}
  </svg>`;
  return htmlPage("Healix ERD", `<div class="sheet">${svg}</div>`);
}

const relations = [
  ["user_account", "user_username", ["email", "phone_no", "address", "gender", "job", "dob", "password_hash", "first_name", "last_name", "subscription_tier", "subscription_end_date", "assigned_doctor_username"], [["assigned_doctor_username", "doctor.doctor_username"]]],
  ["doctor", "doctor_username", ["email", "phone_no", "address", "gender", "dob", "password_hash", "first_name", "last_name", "certification"], []],
  ["admin_account", "admin_username", ["email", "password_hash"], []],
  ["user_doctor_consultation", "user_username, doctor_username", ["status", "created_at"], [["user_username", "user_account.user_username"], ["doctor_username", "doctor.doctor_username"]]],
  ["subscription_requests", "id", ["user_username", "requested_tier", "doctor_username", "status", "admin_note", "created_at", "updated_at"], [["user_username", "user_account.user_username"], ["doctor_username", "doctor.doctor_username"]]],
  ["notification", "id", ["user_username", "message", "is_read", "created_at"], []],
  ["doctor_patient_chat", "id", ["sender_username", "receiver_username", "message", "created_at", "is_read"], []],
  ["user_requirement", "req_id", ["user_username", "height_cm", "weight_kg", "target_weight_kg", "activity_rate", "goal", "target_date", "preferences", "allergies", "target_calories", "target_protein_g", "target_carbs_g", "target_fat_g", "sleep_hours_target", "water_cups_target"], [["user_username", "user_account.user_username"]]],
  ["medical_condition", "condition_id", ["condition_name", "description"], []],
  ["condition_diet_rule", "rule_id", ["condition_id", "nutrient_key", "rule_type", "threshold_value", "threshold_unit", "notes"], [["condition_id", "medical_condition.condition_id"]]],
  ["user_medical_history", "history_id", ["user_username", "condition_id", "diagnosed_by_doctor_username", "diagnosis_date", "severity", "notes"], [["user_username", "user_account.user_username"], ["condition_id", "medical_condition.condition_id"], ["diagnosed_by_doctor_username", "doctor.doctor_username"]]],
  ["user_medical_record", "record_id", ["user_username", "condition_name", "condition_type", "extra_info", "file_path", "file_type", "file_name", "created_at"], [["user_username", "user_account.user_username"]]],
  ["conditions", "condition_id", ["name", "description"], []],
  ["user_conditions", "user_username, condition_id", [], [["user_username", "user_account.user_username"], ["condition_id", "conditions.condition_id"]]],
  ["food", "food_id", ["food_name", "category", "description", "serving_size"], []],
  ["nutrition_facts", "nutrition_id", ["food_id", "calories", "protein_g", "total_carbs_g", "total_fat_g", "saturated_fat_g", "sugar_g", "fiber_g", "cholesterol_mg", "sodium_mg", "potassium_mg", "calcium_mg", "iron_mg", "vitamin_a_mcg", "vitamin_c_mg"], [["food_id", "food.food_id"]]],
  ["food_medical", "foodmed_id", ["food_id", "foodmed_name"], [["food_id", "food.food_id"]]],
  ["mealtime", "mealtime_id", ["food_id", "mealtime_name"], [["food_id", "food.food_id"]]],
  ["diet_plan", "plan_id", ["user_username", "doctor_username", "goal_type", "start_date", "end_date", "notes", "target_calories", "target_protein_g", "target_carbs_g", "target_fat_g", "target_water_cups", "created_at"], [["user_username", "user_account.user_username"], ["doctor_username", "doctor.doctor_username"]]],
  ["plan_meal", "plan_meal_id", ["plan_id", "meal_name", "meal_time", "weekday", "day_no"], [["plan_id", "diet_plan.plan_id"]]],
  ["plan_meal_item", "plan_item_id", ["plan_meal_id", "food_id", "qty", "unit", "instruction"], [["plan_meal_id", "plan_meal.plan_meal_id"], ["food_id", "food.food_id"]]],
  ["exercises", "exercise_id", ["name", "category", "youtube_url", "instructions", "created_at"], []],
  ["exercise_plans", "plan_id", ["user_username", "doctor_username", "goal_type", "created_at"], [["user_username", "user_account.user_username"], ["doctor_username", "doctor.doctor_username"]]],
  ["plan_exercises", "plan_exercise_id", ["plan_id", "exercise_id", "day_number", "sets", "reps", "instruction"], [["plan_id", "exercise_plans.plan_id"], ["exercise_id", "exercises.exercise_id"]]],
  ["recipes", "recipe_id", ["name", "calories", "prep_time_min", "instructions", "image_url", "video_url", "thumbnail_url", "created_at"], []],
  ["food_log", "log_id", ["user_username", "food_name", "meal_type", "calories", "protein_g", "carbs_g", "fat_g", "quantity", "unit", "logged_at"], [["user_username", "user_account.user_username"]]],
  ["weight_log", "log_id", ["user_username", "weight_kg", "notes", "logged_at"], [["user_username", "user_account.user_username"]]],
  ["water_log", "log_id", ["user_username", "cups", "ml", "log_date"], [["user_username", "user_account.user_username"]]],
  ["sleep_log", "log_id", ["user_username", "hours", "bedtime", "wake_time", "quality", "stress_level", "notes", "log_date"], [["user_username", "user_account.user_username"]]],
  ["step_log", "log_id", ["user_username", "steps", "distance_km", "calories_burned", "log_date"], [["user_username", "user_account.user_username"]]],
  ["exercise_log", "log_id", ["user_username", "exercise_name", "category", "duration_min", "intensity", "calories_burned", "notes", "logged_at"], [["user_username", "user_account.user_username"]]],
  ["habit", "habit_id", ["user_username", "habit_name", "description", "frequency", "reminder_time", "color", "icon", "created_at"], [["user_username", "user_account.user_username"]]],
  ["habit_log", "habit_log_id", ["habit_id", "user_username", "completed_date"], [["habit_id", "habit.habit_id"], ["user_username", "user_account.user_username"]]],
  ["fasting_session", "session_id", ["user_username", "protocol", "start_time", "end_time", "target_hours", "actual_hours", "status"], [["user_username", "user_account.user_username"]]],
  ["community_post", "post_id", ["user_username", "content", "post_type", "likes", "created_at"], [["user_username", "user_account.user_username"]]],
  ["challenge", "challenge_id", ["title", "description", "start_date", "end_date", "participant_count"], []],
  ["challenge_participant", "challenge_id, user_username", ["progress", "joined_at"], [["challenge_id", "challenge.challenge_id"], ["user_username", "user_account.user_username"]]],
  ["ai_chat_history", "id", ["user_username", "role", "message", "created_at"], [["user_username", "user_account.user_username"]]],
  ["user_ai_tokens", "user_username", ["tokens_left", "last_reset_at"], [["user_username", "user_account.user_username"]]],
];

function relationalSchema() {
  const cards = relations.map(([name, pk, cols, fks]) => {
    const renderedCols = cols.map((col) => {
      const fk = fks.find(([from]) => from === col);
      return fk ? `<span class="fk">${esc(col)} -> ${esc(fk[1])}</span>` : esc(col);
    });
    const fields = [`<span class="pk">${esc(pk)} PK</span>`, ...renderedCols].join(", ");
    return `<div class="relation"><h3>${esc(name)}</h3><code>${esc(name)}(${fields})</code></div>`;
  });

  const pages = [];
  for (let i = 0; i < cards.length; i += 12) {
    const pageCards = cards.slice(i, i + 12).join("\n");
    pages.push(`
      <section class="schema-page">
        <h1>Healix Relational Schema</h1>
        <p>Inferred relation notation. Green fields are primary keys. Purple fields are foreign keys.</p>
        ${i === 0 ? `<div class="schema-note">Note: The source has no migration or CREATE TABLE files. The schema is reconstructed from SQL queries in models, controllers, routes, seed scripts, and server jobs.</div>` : ""}
        <h2>Relations ${i + 1}-${Math.min(i + 12, cards.length)} of ${cards.length}</h2>
        <div class="schema-grid">${pageCards}</div>
      </section>`);
  }

  return htmlPage("Healix Relational Schema", `<div class="sheet">${pages.join("\n")}</div>`);
}

function useCaseDiagram() {
  const W = 1700;
  const H = 1100;
  const items = [];

  items.push(`<rect x="300" y="90" width="1090" height="910" rx="28" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>`);
  items.push(`<text x="845" y="130" text-anchor="middle" class="group-label">Healix System</text>`);

  items.push(actor(140, 165, "User"));
  items.push(actor(140, 535, "Doctor"));
  items.push(actor(1550, 205, "Admin"));
  items.push(actor(1550, 620, "Google GenAI"));

  const ucs = {
    register: [460, 210, 210, 70, "Register / Login"],
    profile: [720, 210, 210, 70, "Manage Profile"],
    requirements: [980, 210, 230, 70, "Set Goals and Requirements"],
    tracking: [470, 350, 230, 70, "Log Health Metrics"],
    dashboard: [740, 350, 230, 70, "View Dashboard Summary"],
    records: [1010, 350, 240, 70, "Upload Medical Records"],
    requestDoctor: [475, 500, 230, 70, "Request Doctor"],
    chatDoctor: [745, 500, 230, 70, "Chat with Doctor"],
    aiCoach: [1015, 500, 230, 70, "Use AI Coach"],
    generatedPlans: [1015, 650, 250, 74, "Generate Meal or Exercise Plan"],
    community: [475, 650, 230, 70, "Habits, Fasting and Community"],
    viewContent: [745, 650, 230, 70, "View Recipes and Exercises"],
    doctorRequests: [465, 820, 245, 70, "Review Patient Requests"],
    case: [745, 820, 230, 70, "View Patient Case"],
    doctorPlans: [1015, 820, 245, 70, "Create Plans and Targets"],
    adminSubs: [1180, 210, 235, 70, "Review Subscriptions"],
    adminManage: [1190, 350, 250, 70, "Manage Users, Doctors and Content"],
    adminStats: [1190, 500, 230, 70, "View Platform Stats"],
    processAi: [1195, 650, 235, 70, "Process AI Prompt"],
  };

  Object.values(ucs).forEach(([x, y, w, h, label]) => {
    items.push(useCase(x, y, w, h, label, { fill: colors.white }));
  });

  const assoc = (from, to, label = "", options = {}) => {
    items.push(line([from, to], label, { stroke: "#64748b", width: 1.8, dash: options.dash, arrow: options.arrow, labelDx: options.dx, labelDy: options.dy }));
  };

  const leftUser = [205, 245];
  ["register", "profile", "requirements", "tracking", "dashboard", "records", "requestDoctor", "chatDoctor", "aiCoach", "community", "viewContent"].forEach((key) => {
    assoc(leftUser, [ucs[key][0] - ucs[key][2] / 2, ucs[key][1]]);
  });

  const leftDoctor = [205, 615];
  ["register", "chatDoctor", "doctorRequests", "case", "doctorPlans"].forEach((key) => {
    assoc(leftDoctor, [ucs[key][0] - ucs[key][2] / 2, ucs[key][1]]);
  });

  const rightAdmin = [1485, 285];
  ["adminSubs", "adminManage", "adminStats"].forEach((key) => {
    assoc(rightAdmin, [ucs[key][0] + ucs[key][2] / 2, ucs[key][1]]);
  });

  const rightAi = [1485, 700];
  assoc(rightAi, [ucs.processAi[0] + ucs.processAi[2] / 2, ucs.processAi[1]]);
  assoc([ucs.aiCoach[0] + 115, ucs.aiCoach[1]], [ucs.processAi[0] - 118, ucs.processAi[1]], "<<include>>", { dash: "8 6", arrow: true, dy: -12 });
  assoc([ucs.generatedPlans[0] + 125, ucs.generatedPlans[1]], [ucs.processAi[0] - 118, ucs.processAi[1]], "<<include>>", { dash: "8 6", arrow: true, dy: 18 });
  assoc([ucs.requestDoctor[0] + 115, ucs.requestDoctor[1]], [ucs.doctorRequests[0] - 122, ucs.doctorRequests[1]], "notifies", { dash: "6 5", arrow: true, dy: -12 });
  assoc([ucs.chatDoctor[0], ucs.chatDoctor[1] + 35], [ucs.doctorPlans[0] - 122, ucs.doctorPlans[1]], "care loop", { dash: "6 5", arrow: true });

  items.push(`<text x="335" y="960" class="note">Use cases are grouped around the current route/controller behavior: auth, profile, tracking, plans, messaging, subscriptions, AI, community, and admin management.</text>`);

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Use case diagram">
    ${svgDefs()}
    <rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc"/>
    ${titleBlock("Healix Use Case Diagram", "Primary actors and system use cases inferred from frontend features and backend routes", W)}
    ${items.join("\n")}
  </svg>`;

  return htmlPage("Healix Use Case Diagram", `<div class="sheet">${svg}</div>`);
}

function main() {
  const outputs = [
    ["UML_Class_Diagram", umlClassDiagram()],
    ["ERD", erdDiagram()],
    ["Relational_Schema", relationalSchema()],
    ["Use_Case_Diagram", useCaseDiagram()],
  ];

  const generated = [];
  for (const [name, html] of outputs) {
    const htmlFile = writeHtml(name, html);
    const pdfFile = path.join(outDir, `${name}.pdf`);
    printPdf(htmlFile, pdfFile);
    const size = fs.statSync(pdfFile).size;
    if (size < 1000) throw new Error(`${pdfFile} looks too small to be a valid PDF.`);
    generated.push({ name, htmlFile, pdfFile, size });
  }

  for (const file of generated) {
    console.log(`${file.name}: ${file.pdfFile} (${file.size} bytes)`);
  }
}

main();
