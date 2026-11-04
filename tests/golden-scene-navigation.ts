import { nextTick } from "vue";
import { expect } from "vitest";
/** Follow the same visible object -> action path as a player. */
export async function clickSceneAction(host: HTMLElement, label: string) {
  const find = () =>
    [
      ...host.querySelectorAll<HTMLButtonElement>(
        ".narrative-inspector button, .combat-bar button",
      ),
    ].find((button) => button.textContent?.includes(label.split(" · ")[0]!));
  let button = find();
  if (!button) {
    const points = [
      ...host.querySelectorAll<HTMLButtonElement>("[data-hotspot]"),
    ];
    for (const point of points) {
      point.click();
      await nextTick();
      button = find();
      if (button) break;
    }
  }
  expect(button, `scene action: ${label}`).toBeTruthy();
  expect(button!.disabled).toBe(false);
  const details = button!.closest("details");
  if (details && !details.open) {
    details.querySelector("summary")?.click();
    await nextTick();
  }
  button!.click();
  await nextTick();
}
export async function openSceneNotes(host: HTMLElement) {
  const button = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => (b.getAttribute("aria-label") ?? b.textContent ?? "").replace(/\s+/g, " ").trim() === "此地见闻",
  );
  expect(button, "此地见闻入口应存在").toBeTruthy();
  expect(button!.disabled, "此地见闻入口应可操作").toBe(false);
  button!.click();
  await nextTick();
  expect(host.querySelector('.narrative-notes[aria-label="此地见闻"]'), "点击后应展开此地见闻").not.toBeNull();
}
