// Geographic realms are independent of cultivation levels (State.realm).
// Only implemented realm maps belong here; undiscovered realms are not UI tabs.
export const currentWorldId = "qingxuan";
export const worldMaps = {
  qingxuan: {
    name: "青玄界",
    image: "/scenes/cultivation-world-atlas.png",
    overview:
      "从听松药坪、石涧药窟、青嶂与雾海旧路，到无名渡、晴川、雪线与古道支脉的照玄遗府；穿过云壁，外海潮路连着诸宗会谷、归潮秘境与离照洞天。",
    regions: [
      {
        name: "听松山及山下药路",
        detail: "山门、药庐与回春谷，是修行和行路的起点。",
        status: "已有行旅",
      },
      {
        name: "青嶂关与云栈",
        detail: "坊市、行营、山关与旅亭相连，准备之后才能走通险路。",
        status: "已有行旅",
      },
      {
        name: "雾岭与雾海",
        detail: "古道通向海边，旧药圃、废驿与回声阵仍待亲历。",
        status: "已有行旅",
      },
      {
        name: "筑基内陆六地",
        detail:
          "听松行前居、无名渡、晴川药庄、雪线旧门、听雨旅亭与云外古道相连。听雨旅亭不是青嶂的云栈旅亭。",
        status: "随筑基行旅展开",
      },
      {
        name: "穿云壁与外海",
        detail:
          "穿云壁通向外海古渡；穿云壁外，海潮隔开诸岛。先向熟悉潮路的人问明去向，再循路远行。",
        status: "随金丹行旅展开",
      },
    ],
  },
} as const;
export const currentWorldMap = worldMaps[currentWorldId];

// Stable physical locations. Chapter scenes can share a location; their IDs are
// resolved by the read-only landmark projection, never by changing game state.
export const qingxuanLandmarks = [
  {
    key: "home",
    label: "听松归路",
    x: 12,
    y: 42,
    scene: "home",
    chapter: "adventure",
  },
  {
    key: "apothecary",
    label: "山门药庐",
    x: 12,
    y: 63,
    scene: "apothecary",
    chapter: "adventure",
  },
  {
    key: "ferry",
    label: "听松渡口",
    x: 12,
    y: 84,
    scene: "ferry",
    chapter: "adventure",
  },
  {
    key: "shrine",
    label: "旧日山祠",
    x: 30,
    y: 63,
    scene: "shrine",
    chapter: "adventure",
  },
  {
    key: "forest",
    label: "雾林旧道",
    x: 30,
    y: 84,
    scene: "forest",
    chapter: "adventure",
  },
  {
    key: "pass",
    label: "青嶂关",
    x: 48,
    y: 42,
    scene: "pass",
    chapter: "road",
  },
  {
    key: "camp",
    label: "山口行营",
    x: 48,
    y: 63,
    scene: "camp",
    chapter: "road",
  },
  {
    key: "market",
    label: "山下坊市",
    x: 48,
    y: 84,
    scene: "market",
    chapter: "road",
  },
  {
    key: "lookout",
    label: "云栈旅亭",
    x: 66,
    y: 42,
    scene: "lookout",
    chapter: "road",
  },
  {
    key: "mist-camp",
    label: "雾海营地",
    x: 66,
    y: 63,
    scene: "camp",
    chapter: "mist",
  },
  {
    key: "garden",
    label: "旧药圃",
    x: 66,
    y: 84,
    scene: "garden",
    chapter: "mist",
  },
  {
    key: "gate",
    label: "雾海回声阵",
    x: 86,
    y: 42,
    scene: "gate",
    chapter: "mist",
  },
  {
    key: "station",
    label: "雾海废驿",
    x: 86,
    y: 63,
    scene: "station",
    chapter: "mist",
  },
  {
    key: "archive",
    label: "旧驿灯室",
    x: 86,
    y: 84,
    scene: "archive",
    chapter: "mist",
  },
] as const;
export type QingxuanLandmark = (typeof qingxuanLandmarks)[number]["key"];
export const qingxuanPaths: readonly (readonly [
  QingxuanLandmark,
  QingxuanLandmark,
])[] = [
  ["ferry", "apothecary"],
  ["apothecary", "forest"],
  ["forest", "shrine"],
  ["shrine", "home"],
  ["apothecary", "market"],
  ["market", "camp"],
  ["camp", "pass"],
  ["pass", "lookout"],
  ["lookout", "mist-camp"],
  ["mist-camp", "garden"],
  ["mist-camp", "station"],
  ["garden", "gate"],
  ["station", "gate"],
  ["gate", "archive"],
];
