import test from "node:test";
import assert from "node:assert/strict";
import { parseHashRoute, createRouteGuard } from "../public/product-view.js";
const keys = ["first", "second"];
const id = "00000000-0000-4000-8000-000000000001";
test("public fragment changes are parsed independently of prior form or receipt", () => {
  assert.deepEqual(parseHashRoute("#public=" + id, keys), {
    kind: "public",
    id,
  });
  assert.deepEqual(parseHashRoute("#public=" + id + "&section=second", keys), {
    kind: "public",
    id,
  });
  assert.deepEqual(parseHashRoute("#public=another-id", keys), {
    kind: "public",
    id: "another-id",
  });
});
test("workspace history resolves valid sections without treating unknown hashes as public", () => {
  assert.deepEqual(parseHashRoute("#section=second", keys), {
    kind: "workspace",
    section: "second",
  });
  assert.deepEqual(parseHashRoute("#section=missing", keys), {
    kind: "workspace",
    section: null,
  });
  assert.deepEqual(parseHashRoute("", keys), {
    kind: "workspace",
    section: null,
  });
  assert.deepEqual(parseHashRoute("#public=", keys), {
    kind: "public",
    id: "",
  });
});
test("later navigation invalidates pending form loads, receipts and error feedback", async () => {
  const guard = createRouteGuard(),
    painted = [];
  let finishOld;
  const oldResult = new Promise((resolve) => (finishOld = resolve));
  const oldRoute = guard.next();
  const pending = oldResult.then(() => {
    if (guard.isCurrent(oldRoute)) painted.push("old form/receipt");
  });
  const currentRoute = guard.next();
  if (guard.isCurrent(currentRoute)) painted.push("current form");
  finishOld();
  await pending;
  assert.deepEqual(painted, ["current form"]);
  assert.equal(guard.isCurrent(oldRoute), false);
  assert.equal(guard.current(), currentRoute);
  const workspaceRoute = guard.next();
  assert.equal(guard.isCurrent(currentRoute), false);
  assert.equal(guard.isCurrent(workspaceRoute), true);
});
