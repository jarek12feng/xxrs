import { describe, expect, it } from "vitest";
import { approachPoint, approachDuration, groundScale, coveredArtworkPoint } from "../src/scene2d/stage-geometry";

describe("scene approach staging", () => {
  it("keeps approach destinations on the visible foreground at PC sizes", () => {
    for (const [width, height] of [[1280, 720], [1920, 1080], [2560, 1440]]) {
      for (const [x, y] of [[0, 0], [100, 100], [51, 38]]) {
        const point = approachPoint(width!, height!, x!, y!);
        expect(point.x).toBeGreaterThanOrEqual(width! * .07);
        expect(point.x).toBeLessThanOrEqual(width! * .93);
        expect(point.y).toBeGreaterThanOrEqual(height! * .58);
        expect(point.y).toBeLessThanOrEqual(height! * .9);
      }
    }
  });
  it("gives nearby approaches less waiting and bounds distant ones", () => {
    expect(approachDuration(80, 1)).toBeLessThan(approachDuration(300, 1));
    expect(approachDuration(9000, 1)).toBe(650);
    expect(approachDuration(300, 1)).toBe(approachDuration(600, 2));
  });
  it("makes foreground actors larger without unbounded scaling", () => {
    expect(groundScale(800, 1000)).toBeGreaterThan(groundScale(500, 1000));
    expect(groundScale(-500, 1000)).toBe(.72);
    expect(groundScale(5000, 1000)).toBe(1.12);
  });
});

it.each([[1280,720],[319,669],[1920,1080]])("keeps the forest entry attached to the painted stone road at %s x %s", (width,height) => {
  const point = coveredArtworkPoint(width,height,1672,941,{x:56,y:84});
  const scale = Math.max(width/1672,height/941);
  // Invert the crop: both wide and narrow windows must stand on the same art pixel.
  expect((point.x-width/2)/scale+1672/2).toBeCloseTo(1672*.56);
  expect((point.y-height/2)/scale+941/2).toBeCloseTo(941*.84);
  expect(point.x).toBeGreaterThan(0);
  expect(point.x).toBeLessThan(width);
  expect(point.y).toBeLessThan(height);
});
