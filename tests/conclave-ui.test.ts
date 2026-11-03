// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, validState, type Intent } from "../src/core";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import { conclaveFoe } from "../src/conclave/rules";
import Panel from "../src/conclave/ConclavePanel.vue";
it("来信赴会、两胜入境、温养与深处取法均通过真实按钮提交命令", async () => {
  const s = shallowRef(conclaveCheckpoint());
  let serial = 0;
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Panel, {
        game: s.value,
        busy: false,
        onAct: (intent: Intent) => {
          const n = dispatch(s.value, {
            ...intent,
            id: `conclave-ui-${++serial}`,
          });
          expect(n).not.toBe(s.value);
          expect(validState(n)).toBe(true);
          s.value = n;
        },
      }),
  });
  app.mount(host);
  const click = async (text: string) => {
    const b = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    );
    expect(b).toBeTruthy();
    expect(b!.disabled).toBe(false);
    b!.click();
    await nextTick();
  };
  const fund = async (n: number) => {
    while (s.value.stones < n) await click("劳作半年");
  };
  const herbs = async (n: number) => {
    while (s.value.herbs < n) {
      await fund(8);
      await click("购置灵草");
    }
  };
  const fight = async () => {
    while (s.value.conclave.duel) {
      const move = conclaveFoe(s.value).pattern[
        s.value.conclave.duel.turn % 3
      ]!;
      await click(
        { guard: "守势 · 伤害", strike: "反击 · 伤害", discern: "辨影 · 伤害" }[
          move
        ],
      );
    }
  };
  try {
    expect(host.textContent).toContain("会期还有");
    await click("留居候会");
    await click("循道友来信");
    await click("与各宗来客");
    await fund(12);
    await herbs(16);
    await click("随顾沧遥");
    await click("登台争取");
    await fight();
    await click("登台争取");
    await fight();
    expect(s.value.conclave.wins).toBe(2);
    expect(host.textContent).toContain("自愿争优");
    await click("背潮石道");
    await fund(10);
    await click("筹备归潮");
    await click("循已知路线");
    await click("应对守阵");
    await fight();
    expect(s.value.conclave.depth).toBe(1);
    await fund(18);
    await click("温养定神珠");
    await fund(10);
    await herbs(8);
    await click("筹备归潮");
    await click("循已知路线");
    await click("应对守阵");
    await fight();
    expect(s.value.conclave.depth).toBe(2);
    await click("参悟抱元录");
    expect(s.value.conclave.method).toBe("inherit");
    expect(host.textContent).toContain("尚未炼成丹药");
    expect(host.textContent).toContain("抱元凝神录");
  } finally {
    app.unmount();
  }
});
