import assert from "node:assert/strict";
import { test } from "node:test";
import { mintDraftId, overLimit, sameOrigin, signedDraftId } from "./guard";

process.env.DESK_SECRET = "test-secret";

test("minted draft ids pass and invented ones fail", () => {
  const id = mintDraftId();
  assert.match(id, /^[a-f0-9]{24}$/);
  assert.equal(signedDraftId(id), true);
  assert.equal(signedDraftId("a".repeat(24)), false);
  const flipped = id.slice(0, 23) + (id[23] === "0" ? "1" : "0");
  assert.equal(signedDraftId(flipped), false);
  assert.equal(signedDraftId(undefined), false);
});

test("a POST from another site is refused", () => {
  const from = (origin: string | null) =>
    new Request("https://desk.example/api/chat", {
      method: "POST",
      headers: origin ? { origin, host: "desk.example" } : { host: "desk.example" },
    });
  assert.equal(sameOrigin(from("https://desk.example")), true);
  assert.equal(sameOrigin(from("https://evil.example")), false);
  assert.equal(sameOrigin(from(null)), true);
});

test("the limiter stops a caller after the limit", () => {
  const key = `t:${Math.random()}`;
  for (let i = 0; i < 3; i += 1) assert.equal(overLimit(key, 3, 1000, 0), false);
  assert.equal(overLimit(key, 3, 1000, 0), true);
  assert.equal(overLimit(key, 3, 1000, 2000), false);
});
