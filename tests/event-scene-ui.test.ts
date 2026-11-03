// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it, vi } from "vitest";
import EventScene from "../src/scene2d/EventScene.vue";

const first = {
  image: "/scenes/sect-arena.png",
  title: "山门来信",
  speaker: "传信同门",
  body: "同门递来一封信。山门的比试将近！信尾还写着各自的约定。你可以先问清来意。",
};

function mountScene() {
  const event = shallowRef(first);
  const choose = vi.fn();
  const host = document.body.appendChild(document.createElement("div"));
  const choices = [
    { id: "ask", label: "问清来意", cost: "不耗月份" },
    { id: "prepare", label: "准备赴约", cost: "灵草 2、一月" },
    { id: "decline", label: "暂不参加", cost: "错过本次比试，保留已有成果" },
  ];
  const app = createApp({
    render: () =>
      h(EventScene, event.value, {
        default: () =>
          choices.map((choice) =>
            h(
              "button",
              {
                class: "choice",
                "data-choice": choice.id,
                onClick: () => choose(choice.id),
              },
              [choice.label, h("small", choice.cost)],
            ),
          ),
      }),
  });
  app.mount(host);
  return {
    event,
    host,
    choose,
    choices,
    dispose: () => {
      app.unmount();
      host.remove();
    },
  };
}

it("collapses long narrative without hiding any choices, costs or consequences; reading never submits a choice", async () => {
  const { host, choose, choices, dispose } = mountScene();
  try {
    expect(host.querySelector(".event-voice")?.textContent).toContain(
      "同门递来一封信。山门的比试将近！",
    );
    expect(host.querySelector(".event-voice")?.textContent).not.toContain(
      "信尾还写着",
    );
    const read = host.querySelector<HTMLButtonElement>(".event-read")!;
    expect(read.getAttribute("aria-expanded")).toBe("false");
    const assertChoices = () => {
      const buttons = [
        ...host.querySelectorAll<HTMLButtonElement>(
          '[aria-label="剧情选择操作区"] button',
        ),
      ];
      expect(buttons).toHaveLength(choices.length);
      choices.forEach((choice, index) => {
        expect(buttons[index]!.textContent).toContain(choice.label);
        expect(buttons[index]!.textContent).toContain(choice.cost);
        expect(buttons[index]!.disabled).toBe(false);
        expect(
          buttons[index]!.closest("[hidden], [inert], details:not([open])"),
        ).toBeNull();
      });
    };
    assertChoices();
    read.click();
    await nextTick();
    expect(read.getAttribute("aria-expanded")).toBe("true");
    expect(host.querySelector(".event-voice")?.textContent).toContain(
      first.body,
    );
    expect(choose).not.toHaveBeenCalled();
    assertChoices();
    read.click();
    await nextTick();
    expect(host.querySelector(".event-voice")?.textContent).not.toContain(
      "信尾还写着",
    );
    expect(choose).not.toHaveBeenCalled();
    assertChoices();
    for (const choice of choices) {
      host
        .querySelector<HTMLButtonElement>(`[data-choice="${choice.id}"]`)!
        .click();
    }
    expect(choose.mock.calls).toEqual(choices.map((choice) => [choice.id]));
  } finally {
    dispose();
  }
});

it.each(["different title", "same title"])(
  "resets expanded prose when another event arrives (%s)",
  async (kind) => {
    const { event, host, choose, dispose } = mountScene();
    try {
      host.querySelector<HTMLButtonElement>(".event-read")!.click();
      await nextTick();
      expect(
        host.querySelector(".event-read")?.getAttribute("aria-expanded"),
      ).toBe("true");
      event.value = {
        ...first,
        title: kind === "same title" ? first.title : "渡口口信",
        body: "渡船在岸边停下。来客收起油伞。第三句属于另一件事。新的去向需要慢慢说清。",
      };
      await nextTick();
      expect(
        host.querySelector(".event-read")?.getAttribute("aria-expanded"),
      ).toBe("false");
      expect(host.querySelector(".event-voice")?.textContent).toContain(
        "渡船在岸边停下。来客收起油伞。",
      );
      expect(host.querySelector(".event-voice")?.textContent).not.toContain(
        "第三句属于另一件事",
      );
      expect(
        host.querySelectorAll('[aria-label="剧情选择操作区"] button'),
      ).toHaveLength(3);
      expect(choose).not.toHaveBeenCalled();
    } finally {
      dispose();
    }
  },
);

it("keeps a short event complete without an unnecessary expand step", async () => {
  const { event, host, choose, dispose } = mountScene();
  try {
    event.value = {
      ...first,
      title: "简短口信",
      body: "渡船已到。现在可以出发。",
    };
    await nextTick();
    expect(host.querySelector(".event-voice")?.textContent).toContain(
      event.value.body,
    );
    expect(host.querySelector(".event-read")).toBeNull();
    expect(
      host.querySelectorAll('[aria-label="剧情选择操作区"] button'),
    ).toHaveLength(3);
    expect(choose).not.toHaveBeenCalled();
  } finally {
    dispose();
  }
});

it("returns keyboard focus to the new event heading without choosing again", async () => {
  const { event, host, choose, dispose } = mountScene();
  try {
    const choice = host.querySelector<HTMLButtonElement>(
      '[data-choice="ask"]',
    )!;
    choice.focus();
    choice.click();
    event.value = {
      ...first,
      title: "同门告别",
      body: "同门拱手辞行。路上的人渐渐散去。",
    };
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(host.querySelector("#modal-title"));
    expect(choose.mock.calls).toEqual([["ask"]]);
    expect(host.querySelector("#modal-title")?.textContent).toBe("同门告别");
  } finally {
    dispose();
  }
});

it("does not steal focus from a separate foreground control when an event updates", async () => {
  const { event, host, dispose } = mountScene();
  const control = document.body.appendChild(document.createElement("button"));
  try {
    control.focus();
    event.value = { ...first, title: "另一封来信" };
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(control);
    expect(host.querySelector("#modal-title")?.textContent).toBe("另一封来信");
  } finally {
    control.remove();
    dispose();
  }
});

it("preserves quotation punctuation and links the reading control to its prose", async () => {
  const { event, host, choose, dispose } = mountScene();
  try {
    event.value = {
      ...first,
      body: "同门道：“一路顺风！”你拱手道别。余下的路还很长。",
    };
    await nextTick();
    const read = host.querySelector<HTMLButtonElement>(".event-read")!;
    const prose = host.querySelector(".event-prose")!;
    expect(read.getAttribute("aria-controls")).toBe(prose.id);
    expect(prose.textContent).toBe("同门道：“一路顺风！”你拱手道别。");
    read.click();
    await nextTick();
    expect(prose.textContent).toBe(event.value.body);
    expect(choose).not.toHaveBeenCalled();
  } finally {
    dispose();
  }
});

it("a collapsed scene never cuts a speaker in the middle of a multi-sentence quotation", async () => {
  const { event, host, dispose } = mountScene();
  try {
    event.value = { ...first, body: '山门外的雪还没化，陆迟已经把药包放在桌上。“上回是你帮我。这次，换我。”他推过药包。' };
    await nextTick();
    expect(host.querySelector('.event-prose')?.textContent).toBe('山门外的雪还没化，陆迟已经把药包放在桌上。“上回是你帮我。这次，换我。”');
  } finally { dispose(); }
});
