/** Authored 2026-11-03 from the current story. Coordinates are schematic;
 * distances are explicit game design, never measured from artwork. */
export const worldRegions = [
  {
    id: "tingsong",
    name: "听松山及近郊",
    scope: "炼气起行",
    detail:
      "听松渡口、药庐、雾林与山祠属于近郊短途；石涧药窟承接淬脉后的历练，青嶂关与支路承接出山。",
  },
  {
    id: "inland",
    name: "青玄内陆",
    scope: "筑基远行",
    detail:
      "无名渡衔接三地药路；晴川药庄、雪线旧门、听雨旅亭与云外古道各有去向，断碑驿在古道途中，照玄遗府位于古道支脉。",
  },
  {
    id: "coast",
    name: "穿云壁与外海",
    scope: "金丹远行",
    detail:
      "穿云壁兑现金丹能力，外海古渡接两层退潮遗迹；古渡来信引向诸宗会谷；后期循潮路赴离照洞天，伏潮湾承接真实分配争议。",
  },
] as const;
export const goldenAuctionRoute = {months:2,distance:12000} as const;
export const worldStoryPlaces = [
  {id:"guild",name:"沧澜会馆",region:"coast",parent:null},
  {id:"golden-auction",name:"沧澜金丹拍卖厅",region:"coast",parent:"guild"},
  { id: "market-auction", name: "坊市拍卖行", region: "tingsong", parent: "market" },
  { id: "foundation-auction", name: "晴川交易院", region: "inland", parent: "estate" },
  { id: "opening-ferry", name: "听松渡口", region: "tingsong", parent: null },
  { id: "apothecary", name: "山门药庐", region: "tingsong", parent: null },
  { id: "forest", name: "雾林旧道", region: "tingsong", parent: null },
  { id: "shrine", name: "废弃山祠", region: "tingsong", parent: null },
  { id: "medicine-court", name: "山门药坪", region: "tingsong", parent: "apothecary" },
  { id: "stone-cave", name: "石涧旧药窟", region: "tingsong", parent: "home" },
  { id: "qingzhang-branch", name: "青嶂支路", region: "tingsong", parent: "pass" },
  { id: "market", name: "山下坊市", region: "tingsong", parent: null },
  { id: "pass", name: "青嶂关", region: "tingsong", parent: null },
  { id: "lookout", name: "云栈旅亭", region: "tingsong", parent: null },
  { id: "home", name: "听松行前居", region: "tingsong", parent: null },
  { id: "ferry", name: "无名渡", region: "inland", parent: null },
  { id: "well", name: "沉井修行院", region: "inland", parent: "ferry" },
  { id: "inn", name: "听雨旅亭", region: "inland", parent: null },
  { id: "estate", name: "晴川药庄", region: "inland", parent: null },
  { id: "snow", name: "雪线旧门", region: "inland", parent: null },
  { id: "frontier", name: "云外古道", region: "inland", parent: null },
  { id: "stele", name: "断碑驿", region: "inland", parent: "frontier" },
  { id: "pact", name: "照玄遗府", region: "inland", parent: "frontier" },
  { id: "dew", name: "凝露药圃", region: "inland", parent: null },
  { id: "wall", name: "穿云壁", region: "coast", parent: null },
  { id: "outer-ferry", name: "外海古渡", region: "coast", parent: null },
  { id: "tidal", name: "退潮遗迹", region: "coast", parent: "outer-ferry" },
  { id: "court", name: "诸宗会谷", region: "coast", parent: null },
  { id: "lizhao", name: "离照泊岸", region: "coast", parent: "outer-ferry" },
  { id: "lizhao-chamber", name: "离照旧丹室", region: "coast", parent: "lizhao" },
  { id: "fuchao", name: "伏潮湾", region: "coast", parent: "lizhao" },
  { id: "vault", name: "归潮秘境", region: "coast", parent: "court" },
] as const;
export const travelSpeeds = {
  land: 1200,
  foundationFlight: 3600,
  goldenFlight: 7200,
} as const;
// A li is a worldbuilding distance unit. No real-world distance claim is made.
export const inlandRoads = [
  { from: "home", to: "ferry", land: 3600, air: 2400, via: "青嶂归路" },
  { from: "ferry", to: "inn", land: 1200, air: 900, via: "渡后药路" },
  { from: "inn", to: "estate", land: 2400, air: 1800, via: "晴川药路" },
  { from: "inn", to: "snow", land: 3600, air: 2700, via: "雪岭山路" },
  { from: "inn", to: "frontier", land: 3600, air: 2400, via: "云外支路" },
  { from: "inn", to: "stele", land: 1200, air: 900, via: "断碑驿道" },
  { from: "stele", to: "frontier", land: 2400, air: 1500, via: "驿外古道" },
  { from: "frontier", to: "pact", land: 80, air: 80, via: "照玄支脉" },
] as const;
