// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, migrateSave, validState, type Intent } from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import CorrespondencePanel from "../src/correspondence/CorrespondencePanel.vue";
import { actionReceipt } from "../src/action-feedback";
it("展开、回信、关注、筛选、导航与读档均经真实命令", async () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  const state = shallowRef(p.state),
    host = document.createElement("div");
  let serial = 0,
    destination = "";
  const app = createApp({
    render: () =>
      h(CorrespondencePanel, {
        game: state.value,
        busy: false,
        onNavigate: (v: string) => {
          destination = v;
        },
        onAct: (i: Intent) => {
          const before = state.value;
          state.value = dispatch(before, { ...i, id: `mail-ui-${++serial}` });
          expect(validState(state.value)).toBe(true);
          expect(actionReceipt(before, state.value, i)).toBeNull();
        },
      }),
  });
  app.mount(host);
  async function click(text: string) {
    const b = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    )!;
    expect(b, text).toBeTruthy();
    expect(b.disabled, text).toBe(false);
    b.click();
    await nextTick();
  }
  try {
    expect(host.textContent).toContain("1 封未读");
    expect(host.querySelector(".mail-card .mail-read-badge")?.textContent).toBe(
      "未读 1",
    );
    await click("照玄探府之约");
    expect(host.querySelector(".mail-card .mail-read-badge")?.textContent).toBe(
      "已读",
    );
    await click("已读 1");
    expect(host.querySelectorAll(".mail-card")).toHaveLength(1);
    await click("未读 0");
    expect(host.querySelectorAll(".mail-card")).toHaveLength(0);
    await click("全部 1");
    expect(host.textContent).toContain("0 封未读");
    expect(state.value.secretPact.stage).toBe("none");
    await click("暂且谢绝");
    expect(state.value.secretPact.stage).toBe("declined");
    await click("愿意同行");
    expect(state.value.secretPact.stage).toBe("promised");
    expect(host.querySelectorAll(".mail-card")).toHaveLength(1);
    expect(host.querySelectorAll(".mail-thread button")).toHaveLength(2);
    expect(
      state.value.correspondence.letters.find((l) => l.id === "pact:accepted")
        ?.read,
    ).toBe(false);
    expect(host.textContent).toContain("我的约定与关注会期");
    await click("记下此事");
    const select = host.querySelector("select")!;
    select.value = "followed";
    select.dispatchEvent(new Event("change"));
    await nextTick();
    expect(host.querySelectorAll(".mail-card")).toHaveLength(1);
    await click("查看地图与去路");
    expect(destination).toBe("world");
    const location = state.value.foundationJourney.location;
    state.value = migrateSave(JSON.parse(JSON.stringify(state.value)));
    await nextTick();
    expect(host.textContent).toContain("已关注");
    expect(host.querySelector(".mail-card .mail-read-badge")?.textContent).toBe(
      "未读 1",
    );
    expect(host.textContent).toContain("已约同行");
    expect(state.value.foundationJourney.location).toBe(location);
  } finally {
    app.unmount();
  }
});

it("主动写信保留已读发件，等待回音时禁用重复联络", async () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  const state = shallowRef(p.state),
    host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(CorrespondencePanel, {
        game: state.value,
        busy: false,
        onAct: (i: Intent) => {
          state.value = dispatch(state.value, {
            ...i,
            id: `personal-ui-${state.value.seen.length}`,
          });
        },
      }),
  });
  app.mount(host);
  try {
    const send = [...host.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "捎信报平安",
    )!;
    expect(send.disabled).toBe(false);
    send.click();
    await nextTick();
    expect(send.disabled).toBe(true);
    expect(host.textContent).toContain("信已寄出，尚在候回音");
    expect(host.textContent).toContain("1 封未读 · 2 封留存");
    expect(host.textContent).toContain("已寄出，候回音");
    expect(validState(state.value)).toBe(true);
    expect(migrateSave(JSON.parse(JSON.stringify(state.value)))).toEqual(
      state.value,
    );
  } finally {
    app.unmount();
    host.remove();
  }
});
