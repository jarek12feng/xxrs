import { performance } from "node:perf_hooks";
import { createGame } from "../src/core";
import { deliverMessages } from "../src/correspondence/rules";
/** Synthetic archive stress check; no UI/playthrough claim. */
for (const size of [0, 100, 1000]) {
  const state = createGame("传讯压测", "wood", 42);
  state.correspondence.letters = Array.from({ length: size }, (_, i) => ({
    id: `benchmark:${i}`,
    kind: "news" as const,
    sender: "测试记录",
    reliability: "public" as const,
    title: "归档压力样本",
    body: "仅用于测量旧信克隆与送达去重开销。".repeat(8),
    received: 0,
    read: true,
    followed: false,
    response: "none" as const,
    destination: "world" as const,
    expires: null,
  }));
  for (let i = 0; i < 20; i++) deliverMessages(structuredClone(state));
  const started = performance.now();
  for (let i = 0; i < 300; i++) deliverMessages(structuredClone(state));
  console.log(
    JSON.stringify({
      letters: size,
      iterations: 300,
      meanDraftAndDeliveryMs: Number(
        ((performance.now() - started) / 300).toFixed(3),
      ),
      archiveBytes: Buffer.byteLength(JSON.stringify(state.correspondence)),
    }),
  );
}
