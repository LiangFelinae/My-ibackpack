(function initBackpackApp() {
const { PRESET_TYPES, COLOR_OPTIONS, ICON_OPTIONS, resolveTypeTheme, getIconSvg } = globalThis.BackpackConfig;
const {
  buildBackup, createId, loadTickets, parseBackupBundle, saveTickets, loadTypeSettings, saveTypeSettings,
} = globalThis.BackpackStorage;

const state = {
  tickets: loadTickets(),
  status: "NEW",
  search: "",
  selectedType: "",
  editingId: null,
  typeSettings: loadTypeSettings(),
};

const dom = Object.fromEntries(
  [
    "remainingCount", "totalCount", "usedCount", "typeCountBadge", "typeSummary", "ticketList",
    "openAddButton", "addDialog", "addForm", "typePicker", "customTypeWrap", "customTypeInput",
    "quantityInput", "noteInput", "addFormError", "addSubmitButton", "newTab", "usedTab",
    "searchBox", "searchInput", "exportButton", "importButton", "importFile",
    "activityMonth", "monthAdded", "monthUsed", "monthRemaining", "recentList",
    "manageTypesButton", "typeSettingsDialog", "typeSettingsForm", "closeTypeSettingsButton",
    "settingsTypeSelect", "settingsIconSelect", "settingsColorSelect", "settingsRankSelect",
    "settingsPreview", "settingsPreviewIcon", "settingsPreviewName", "settingsPreviewLevel",
    "resetTypeSettingsButton", "saveTypeSettingsButton",
    "editDialog", "editTypeInput", "editNoteInput", "editFormError", "deleteTicketButton", "saveEditButton",
    "passwordDialog", "passwordForm", "passwordMessage", "passwordInput", "passwordError", "passwordCancelButton", "passwordOkButton",
    "confirmDialog", "confirmSymbol", "confirmTitle", "confirmMessage", "confirmCancelButton", "confirmOkButton",
    "toast",
  ].map((id) => [id, document.getElementById(id)])
);

let confirmResolver = null;
let passwordResolver = null;
let toastTimer = null;

bindEvents();
renderAll();
registerServiceWorker();

function bindEvents() {
  dom.openAddButton.addEventListener("click", openAddDialog);
  dom.addSubmitButton.addEventListener("click", addTickets);
  dom.newTab.addEventListener("click", () => setStatus("NEW"));
  dom.usedTab.addEventListener("click", () => setStatus("USED"));
  dom.searchInput.addEventListener("input", () => {
    state.search = dom.searchInput.value.trim().toLocaleLowerCase("zh-CN");
    renderTickets();
  });

  dom.exportButton.addEventListener("click", exportBackup);
  dom.importButton.addEventListener("click", () => dom.importFile.click());
  dom.importFile.addEventListener("change", importBackup);
  dom.manageTypesButton.addEventListener("click", openTypeSettings);
  dom.closeTypeSettingsButton.addEventListener("click", () => dom.typeSettingsDialog.close("cancel"));
  dom.typeSettingsForm.addEventListener("submit", saveCurrentTypeSettings);
  dom.resetTypeSettingsButton.addEventListener("click", resetCurrentTypeSettings);
  [dom.settingsTypeSelect, dom.settingsIconSelect, dom.settingsColorSelect, dom.settingsRankSelect]
    .forEach((select) => select.addEventListener("change", () => {
      if (select === dom.settingsTypeSelect) syncTypeSettingsForm();
      renderTypeSettingsPreview();
    }));

  dom.saveEditButton.addEventListener("click", saveEdit);
  dom.deleteTicketButton.addEventListener("click", deleteEditingTicket);
  dom.passwordForm.addEventListener("submit", verifyPassword);
  dom.passwordCancelButton.addEventListener("click", () => closePassword(false));
  dom.passwordDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePassword(false);
  });
  dom.confirmCancelButton.addEventListener("click", () => closeConfirm(false));
  dom.confirmOkButton.addEventListener("click", () => closeConfirm(true));

  [dom.addDialog, dom.editDialog, dom.typeSettingsDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close("cancel");
    });
  });
}

function openTypeSettings() {
  const types = [...new Set([...PRESET_TYPES, ...state.tickets.map((ticket) => ticket.type)])];
  dom.settingsTypeSelect.replaceChildren();
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    dom.settingsTypeSelect.appendChild(option);
  });
  dom.settingsIconSelect.replaceChildren();
  ICON_OPTIONS.forEach(({ key, label }) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    dom.settingsIconSelect.appendChild(option);
  });
  dom.settingsColorSelect.replaceChildren();
  COLOR_OPTIONS.forEach(({ key, label }) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    dom.settingsColorSelect.appendChild(option);
  });
  syncTypeSettingsForm();
  dom.typeSettingsDialog.showModal();
}

function syncTypeSettingsForm() {
  const type = dom.settingsTypeSelect.value;
  const theme = themeFor(type);
  dom.settingsIconSelect.value = theme.icon;
  dom.settingsColorSelect.value = theme.color;
  dom.settingsRankSelect.value = String(theme.rank);
  renderTypeSettingsPreview();
}

function renderTypeSettingsPreview() {
  const type = dom.settingsTypeSelect.value;
  if (!type) return;
  const temporarySettings = {
    ...state.typeSettings,
    [type]: {
      icon: dom.settingsIconSelect.value,
      color: dom.settingsColorSelect.value,
      rank: Number(dom.settingsRankSelect.value),
    },
  };
  const theme = resolveTypeTheme(type, temporarySettings);
  dom.settingsPreview.style.setProperty("--preview-accent", theme.accent);
  renderIcon(dom.settingsPreviewIcon, theme.icon);
  dom.settingsPreviewName.textContent = type;
  dom.settingsPreviewLevel.textContent = `等级 ${theme.rank}`;
}

function saveCurrentTypeSettings(event) {
  event.preventDefault();
  const type = dom.settingsTypeSelect.value;
  if (!type) return;
  state.typeSettings[type] = {
    icon: dom.settingsIconSelect.value,
    color: dom.settingsColorSelect.value,
    rank: Number(dom.settingsRankSelect.value),
  };
  saveTypeSettings(state.typeSettings);
  renderAll();
  dom.typeSettingsDialog.close("saved");
  showToast(`“${type}”的样式已保存`);
}

function resetCurrentTypeSettings() {
  const type = dom.settingsTypeSelect.value;
  if (!type) return;
  delete state.typeSettings[type];
  saveTypeSettings(state.typeSettings);
  syncTypeSettingsForm();
  renderAll();
  showToast(`“${type}”已恢复默认样式`);
}

function renderAll() {
  renderStats();
  renderTypeSummary();
  renderActivity();
  renderTabs();
  renderTickets();
}

function renderStats() {
  const used = state.tickets.filter((ticket) => ticket.status === "USED").length;
  dom.totalCount.textContent = String(state.tickets.length);
  dom.usedCount.textContent = String(used);
  dom.remainingCount.textContent = String(state.tickets.length - used);
}

function renderActivity() {
  const now = new Date();
  const inCurrentMonth = (value) => {
    if (!value) return false;
    const date = new Date(value);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  };
  dom.activityMonth.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  dom.monthAdded.textContent = String(state.tickets.filter((ticket) => inCurrentMonth(ticket.issuedAt)).length);
  dom.monthUsed.textContent = String(state.tickets.filter((ticket) => inCurrentMonth(ticket.usedAt)).length);
  dom.monthRemaining.textContent = String(state.tickets.filter((ticket) => ticket.status === "NEW").length);

  const recent = state.tickets
    .filter((ticket) => ticket.status === "USED" && ticket.usedAt)
    .sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt))
    .slice(0, 3);
  dom.recentList.replaceChildren();
  if (!recent.length) {
    const empty = document.createElement("div");
    empty.className = "recent-empty";
    empty.textContent = "还没有最近使用记录";
    dom.recentList.appendChild(empty);
    return;
  }
  recent.forEach((ticket) => {
    const theme = themeFor(ticket.type);
    const item = document.createElement("div");
    item.className = "recent-item";
    const main = document.createElement("div");
    main.className = "recent-item-main";
    const icon = document.createElement("span");
    icon.className = "recent-icon";
    icon.style.setProperty("--recent-accent", theme.accent);
    renderIcon(icon, theme.icon);
    const name = document.createElement("span");
    name.className = "recent-name";
    name.textContent = ticket.type;
    main.append(icon, name);
    const time = document.createElement("span");
    time.className = "recent-time";
    time.textContent = formatShortTime(ticket.usedAt);
    item.append(main, time);
    dom.recentList.appendChild(item);
  });
}

function renderTabs() {
  const fresh = state.tickets.filter((ticket) => ticket.status === "NEW").length;
  const used = state.tickets.length - fresh;
  dom.newTab.textContent = `未使用（${fresh}）`;
  dom.usedTab.textContent = `已使用（${used}）`;

  [[dom.newTab, "NEW"], [dom.usedTab, "USED"]].forEach(([button, status]) => {
    const active = state.status === status;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  dom.searchBox.hidden = state.status !== "USED";
}

function renderTypeSummary() {
  const counts = new Map();
  state.tickets
    .filter((ticket) => ticket.status === "NEW")
    .forEach((ticket) => counts.set(ticket.type, (counts.get(ticket.type) || 0) + 1));

  const entries = [...counts.entries()].sort((a, b) => rankFor(b[0]) - rankFor(a[0]) || a[0].localeCompare(b[0], "zh-CN"));
  dom.typeCountBadge.textContent = `${entries.length} 种`;
  dom.typeSummary.replaceChildren();

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-summary";
    empty.textContent = "背包里的券都用完啦";
    dom.typeSummary.appendChild(empty);
    return;
  }

  entries.forEach(([type, count]) => {
    const theme = themeFor(type);
    const tile = document.createElement("article");
    tile.className = "type-tile";
    applyTheme(tile, theme, true);

    const top = document.createElement("div");
    top.className = "type-tile-top";
    const icon = document.createElement("span");
    icon.className = "type-icon";
    renderIcon(icon, theme.icon);
    const number = document.createElement("strong");
    number.textContent = String(count);
    top.append(icon, number);

    const name = document.createElement("p");
    name.textContent = type;
    tile.append(top, name);
    dom.typeSummary.appendChild(tile);
  });
}

function renderTickets() {
  const filtered = state.tickets
    .filter((ticket) => ticket.status === state.status)
    .filter((ticket) => {
      if (!state.search) return true;
      return `${ticket.type} ${ticket.note}`.toLocaleLowerCase("zh-CN").includes(state.search);
    })
    .sort((a, b) => {
      const rankDifference = rankFor(b.type) - rankFor(a.type);
      if (rankDifference) return rankDifference;
      const typeDifference = a.type.localeCompare(b.type, "zh-CN");
      if (typeDifference) return typeDifference;
      const aTime = a.status === "USED" ? a.usedAt : a.issuedAt;
      const bTime = b.status === "USED" ? b.usedAt : b.issuedAt;
      return new Date(bTime) - new Date(aTime);
    });

  dom.ticketList.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const symbol = document.createElement("div");
    symbol.className = "empty-state-symbol";
    symbol.textContent = state.search ? "⌕" : "♡";
    const title = document.createElement("strong");
    title.textContent = state.search ? "没有找到这张券" : state.status === "NEW" ? "暂时没有未使用的券" : "还没有使用记录";
    const copy = document.createElement("p");
    copy.textContent = state.search ? "换一个关键词试试看" : state.status === "NEW" ? "点击上方按钮发放一张新券吧" : "用过的券会在这里留下时间";
    empty.append(symbol, title, copy);
    dom.ticketList.appendChild(empty);
    return;
  }

  filtered.forEach((ticket) => dom.ticketList.appendChild(createTicketCard(ticket)));
}

function createTicketCard(ticket) {
  const theme = themeFor(ticket.type);
  const card = document.createElement("article");
  card.className = `ticket-card${ticket.status === "USED" ? " is-used" : ""}`;
  card.dataset.ticketId = ticket.id;
  applyTheme(card, theme);

  const head = document.createElement("div");
  head.className = "ticket-card-head";

  const identity = document.createElement("div");
  identity.className = "ticket-identity";
  const icon = document.createElement("span");
  icon.className = "ticket-icon";
  icon.setAttribute("aria-hidden", "true");
  renderIcon(icon, theme.icon);
  const titleWrap = document.createElement("div");
  titleWrap.style.minWidth = "0";
  const title = document.createElement("h3");
  title.className = "ticket-name";
  title.textContent = ticket.type;
  const status = document.createElement("span");
  status.className = "ticket-status";
  status.textContent = ticket.status === "NEW" ? "可以使用" : "已经使用";
  titleWrap.append(title, status);
  identity.append(icon, titleWrap);

  head.appendChild(identity);
  if (ticket.status === "NEW") {
    const action = document.createElement("button");
    action.className = "ticket-main-action";
    action.type = "button";
    action.textContent = "使用";
    action.addEventListener("click", () => useTicket(ticket.id));
    head.appendChild(action);
  } else {
    const usedBadge = document.createElement("span");
    usedBadge.className = "used-badge";
    usedBadge.textContent = "已使用";
    head.appendChild(usedBadge);
  }

  const info = document.createElement("div");
  info.className = "ticket-info";
  const issued = document.createElement("span");
  issued.textContent = `发放：${formatTime(ticket.issuedAt)}`;
  info.appendChild(issued);
  if (ticket.usedAt) {
    const used = document.createElement("span");
    used.textContent = `使用：${formatTime(ticket.usedAt)}`;
    info.appendChild(used);
  }
  if (ticket.note) {
    const note = document.createElement("p");
    note.className = "ticket-note";
    note.textContent = `备注：${ticket.note}`;
    info.appendChild(note);
  }

  const footer = document.createElement("div");
  footer.className = "ticket-footer";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "text-button";
  editButton.textContent = "编辑详情";
  editButton.addEventListener("click", () => openEditDialog(ticket.id));
  footer.appendChild(editButton);

  card.append(head, info, footer);
  return card;
}

function openAddDialog() {
  state.selectedType = "";
  dom.customTypeInput.value = "";
  dom.noteInput.value = "";
  dom.quantityInput.value = "1";
  dom.customTypeWrap.hidden = true;
  dom.addFormError.textContent = "";
  renderTypePicker();
  dom.addDialog.showModal();
}

function renderTypePicker() {
  const previousTypes = state.tickets.map((ticket) => ticket.type);
  const types = [...new Set([...PRESET_TYPES, ...previousTypes])].slice(0, 11);
  dom.typePicker.replaceChildren();

  types.forEach((type) => {
    const theme = themeFor(type);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "type-choice";
    button.dataset.type = type;
    const icon = document.createElement("span");
    icon.className = "choice-icon";
    renderIcon(icon, theme.icon);
    const label = document.createElement("small");
    label.textContent = type;
    button.append(icon, label);
    button.addEventListener("click", () => selectType(type));
    dom.typePicker.appendChild(button);
  });

  const customButton = document.createElement("button");
  customButton.type = "button";
  customButton.className = "type-choice";
  customButton.dataset.type = "__custom__";
  const icon = document.createElement("span");
  icon.className = "choice-icon";
  icon.textContent = "＋";
  const label = document.createElement("small");
  label.textContent = "自定义";
  customButton.append(icon, label);
  customButton.addEventListener("click", () => selectType("__custom__"));
  dom.typePicker.appendChild(customButton);
}

function selectType(type) {
  state.selectedType = type;
  dom.typePicker.querySelectorAll(".type-choice").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.type === type);
  });
  dom.customTypeWrap.hidden = type !== "__custom__";
  dom.addFormError.textContent = "";
  if (type === "__custom__") dom.customTypeInput.focus();
}

function addTickets() {
  const type = state.selectedType === "__custom__" ? dom.customTypeInput.value.trim() : state.selectedType;
  const quantity = Number.parseInt(dom.quantityInput.value, 10);
  const note = dom.noteInput.value.trim();

  if (!type) {
    dom.addFormError.textContent = "请先选择一种券，或填写自定义名称。";
    return;
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    dom.addFormError.textContent = "发放数量需要在 1 到 99 之间。";
    return;
  }

  const issuedAt = new Date().toISOString();
  const additions = Array.from({ length: quantity }, () => ({
    id: createId(), type, note, status: "NEW", issuedAt, usedAt: null,
  }));
  state.tickets.push(...additions);
  persistAndRender();
  setStatus("NEW");
  dom.addDialog.close("saved");
  showToast(quantity === 1 ? `“${type}”已放进背包` : `${quantity} 张“${type}”已放进背包`);
}

async function useTicket(id) {
  const ticket = findTicket(id);
  if (!ticket || ticket.status !== "NEW") return;
  const accepted = await askPassword(ticket.type);
  if (!accepted) return;
  ticket.status = "USED";
  ticket.usedAt = new Date().toISOString();
  persistAndRender();
  showToast("已记录使用时间");
}

function askPassword(type) {
  if (passwordResolver) closePassword(false);
  dom.passwordMessage.textContent = `请输入 6 位数字密码，验证后才能使用“${type}”。`;
  dom.passwordInput.value = "";
  dom.passwordError.textContent = "";
  dom.passwordDialog.showModal();
  window.setTimeout(() => dom.passwordInput.focus(), 0);
  return new Promise((resolve) => { passwordResolver = resolve; });
}

function verifyPassword(event) {
  event.preventDefault();
  const value = dom.passwordInput.value;
  if (!/^\d{6}$/.test(value)) {
    dom.passwordError.textContent = "请输入完整的 6 位数字密码。";
    return;
  }
  if (value !== "004088") {
    dom.passwordError.textContent = "密码不正确，不能使用这张券。";
    dom.passwordInput.value = "";
    dom.passwordInput.focus();
    return;
  }
  closePassword(true);
}

function closePassword(result) {
  if (dom.passwordDialog.open) dom.passwordDialog.close(result ? "ok" : "cancel");
  const resolver = passwordResolver;
  passwordResolver = null;
  resolver?.(result);
}

function openEditDialog(id) {
  const ticket = findTicket(id);
  if (!ticket) return;
  state.editingId = id;
  dom.editTypeInput.value = ticket.type;
  dom.editNoteInput.value = ticket.note;
  dom.editFormError.textContent = "";
  dom.editDialog.showModal();
}

function saveEdit() {
  const ticket = findTicket(state.editingId);
  const type = dom.editTypeInput.value.trim();
  if (!ticket) return;
  if (!type) {
    dom.editFormError.textContent = "券名称不能为空。";
    return;
  }
  ticket.type = type;
  ticket.note = dom.editNoteInput.value.trim();
  persistAndRender();
  dom.editDialog.close("saved");
  showToast("票券信息已保存");
}

async function deleteEditingTicket() {
  const ticket = findTicket(state.editingId);
  if (!ticket) return;
  const accepted = await askConfirm({
    title: `删除“${ticket.type}”吗？`,
    message: "删除后无法撤销，建议先确认这不是仍需保留的记录。",
    okText: "确认删除",
    symbol: "!",
  });
  if (!accepted) return;
  state.tickets = state.tickets.filter((item) => item.id !== ticket.id);
  persistAndRender();
  dom.editDialog.close("deleted");
  showToast("这张券已删除");
}

function setStatus(status) {
  state.status = status;
  if (status === "NEW") {
    state.search = "";
    dom.searchInput.value = "";
  }
  renderTabs();
  renderTickets();
}

function persistAndRender() {
  saveTickets(state.tickets);
  renderAll();
}

function exportBackup() {
  const blob = new Blob([buildBackup(state.tickets, state.typeSettings)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `my-backpack-${fileTimestamp()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast(`已导出 ${state.tickets.length} 张票券`);
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  dom.importFile.value = "";
  if (!file) return;

  try {
    const imported = parseBackupBundle(JSON.parse(await file.text()));
    const accepted = await askConfirm({
      title: `导入 ${imported.tickets.length} 张票券？`,
      message: `导入会替换当前的 ${state.tickets.length} 张票券。建议先导出当前数据作为备份。`,
      okText: "确认导入",
      symbol: "⇣",
    });
    if (!accepted) return;
    state.tickets = imported.tickets;
    state.typeSettings = imported.typeSettings;
    state.status = "NEW";
    state.search = "";
    dom.searchInput.value = "";
    saveTypeSettings(state.typeSettings);
    persistAndRender();
    showToast(`成功导入 ${imported.tickets.length} 张票券`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "导入失败，请检查文件");
  }
}

function askConfirm({ title, message, okText, symbol }) {
  if (confirmResolver) closeConfirm(false);
  dom.confirmTitle.textContent = title;
  dom.confirmMessage.textContent = message;
  dom.confirmOkButton.textContent = okText;
  dom.confirmSymbol.textContent = symbol;
  dom.confirmDialog.showModal();
  return new Promise((resolve) => { confirmResolver = resolve; });
}

function closeConfirm(result) {
  dom.confirmDialog.close(result ? "ok" : "cancel");
  const resolver = confirmResolver;
  confirmResolver = null;
  resolver?.(result);
}

function showToast(message) {
  clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 2400);
}

function applyTheme(element, theme, tile = false) {
  if (tile) {
    element.style.setProperty("--tile-bg", theme.tileBg);
    element.style.setProperty("--tile-border", theme.tileBorder);
    element.style.setProperty("--tile-ink", theme.tileInk);
    return;
  }
  element.style.setProperty("--ticket-accent", theme.accent);
  element.style.setProperty("--ticket-soft", theme.soft);
}

function themeFor(type) {
  return resolveTypeTheme(type, state.typeSettings);
}

function rankFor(type) {
  return themeFor(type).rank;
}

function renderIcon(element, icon) {
  element.innerHTML = getIconSvg(icon);
}

function findTicket(id) {
  return state.tickets.find((ticket) => ticket.id === id);
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(value));
}

function formatShortTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(value));
}

function fileTimestamp() {
  const date = new Date();
  const part = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}-${part(date.getHours())}${part(date.getMinutes())}`;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("./service-worker.js").catch((error) => console.warn("离线缓存注册失败", error));
}

})();
