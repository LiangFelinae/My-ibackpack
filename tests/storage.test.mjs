import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

await import("../js/config.js");
await import("../js/storage.js");
const { parseBackup, parseBackupBundle, buildBackup } = globalThis.BackpackStorage;
const { getTypeTheme, getTypeRank, getIconSvg, resolveTypeTheme } = globalThis.BackpackConfig;

const backupPath = new URL("../private-backups/my-backpack-20260702-1627.json", import.meta.url);
const source = JSON.parse(await readFile(backupPath, "utf8"));
const tickets = parseBackup(source);

assert.equal(tickets.length, 53, "应完整保留 53 张票券");
assert.equal(tickets.filter((ticket) => ticket.status === "NEW").length, 17, "未使用数量应为 17");
assert.equal(tickets.filter((ticket) => ticket.status === "USED").length, 36, "已使用数量应为 36");
assert.equal(tickets.find((ticket) => ticket.type === "美食劵")?.note, "遥遥的特色家宴", "应原样保留历史名称与备注");
assert.equal(tickets.find((ticket) => ticket.id === "9f03bc61-f8f6-4fe7-88f4-193e317c0bdb")?.type, "和好券");
assert.equal(getTypeTheme("和好券").icon, "heart");
assert.equal(getTypeTheme("按摩券").icon, "massage");
assert.equal(getTypeTheme("亲亲券").icon, "kiss");
assert.match(getIconSvg("heart"), /icon-fill/);
assert.ok(getTypeRank("和好券") > getTypeRank("按摩券"), "等级排序应把和好券放在按摩券之前");
assert.equal(resolveTypeTheme("自定义券", { "自定义券": { icon: "gift", color: "purple", rank: 5 } }).rank, 5);

const upgradedBackup = JSON.parse(buildBackup(tickets, { "自定义券": { icon: "gift", color: "purple", rank: 5 } }));
const upgradedBundle = parseBackupBundle(upgradedBackup);
assert.equal(upgradedBundle.tickets.length, 53);
assert.deepEqual(upgradedBundle.typeSettings["自定义券"], { icon: "gift", color: "purple", rank: 5 });

assert.throws(() => parseBackup({ nope: [] }), /不是票券数组/);
assert.throws(() => parseBackup([{ type: "坏数据" }]), /无效记录/);

console.log("storage.test.mjs: 53 条真实备份数据验证通过");
