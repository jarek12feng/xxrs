// Geographic realms are independent of cultivation levels (State.realm).
// Only implemented realm maps belong here; undiscovered realms are not UI tabs.
export const currentWorldId = "qingxuan";
export const worldMaps = {
  qingxuan: {
    name: "青玄界",
    image: "/scenes/cultivation-world-atlas.png",
    overview:
      "听松山是你道途的起点。药路越过青嶂，雾岭通往海边；雪域、古墟与仙岛，也在这一界的山河之中。",
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
    ],
    distant: [
      {
        name: "昆仑雪域",
        x: 23,
        y: 22,
        detail: "本界远方的雪山地域；目前只在图上标名。",
      },
      {
        name: "太虚古墟",
        x: 53,
        y: 19,
        detail: "本界远方的古墟地域；来历与通路尚待后续展开。",
      },
      {
        name: "蓬莱仙境",
        x: 81,
        y: 25,
        detail: "青玄界外海群岛，常年隐于云雾。",
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
    label: "雨夜渡口",
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
