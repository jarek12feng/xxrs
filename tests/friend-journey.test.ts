import { messageLead } from "../src/correspondence/leads";
import { SAVE_VERSION } from "../src/save-version";
// @vitest-environment happy-dom
import { createApp, h, shallowRef, nextTick } from "vue";
import FriendJourneyScene from "../src/friend-journey/FriendJourneyScene.vue";
import { friendPresence } from "../src/friend-journey/presence";
import { companionContact } from "../src/nascent-soul/contact";
import { nascentQuote } from "../src/nascent-soul/rules";
import PersonalContacts from "../src/correspondence/PersonalContacts.vue";
import type { Intent } from "../src/core";
import { beforeAll, expect, it, vi } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import { settleFriendJourney, knownFriendJourney } from "../src/friend-journey";
let base: State;
beforeAll(() => {
  base = goldenLateCheckpoint();
  for (const action of [
    { kind: "invite" },
    { kind: "meet" },
    { kind: "plan", approach: "ward" },
    { kind: "anchor" },
    { kind: "cross" },
    { kind: "share", sharing: "public" },
    { kind: "depart" },
  ] as const) {
    const next = dispatch(base, {
      id: `setup-${action.kind}`,
      type: "goldenStory",
      action: { kind: "reunion", action },
    });
    expect(next).not.toBe(base);
    base = next;
  }
  expect(validState(base)).toBe(true);
}, 30000);
function advance(s: State, n: number) {
  const next = structuredClone(s);
  next.month += n;
  settleFriendJourney(s, next);
  return next;
}
function command(s: State, action: any, id: string) {
  return dispatch(s, { type: "correspondence", action, id });
}
it("世界事实先发生、信晚一月送达；整段与逐月结算一致且不重复", () => {
  const one = advance(base, 1);
  expect(one.friendJourney.facts).toHaveLength(1);
  expect(knownFriendJourney(one)).toBe("");
  const long = advance(base, 20);
  let short = base;
  for (let i = 0; i < 20; i++) short = advance(short, 1);
  expect(long.friendJourney).toEqual(short.friendJourney);
  expect(long.correspondence).toEqual(short.correspondence);
  expect(long.friendJourney.facts).toHaveLength(5);
  expect(
    long.friendJourney.facts.every(
      (f) => f.learnedAt === f.occurredAt + 1 && f.confirmedAt === null,
    ),
  ).toBe(true);
  const again = structuredClone(long);
  settleFriendJourney(base, again);
  expect(again).toEqual(long);
  expect(validState(long)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(long)))).toEqual(long);
});
it("寄药限出发前一次且真的扣草药；影响独立结果，重复命令无效", () => {
  const ready = advance(base, 2);
  ready.herbs = 10;
  const supplied = command(ready, { kind: "supplyFriend" }, "supply");
  expect(supplied.herbs).toBe(8);
  expect(command(supplied, { kind: "supplyFriend" }, "supply")).toBe(supplied);
  expect(command(supplied, { kind: "supplyFriend" }, "supply-again")).toBe(
    supplied,
  );
  const late = advance(ready, 2);
  expect(command(late, { kind: "supplyFriend" }, "late")).toBe(late);
  const end = advance(supplied, 20),
    alone = advance(ready, 20);
  expect(
    end.correspondence.letters.find((l) => l.id === "friend:su:resting")?.body,
  ).toContain("测记也保住");
  expect(
    alone.correspondence.letters.find((l) => l.id === "friend:su:resting")
      ?.body,
  ).toContain("伤了手臂");
  expect(validState(end)).toBe(true);
});
it("阅读不确认，转述不能核验，本人回信核验此前经历", () => {
  let s = advance(base, 20);
  s = command(s, { kind: "read", letter: "friend:su:traveling" }, "read-rumor");
  expect(
    command(
      s,
      { kind: "confirm", letter: "friend:su:traveling" },
      "confirm-rumor",
    ),
  ).toBe(s);
  s = command(s, { kind: "read", letter: "friend:su:resting" }, "read-real");
  expect(s.friendJourney.facts.every((f) => f.confirmedAt === null)).toBe(true);
  s = command(
    s,
    { kind: "confirm", letter: "friend:su:resting" },
    "confirm-real",
  );
  expect(
    s.friendJourney.facts.slice(0, 4).every((f) => f.confirmedAt === s.month),
  ).toBe(true);
  expect(s.friendJourney.facts[4]!.confirmedAt).toBeNull();
  expect(validState(s)).toBe(true);
});
it("旧档不回算过去行程，未来与坏时间记录拒绝", () => {
  const old: any = structuredClone(base);
  old.version = 51;
  delete old.friendJourney;
  const migrated = migrateSave(old);
  expect(migrated.friendJourney.facts).toEqual([]);
  expect(advance(migrated, 1).friendJourney.startedAt).toBe(base.month + 1);
  expect(() => migrateSave({ ...base, version: SAVE_VERSION + 1 })).toThrow();
  const bad = advance(base, 20);
  bad.friendJourney.facts[0]!.learnedAt = 0;
  expect(validState(bad)).toBe(false);
});
it("公共耗月命令接入并可逐次保存恢复；未告别人物不启程", () => {
  let s = base;
  for (let i = 0; i < 3; i++) {
    const next = dispatch(s, { type: "advance", activity: "work", months: 1, id: `friend-work-${i}` });
    expect(next.month).toBeGreaterThan(s.month);
    expect(validState(next)).toBe(true);
    s = migrateSave(JSON.parse(JSON.stringify(next)));
  }
  expect(s.friendJourney.facts.length).toBeGreaterThan(0);
  expect(
    s.correspondence.letters.some((l) => l.id === "friend:su:preparing"),
  ).toBe(true);
  const no = goldenLateCheckpoint();
  expect(advance(no, 30).friendJourney.facts).toEqual([]);
});

it('联系人面板显示三种时间并通过公共命令寄药', async()=>{
 const state=shallowRef(advance(base,2));state.value.herbs=10;
 const host=document.createElement('div');
 const app=createApp({render:()=>h(PersonalContacts,{game:state.value,busy:false,onAct:(intent:Intent)=>{state.value=dispatch(state.value,{...intent,id:'friend-ui'});}})});
 app.mount(host);
 try {
  expect(host.textContent).toContain('尚未核验');
  const button=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('寄灵草2'))!;
  expect(button.disabled).toBe(false);button.click();await nextTick();
  expect(state.value.herbs).toBe(8);expect(button.disabled).toBe(true);
  expect(host.textContent).toContain('灵草已经捎去');expect(validState(state.value)).toBe(true);
 }finally{app.unmount();}
});

it('返渡当天可当面核验，未送达事实记入见闻，保存与重复命令安全',()=>{
 let s=advance(base,10);s.outerSea.location='ferry';
 const before=s.month;
 expect(friendPresence(s)).toBe('resting');
 expect(s.friendJourney.facts.at(-1)!.learnedAt).toBeNull();
 s=command(s,{kind:'visitFriend'},'visit');
 expect(s.friendJourney.visitedAt).toBe(before);
 expect(s.friendJourney.facts.every(f=>f.confirmedAt===before)).toBe(true);
 expect(s.month).toBe(before);expect(validState(s)).toBe(true);
 expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
 expect(command(s,{kind:'visitFriend'},'visit-again')).toBe(s);
 const home=advance(base,11);home.outerSea.location='home';
 expect(command(home,{kind:'visitFriend'},'remote')).toBe(home);
});
it('出行无人可见，旧约不能让她同时在结契庭院出现，错过仍能收信',()=>{
 const away=advance(base,5);away.nascentSoul.contactedAt=away.month;
 expect(friendPresence(away)).toBe('away');
 expect(companionContact(away).availableForMeeting).toBe(false);
 expect(nascentQuote(away,{kind:'contact'}).error).toBeTruthy();
 expect(command(away,{kind:'visitFriend'},'away-visit')).toBe(away);
 const complete=advance(base,21);
 expect(friendPresence(complete)).toBe('departed');
 expect(complete.correspondence.letters.some(l=>l.id==='friend:su:complete')).toBe(true);
 expect(companionContact(complete).availableForMeeting).toBe(true);
 complete.nascentSoul.contactedAt=base.month;
 expect(companionContact(complete).invitationCurrent).toBe(false);
 expect(companionContact(complete).present).toBe(false);
 complete.nascentSoul.contactedAt=complete.month;
 expect(companionContact(complete).invitationCurrent).toBe(true);
 const busy=structuredClone(base);busy.nascentSoul.ceremony='discussed';
 expect(advance(busy,5).friendJourney.startedAt).toBeNull();
});
it('v52迁移保留已经发生和核验的事实，只补未探望',()=>{
 const old:any=advance(base,20);old.version=52;delete old.friendJourney.visitedAt;
 const next=migrateSave(old);expect(next.friendJourney.visitedAt).toBeNull();
 expect(next.friendJourney.facts).toEqual(old.friendJourney.facts);
});
it('侧堤场景仅返渡期显示人物，点击探望走公共命令',async()=>{
 const state=shallowRef(advance(base,10));state.value.outerSea.location='ferry';
 const host=document.createElement('div');
 const app=createApp({render:()=>h(FriendJourneyScene,{game:state.value,busy:false,onAct:(intent:Intent)=>{state.value=dispatch(state.value,{...intent,id:'visit-ui'});}})});
 app.mount(host);
 try{
  expect(host.querySelector('img[alt="苏婉宁在石台旁整理测记"]')).not.toBeNull();
  const hotspot=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('苏婉宁 · 返渡休养'))!;
  hotspot.click();await nextTick();
  await vi.waitFor(()=>expect([...host.querySelectorAll('button')].some(b=>b.textContent?.includes('走近问候'))).toBe(true),{timeout:2500});
  const visit=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('走近问候'))!;
  visit.click();await nextTick();expect(state.value.friendJourney.visitedAt).toBe(state.value.month);
  expect(host.textContent).toContain('轻扶着伤臂');
  state.value=advance(base,5);await nextTick();
  expect(host.querySelector('img[alt="苏婉宁在石台旁整理测记"]')).toBeNull();
 }finally{app.unmount();}
});

it('旧信去路按当前见闻与航程更新，不误导玩家去已结束的探望',()=>{
 const s=advance(base,11);s.outerSea.location='home';
 const letter=s.correspondence.letters.find(l=>l.id==='friend:su:returned')!;
 expect(messageLead(s,letter)).toContain('单程6月');
 expect(messageLead(s,letter)).toContain('预计可赶上');
 const late=advance(s,2);expect(messageLead(late,letter)).toContain('会错过');
 const end=advance(s,10);expect(messageLead(end,letter)).toContain('不必再赶去');
 const preparing=s.correspondence.letters.find(l=>l.id==='friend:su:preparing')!;
 expect(preparing.body).toContain(`第${s.friendJourney.startedAt!+3}月动身`);
});
