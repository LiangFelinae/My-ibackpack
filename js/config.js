(function initBackpackConfig() {
const STORAGE_KEY = "my-backpack-v2";
const SETTINGS_KEY = "my-backpack-settings-v2";
const TYPE_SETTINGS_KEY = "my-backpack-type-settings-v1";

const PRESET_TYPES = ["亲亲券", "贴贴券", "和好券", "按摩券", "礼物券", "夸夸券", "牵手散步券"];

const COLOR_OPTIONS = [
  { key: "red", label: "暖红", accent: "#e55462", soft: "#fff0f1", tileBg: "#fff2f3", tileBorder: "#f4d4d8", tileInk: "#a4434c" },
  { key: "rose", label: "柔粉", accent: "#de718d", soft: "#fff0f4", tileBg: "#fff2f5", tileBorder: "#f2d5dd", tileInk: "#9c4d62" },
  { key: "purple", label: "淡紫", accent: "#8579d2", soft: "#f2f0ff", tileBg: "#f4f2ff", tileBorder: "#dedaf5", tileInk: "#6258a3" },
  { key: "green", label: "薄荷", accent: "#4ca58f", soft: "#ebfaf6", tileBg: "#eefaf7", tileBorder: "#cfeae3", tileInk: "#367868" },
  { key: "orange", label: "暖橙", accent: "#d98d5f", soft: "#fff3ec", tileBg: "#fff4ee", tileBorder: "#eed8cb", tileInk: "#955b3d" },
  { key: "blue", label: "天空", accent: "#5c96d4", soft: "#edf6ff", tileBg: "#eff7ff", tileBorder: "#d4e5f5", tileInk: "#4677a7" },
];

const ICON_OPTIONS = [
  { key: "ticket", label: "票券" },
  { key: "heart", label: "爱心" },
  { key: "kiss", label: "亲亲" },
  { key: "hug", label: "贴贴" },
  { key: "massage", label: "按摩" },
  { key: "gift", label: "礼物" },
  { key: "spark", label: "闪光" },
  { key: "walk", label: "散步" },
  { key: "food", label: "美食" },
];

const THEMES = {
  kiss: { icon: "kiss", color: "rose", rank: 4 },
  hug: { icon: "hug", color: "purple", rank: 4 },
  peace: { icon: "heart", color: "red", rank: 5 },
  massage: { icon: "massage", color: "green", rank: 3 },
  gift: { icon: "gift", color: "orange", rank: 3 },
  food: { icon: "food", color: "orange", rank: 2 },
  praise: { icon: "spark", color: "blue", rank: 2 },
  walk: { icon: "walk", color: "green", rank: 2 },
  default: { icon: "ticket", color: "blue", rank: 1 },
};

const ICON_SVG = {
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="icon-fill" d="M12 20.2C8 17.7 4.6 14.9 4.6 10.5A4.4 4.4 0 0 1 9 6.1c1.4 0 2.4.6 3 1.7a3.5 3.5 0 0 1 3-1.7 4.4 4.4 0 0 1 4.4 4.4c0 4.4-3.4 7.2-7.4 9.7Z"/></svg>`,
  kiss: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 7.4a4.6 4.6 0 0 0-2.6 4.2c0 2.5 1.7 4.6 4.1 5.2M16.6 7.4a4.6 4.6 0 0 1 2.6 4.2c0 2.5-1.7 4.6-4.1 5.2M8.5 11.2h.1M15.4 11.2h.1"/><path class="icon-fill" d="M12 15.8c-1.8-1-3-2-3-3.4 0-1 .7-1.7 1.6-1.7.7 0 1.1.3 1.4.8.3-.5.7-.8 1.4-.8.9 0 1.6.7 1.6 1.7 0 1.4-1.2 2.4-3 3.4Z"/></svg>`,
  hug: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><path d="M4.7 18c.3-3 2.2-4.7 5-4.7h.9l1.4 1.9 1.4-1.9h.9c2.8 0 4.7 1.7 5 4.7M7.7 15.2c1.2 1 2.6 1.5 4.3 1.5s3.1-.5 4.3-1.5"/></svg>`,
  massage: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6.6" r="2.5"/><path d="M7.2 19v-2.2c0-3 1.9-5 4.8-5s4.8 2 4.8 5V19M4.2 10.8c1.2.4 2 1.3 2.4 2.5M19.8 10.8c-1.2.4-2 1.3-2.4 2.5M3.6 7.8c1.7.5 2.9 1.7 3.4 3.3M20.4 7.8c-1.7.5-2.9 1.7-3.4 3.3"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4zM2.8 7.5h18.4V10H2.8zM12 7.5V20"/><path d="M11.8 7.5H8.4a2.1 2.1 0 1 1 0-4.2c2 0 3.4 2.3 3.4 4.2ZM12.2 7.5h3.4a2.1 2.1 0 1 0 0-4.2c-2 0-3.4 2.3-3.4 4.2Z"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c.7 4.7 2.3 6.3 7 7-4.7.7-6.3 2.3-7 7-.7-4.7-2.3-6.3-7-7 4.7-.7 6.3-2.3 7-7ZM18.7 15.7c.3 2.1 1 2.8 3.1 3.1-2.1.3-2.8 1-3.1 3.1-.3-2.1-1-2.8-3.1-3.1 2.1-.3 2.8-1 3.1-3.1Z"/></svg>`,
  walk: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 4.3c1.4.2 2.4 1.7 2.1 3.4-.3 1.8-1.6 2.9-3 2.7-1.4-.2-2.4-1.7-2.1-3.4.3-1.8 1.6-2.9 3-2.7ZM15.8 13.6c1.3.2 2.2 1.6 1.9 3.2-.3 1.7-1.5 2.7-2.8 2.5-1.3-.2-2.2-1.6-1.9-3.2.3-1.7 1.5-2.7 2.8-2.5Z"/><path d="m8 12.3-2.7 3.1M10.5 12.6l2.2 2.2M16 10.6l2.6-2.8"/></svg>`,
  food: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5h16c-.5 4.7-3.5 7.2-8 7.2s-7.5-2.5-8-7.2ZM6.2 19.5h11.6M8 8.8c-1.4-1.4.8-2.2-.4-3.7M12 8.8c-1.4-1.4.8-2.2-.4-3.7M16 8.8c-1.4-1.4.8-2.2-.4-3.7"/></svg>`,
  ticket: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.2h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4v-3ZM12 7.2v10"/></svg>`,
};

function getBaseTheme(type = "") {
  if (type.includes("亲")) return THEMES.kiss;
  if (type.includes("贴") || type.includes("抱")) return THEMES.hug;
  if (type.includes("和好")) return THEMES.peace;
  if (type.includes("按摩") || type.includes("搓")) return THEMES.massage;
  if (type.includes("礼物")) return THEMES.gift;
  if (type.includes("美食") || type.includes("吃") || type.includes("面")) return THEMES.food;
  if (type.includes("夸")) return THEMES.praise;
  if (type.includes("牵手") || type.includes("散步")) return THEMES.walk;
  return THEMES.default;
}

function resolveTypeTheme(type = "", settings = {}) {
  const base = getBaseTheme(type);
  const custom = settings[type] || {};
  const colorKey = COLOR_OPTIONS.some((option) => option.key === custom.color) ? custom.color : base.color;
  const color = COLOR_OPTIONS.find((option) => option.key === colorKey) || COLOR_OPTIONS[5];
  return {
    ...color,
    icon: ICON_OPTIONS.some((option) => option.key === custom.icon) ? custom.icon : base.icon,
    rank: Math.min(5, Math.max(1, Number(custom.rank) || base.rank)),
    color: colorKey,
  };
}

function getTypeTheme(type = "") {
  return resolveTypeTheme(type, {});
}

function getTypeRank(type = "", settings = {}) {
  return resolveTypeTheme(type, settings).rank;
}

function getIconSvg(icon = "ticket") {
  return ICON_SVG[icon] || ICON_SVG.ticket;
}

globalThis.BackpackConfig = {
  STORAGE_KEY, SETTINGS_KEY, TYPE_SETTINGS_KEY, PRESET_TYPES,
  COLOR_OPTIONS, ICON_OPTIONS, getTypeTheme, getTypeRank, resolveTypeTheme, getIconSvg,
};
})();
