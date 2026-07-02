(function initBackpackStorage() {
const { STORAGE_KEY, TYPE_SETTINGS_KEY, ICON_OPTIONS, COLOR_OPTIONS } = globalThis.BackpackConfig;

const VALID_STATUSES = new Set(["NEW", "USED"]);

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTicket(item) {
  if (!item || typeof item !== "object") return null;

  const type = typeof item.type === "string" ? item.type.trim() : "";
  const status = VALID_STATUSES.has(item.status) ? item.status : null;
  const issuedAt = isValidDate(item.issuedAt) ? new Date(item.issuedAt).toISOString() : null;

  if (!type || !status || !issuedAt) return null;

  let usedAt = null;
  if (status === "USED") {
    usedAt = isValidDate(item.usedAt) ? new Date(item.usedAt).toISOString() : issuedAt;
  }

  return {
    id: typeof item.id === "string" && item.id ? item.id : createId(),
    type,
    note: typeof item.note === "string" ? item.note.trim() : "",
    status,
    issuedAt,
    usedAt,
  };
}

function parseBackup(value) {
  const source = Array.isArray(value) ? value : value?.tickets;
  if (!Array.isArray(source)) throw new Error("备份文件不是票券数组");

  const normalized = source.map(normalizeTicket);
  const invalidCount = normalized.filter((item) => !item).length;
  if (invalidCount > 0) throw new Error(`备份中有 ${invalidCount} 条无效记录`);

  const unique = [];
  const ids = new Set();
  normalized.forEach((item) => {
    if (!ids.has(item.id)) {
      ids.add(item.id);
      unique.push(item);
    }
  });
  return unique;
}

function normalizeTypeSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const iconKeys = new Set(ICON_OPTIONS.map((option) => option.key));
  const colorKeys = new Set(COLOR_OPTIONS.map((option) => option.key));
  const normalized = {};
  Object.entries(value).forEach(([type, setting]) => {
    if (!type.trim() || !setting || typeof setting !== "object") return;
    const icon = iconKeys.has(setting.icon) ? setting.icon : "ticket";
    const color = colorKeys.has(setting.color) ? setting.color : "blue";
    const rank = Math.min(5, Math.max(1, Number(setting.rank) || 1));
    normalized[type.trim()] = { icon, color, rank };
  });
  return normalized;
}

function parseBackupBundle(value) {
  return {
    tickets: parseBackup(value),
    typeSettings: normalizeTypeSettings(Array.isArray(value) ? {} : value.typeSettings),
  };
}

function loadTickets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return parseBackup(JSON.parse(raw));
  } catch (error) {
    console.warn("无法读取本地票券，已保留原数据。", error);
    return [];
  }
}

function saveTickets(tickets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function loadTypeSettings() {
  try {
    return normalizeTypeSettings(JSON.parse(localStorage.getItem(TYPE_SETTINGS_KEY) || "{}"));
  } catch {
    return {};
  }
}

function saveTypeSettings(settings) {
  localStorage.setItem(TYPE_SETTINGS_KEY, JSON.stringify(normalizeTypeSettings(settings)));
}

function buildBackup(tickets, typeSettings = {}) {
  return JSON.stringify({
    version: 3,
    exportedAt: new Date().toISOString(),
    tickets,
    typeSettings: normalizeTypeSettings(typeSettings),
  }, null, 2);
}

function isValidDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

globalThis.BackpackStorage = {
  createId, normalizeTicket, parseBackup, parseBackupBundle,
  loadTickets, saveTickets, loadTypeSettings, saveTypeSettings, buildBackup,
};
})();
