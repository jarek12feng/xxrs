import { describe, expect, it, vi } from "vitest";
import type Phaser from "phaser";
import { createActionPlayer } from "../src/scene2d/action-player";
import type { ActionSnapshot } from "../src/scene2d/action-sequence";
vi.mock("phaser", () => ({ default: {} }));

const idle: ActionSnapshot = {
  prepared: false,
  rescued: false,
  method: "medicine",
};
function actor() {
  return {
    visible: true,
    height: 220,
    destroyed: false,
    texture: "hero",
    frame: 0,
    setVisible(value: boolean) {
      this.visible = value;
      return this;
    },
    setTexture(value: string, frame = 0) {
      this.texture = value;
      this.frame = frame;
      return this;
    },
    setPosition: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    destroy() {
      this.destroyed = true;
    },
  };
}
function harness(initial = idle, art = true, reduced = false) {
  type Timer = {
    callback: () => void;
    removed: boolean;
    remove: (dispatch: boolean) => void;
  };
  const timers: Timer[] = [];
  const hero = actor(),
    worker = actor(),
    shadow = actor();
  worker.visible = initial.rescued;
  const images: ReturnType<typeof actor>[] = [];
  let saved = initial;
  const restore = vi.fn(() => {
    worker.setVisible(saved.rescued);
    hero.setTexture("hero");
  });
  const onCaption = vi.fn();
  const scene = {
    textures: { exists: () => art },
    tweens: { killTweensOf: vi.fn() },
    add: {
      image: () => {
        const image = actor();
        images.push(image);
        return image;
      },
    },
    time: {
      delayedCall: (_delay: number, callback: () => void) => {
        const timer: Timer = {
          callback,
          removed: false,
          remove() {
            this.removed = true;
          },
        };
        timers.push(timer);
        return timer;
      },
    },
  };
  const player = createActionPlayer(scene as unknown as Phaser.Scene, {
    initial,
    reduced,
    width: 1280,
    height: 720,
    unit: 1,
    sceneKey: "shrine",
    hero: hero as unknown as Phaser.GameObjects.Sprite,
    worker: worker as unknown as Phaser.GameObjects.Image,
    shadow: shadow as unknown as Phaser.GameObjects.Ellipse,
    restore,
    onCaption,
  });
  const sync = (next: ActionSnapshot) => {
    saved = next;
    worker.visible = next.rescued;
    player.sync(next);
  };
  const tick = () => {
    const timer = timers.find((t) => !t.removed);
    if (timer) {
      timer.removed = true;
      timer.callback();
    }
  };
  return {
    player,
    hero,
    worker,
    shadow,
    images,
    timers,
    restore,
    onCaption,
    sync,
    tick,
  };
}
describe("opening action player", () => {
  it("leaves actors alone until a new persisted outcome arrives", () => {
    const h = harness();
    h.player.sync({ ...idle });
    expect(h.hero.visible).toBe(true);
    expect(h.images).toHaveLength(0);
    expect(h.timers).toHaveLength(0);
    h.sync({ ...idle, prepared: true });
    expect(h.hero.visible).toBe(false);
    expect(h.shadow.visible).toBe(false);
    expect(h.onCaption).toHaveBeenLastCalledWith("取药");
    h.player.sync({ ...idle, prepared: true });
    expect(h.images).toHaveLength(1);
    expect(h.timers.filter((t) => !t.removed)).toHaveLength(1);
  });
  it("skip cancels both sequence and seal-detail timers and restores actors", () => {
    const h = harness();
    h.sync({ ...idle, prepared: true });
    h.tick();
    h.tick();
    expect(h.onCaption).toHaveBeenLastCalledWith("封装");
    expect(h.timers.filter((t) => !t.removed)).toHaveLength(2);
    h.player.skip();
    expect(h.timers.every((t) => t.removed)).toBe(true);
    expect(h.images[0]?.destroyed).toBe(true);
    expect(h.hero.visible).toBe(true);
    expect(h.shadow.visible).toBe(true);
    expect(h.restore).toHaveBeenLastCalledWith("medicine", "skipped");
    expect(h.onCaption).toHaveBeenLastCalledWith("");
  });
  it("rescue hides the saved worker until final appearance is restored on skip", () => {
    const h = harness();
    h.sync({ ...idle, rescued: true });
    expect(h.hero.visible).toBe(false);
    expect(h.worker.visible).toBe(false);
    h.tick();
    h.tick();
    expect(h.timers.filter((t) => !t.removed)).toHaveLength(2);
    h.player.skip();
    expect(h.worker.visible).toBe(true);
    expect(h.hero.visible).toBe(true);
    expect(h.timers.every((t) => t.removed)).toBe(true);
  });
  it("dispose releases both timers and prevents further presentation", () => {
    const h = harness();
    h.sync({ ...idle, rescued: true });
    h.tick();
    h.tick();
    h.player.dispose();
    expect(h.timers.every((t) => t.removed)).toBe(true);
    expect(h.images[0]?.destroyed).toBe(true);
    expect(h.hero.visible).toBe(true);
    expect(h.worker.visible).toBe(true);
    expect(h.restore).toHaveBeenCalledTimes(1);
    expect(h.restore).toHaveBeenLastCalledWith("rescue", "disposed");
    const count = h.restore.mock.calls.length;
    h.player.dispose();
    h.player.sync({ ...idle, prepared: true });
    expect(h.restore).toHaveBeenCalledTimes(count);
    expect(h.images).toHaveLength(1);
  });
  it("does not hide the main character when action art is unavailable", () => {
    const h = harness(idle, false);
    h.sync({ ...idle, prepared: true });
    expect(h.hero.visible).toBe(true);
    expect(h.shadow.visible).toBe(true);
    expect(h.images).toHaveLength(0);
    expect(h.onCaption).toHaveBeenLastCalledWith("取药");
    h.player.skip();
  });
  it("keeps the saved worker visible when rescue animation art is unavailable", () => {
    const h = harness(idle, false);
    h.sync({ ...idle, rescued: true });
    expect(h.hero.visible).toBe(true);
    expect(h.worker.visible).toBe(true);
    expect(h.images).toHaveLength(0);
    h.player.skip();
  });
  it("restored completed saves never start the action", () => {
    const saved = { ...idle, prepared: true, rescued: true };
    const h = harness(saved);
    h.player.sync({ ...saved });
    expect(h.hero.visible).toBe(true);
    expect(h.worker.visible).toBe(true);
    expect(h.timers).toHaveLength(0);
    expect(h.images).toHaveLength(0);
    expect(h.restore).not.toHaveBeenCalled();
  });
  it("reduced motion directly restores the final result without hiding actors", () => {
    const h = harness(idle, true, true);
    h.sync({ ...idle, rescued: true });
    expect(h.hero.visible).toBe(true);
    expect(h.worker.visible).toBe(true);
    expect(h.images).toHaveLength(0);
    expect(h.timers).toHaveLength(0);
    expect(h.restore).toHaveBeenCalledWith("rescue", "reduced");
  });
});
