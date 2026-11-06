// Use the persisted attendance list, never infer attendance from cultivation rank.
export function ceremonyGuests(names: readonly string[]) {
  return names.map(name => ({name, art: name === '苏婉宁'
    ? '/art/companionship/shentinglan-travel.webp'
    : name === '尹照川' ? '/art/companionship/yinzhaochuan-travel.webp'
    : name === '衡璇院轮值使者' ? '/art/review-fixes/hengxuan-envoy-v1.webp'
    : name === '澄渊宗轮值使者' ? '/art/review-fixes/chengyuan-envoy-v1.webp'
    : '/art/review-fixes/duty-envoy.webp'}));
}
