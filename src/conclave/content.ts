export const rivals = [
  {
    name: "顾沧遥",
    sect: "澄渊宗",
    aim: "他要争取新堤所需的灵材，守势稳健，转身换印时可抢先出手。",
    realm: 2 as const,
    stage: 1,
    hp: 300,
    attack: 46,
    pattern: ["guard", "strike", "discern"] as const,
  },
  {
    name: "纪闻霜",
    sect: "照霜门",
    aim: "她受托寻回失传的凝神法。剑光藏在霜影里，先辨真身，再接剑势。",
    realm: 2 as const,
    stage: 1,
    hp: 340,
    attack: 48,
    pattern: ["discern", "guard", "strike"] as const,
  },
  {
    name: "程砚舟",
    sect: "衡璇院",
    aim: "他要验证新阵的破绽，胜负之外更在意你如何拆解阵势。争优切磋，不影响入境资格。",
    realm: 2 as const,
    stage: 1,
    hp: 420,
    attack: 52,
    pattern: ["strike", "discern", "guard"] as const,
  },
];
export const wardens = [
  {
    name: "归潮守珠傀儡",
    sect: "归潮秘境",
    aim: "辨清回流、挡住潮击，再攻阵隙。",
    realm: 2 as const,
    stage: 1,
    hp: 360,
    attack: 51,
    pattern: ["discern", "guard", "strike"] as const,
  },
  {
    name: "照神阵枢",
    sect: "归潮秘境深处",
    aim: "阵压直接撼动识海，先守住自身，再循阵隙反击。温养的定神珠能抵消阵压。",
    realm: 2 as const,
    stage: 1,
    hp: 400,
    attack: 50,
    pattern: ["guard", "strike", "discern"] as const,
  },
];
export const tell = {
  guard: "潮势压身，宜先守势。",
  strike: "换势露隙，可以反击。",
  discern: "虚影遮蔽，先辨真形。",
};
