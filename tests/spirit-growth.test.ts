import { describe,it,expect } from 'vitest';
import { createGame, dispatch, validState, migrateSave, type State, type Intent } from '../src/core';
import { journeyPlayer, journeyCheckpoint } from '../tools/foundation-journey-checkpoint';
import { freshSpirit, senseLimit, controlCapacity, spiritReadiness, injureSpirit } from '../src/spirit';
import { spiritQuote, spiritTrialPreview, type SpiritAction } from '../src/spirit/rules';
import { journeyActionError } from '../src/foundation-journey/progression';
import { dailyMedicineQuote } from '../src/medicines';
import { equipmentControl } from '../src/equipment';
import { foundationExchange } from '../src/foundation-journey/combat';
import { SAVE_VERSION } from '../src/save-version';
function beforeWell(){const p=journeyPlayer(journeyCheckpoint());p.act({kind:'travel',destination:'ferry'});p.fight('well');p.act({kind:'inherit',technique:'spring'});return p.state;}
let serial=0;
function act(s:State,action:SpiritAction){const q=spiritQuote(s,action);expect(q.error,JSON.stringify(action)).toBe('');const n=dispatch(s,{id:`spirit-test-${serial++}`,type:'spirit',action});expect(n).not.toBe(s);expect(validState(n),JSON.stringify(action)).toBe(true);return n;}
function win(s:State){for(const move of ['discern','guard','reach','discern'] as const)s=act(s,{kind:'move',move});return s;}
describe('炼神机缘与永久成长',()=>{
 it.each(['self','herbs'] as const)('沉井必要机缘经%s准备亲历、保存、研修、下一战兑现',preparation=>{
  let s=beforeWell();s.sense=preparation==='self'?12:3;s.herbs=10;s.injury=0;
  expect(journeyActionError(s,{kind:'battle',battle:'application'})).toContain('分念诀');
  const seed=s.seed, herbs=s.herbs, month=s.month;
  s=act(s,{kind:'enter',source:'well',preparation});
  expect(s.month-month).toBe(3);expect(s.herbs).toBe(herbs-(preparation==='herbs'?4:0));expect(s.seed).toBe(seed);
  const command={type:'spirit',action:{kind:'move',move:'discern'},id:'replay-spirit'} as const;
  expect(dispatch(s,command)).toEqual(dispatch(s,command));
  s=win(s);expect(s.spirit.manual).toBe('found');expect(senseLimit(s.realm,s.spirit)).toBe(24);
  expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  const before=s.sense;s=act(s,{kind:'study'});expect(s.sense).toBe(before+3);expect(senseLimit(s.realm,s.spirit)).toBe(30);
  const again=dispatch(s,{id:'duplicate-study',type:'spirit',action:{kind:'study'}});expect(again).toBe(s);
  s.foundationJourney.cultivation=120;s.journey.main='spring';
  expect(journeyActionError(s,{kind:'battle',battle:'application'})).toBe('');
  s.foundationJourney.duel={id:'application',ruleset:2,hp:100,enemy:145,turn:1,effect:'guard',aid:false};
  expect(foundationExchange(s,'discern')!.note).toContain('分念诀');
 });
 it('错误强探留下可免费恢复的识海创伤，可重试；不扣永久属性和装备容量',()=>{
  let s=beforeWell();s.sense=3;s.herbs=10;s.injury=0;
  const capacity=equipmentControl(s).capacity;
  s=act(s,{kind:'enter',source:'well',preparation:'herbs'});
  for(let i=0;s.spirit.trial&&i<4;i++)s=act(s,{kind:'move',move:'reach'});
  expect(s.spirit.manual).toBe('none');expect(s.spirit.trauma).toBe(1);expect(s.sense).toBe(3);expect(equipmentControl(s).capacity).toBe(capacity);
  expect(spiritQuote(s,{kind:'enter',source:'well',preparation:'herbs'}).error).toContain('创伤');
  const month=s.month;s=act(s,{kind:'recover'});expect(s.month-month).toBe(3);expect(s.spirit.trauma).toBe(0);
  s=win(act(s,{kind:'enter',source:'well',preparation:'herbs'}));expect(s.spirit.manual).toBe('found');
 });
 it('撤退和重复命令不发奖励；中途读档与预览不改状态',()=>{
  let s=beforeWell();s.sense=12;s.injury=0;s=act(s,{kind:'enter',source:'well',preparation:'self'});
  const original=structuredClone(s);const preview=spiritTrialPreview(s,'discern')!;expect(s).toEqual(original);
  const c={id:'one-move',type:'spirit',action:{kind:'move',move:'discern'}} as const;
  const n=dispatch(s,c);expect(n.spirit.trial!.stability).toBe(s.spirit.trial!.stability-preview.loss);expect(n.spirit.trial!.progress).toBe(preview.progress);
  expect(dispatch(n,c)).toBe(n);expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
  s=act(n,{kind:'withdraw'});expect(s.spirit.trauma).toBe(0);expect(s.spirit.manual).toBe('none');
 });
 it('探阵期间禁止跨场景、服药、换装、修炼，所有拒绝无副作用',()=>{
  let s=beforeWell();s.sense=12;s.injury=0;s=act(s,{kind:'enter',source:'well',preparation:'self'});
  const attempts:Intent[]=[{type:'advance',activity:'meditate',months:1},{type:'foundationJourney',action:{kind:'travel',destination:'home'}},{type:'consume',medicine:'clarity'},{type:'treasure',action:{kind:'withdraw',item:'sword'}},{type:'spirit',action:{kind:'study'}},{type:'nascentSoul',action:{kind:'trial'}}];
  for(const i of attempts)expect(dispatch(s,{...i,id:`blocked-${serial++}`})).toBe(s);
 });
 it('事件与寿尽中断准备不发奖，死亡清理活动',()=>{
  const s=beforeWell();s.sense=12;s.injury=0;s.age=s.limit-1;
  const n=dispatch(s,{id:'last-month',type:'spirit',action:{kind:'enter',source:'well',preparation:'self'}});
  expect(n.status).toBe('dead');expect(n.spirit.trial).toBeNull();expect(n.spirit.manual).toBe('none');expect(validState(n)).toBe(true);
  const locked=beforeWell();locked.pending={id:'pending',kind:'visit',month:locked.month} as State['pending'];
  expect(spiritQuote(locked,{kind:'enter',source:'well',preparation:'herbs'}).error).not.toBe('');
 });
 it('普通养神药止于药力上限；破限区间由凝神成长，法门随境界保留',()=>{
  let s=beforeWell();s.spirit.manual='learned';s.sense=24;s.growth.medicines.clarity=2;
  expect(dailyMedicineQuote(s,'clarity').error).toContain('上限');
  s=dispatch(s,{id:'beyond-ordinary',type:'advance',activity:'meditate',months:12});
  expect(s.sense).toBe(30);expect(validState(s)).toBe(true);expect(senseLimit(2,s.spirit)).toBe(54);
  s.realm=2;s.sense=48;s.growth.medicines.spirit=1;expect(dailyMedicineQuote(s,'spirit').error).toContain('上限');
  expect(controlCapacity(60)).toBe(22);
 });
 it('疗复与成长二选一：满神识或药性间隔内仍可疗复，无重复收益',()=>{
  let s=beforeWell();s.sense=24;s.spirit.trauma=2;s.growth.medicines.clarity=2;s.growth.lastMedicineMonth=s.month;
  expect(dailyMedicineQuote(s,'clarity').error).toContain('药性');
  expect(dailyMedicineQuote(s,'clarity','restore')).toMatchObject({error:'',restored:1,sense:0,nextUseMonth:null});
  const c={id:'restore-pill',type:'consume',medicine:'clarity',purpose:'restore'} as const;
  const n=dispatch(s,c);expect(n.spirit.trauma).toBe(1);expect(n.sense).toBe(24);expect(n.growth.medicines.clarity).toBe(1);expect(n.growth.lastMedicineMonth).toBe(s.month);expect(n.month).toBe(s.month);expect(dispatch(n,c)).toBe(n);expect(validState(n)).toBe(true);
  expect(dailyMedicineQuote({...s,spirit:freshSpirit()},'clarity','restore').error).not.toBe('');
 });
 it('创伤影响有效护神及专御，永久容量和物品不变',()=>{
  const s=beforeWell();s.sense=18;s.journey.equipped='sword';s.journey.relics.sword=1;s.treasures.equipped=[];
  const before=equipmentControl(s);expect(before.focused).toBe(true);injureSpirit(s);expect(equipmentControl(s).focused).toBe(false);expect(equipmentControl(s).capacity).toBe(before.capacity);expect(s.journey.equipped).toBe('sword');
  expect(spiritReadiness({...s,sense:48}).trialMind).toBeGreaterThan(spiritReadiness({...s,sense:12}).trialMind);
 });
 it('40版先验证再迁移，不补发机缘；未知未来与伪造破限拒绝',()=>{
  const old={...createGame('旧档','wood'),version:40} as unknown as Record<string,unknown>;delete old.spirit;
  const snapshot=structuredClone(old),n=migrateSave(old);expect(n.version).toBe(SAVE_VERSION);expect(n.spirit).toEqual(freshSpirit());expect(old).toEqual(snapshot);
  expect(()=>migrateSave({...old,sense:60})).toThrow();expect(()=>migrateSave({...n,version:SAVE_VERSION+1})).toThrow();
  const forged=createGame('伪造','wood');forged.spirit.manual='learned';expect(validState(forged)).toBe(false);
  const corrupt=beforeWell();corrupt.spirit.trauma=4;expect(validState(corrupt)).toBe(false);
  const missing={...n} as Partial<State>;delete missing.spirit;expect(validState(missing)).toBe(false);
 });
});

it('归潮玉髓可选挑战、炼化与破限，金丹成果读档后继续兑现',async()=>{
 const {goldenLateCheckpoint}=await import('../tools/golden-completion-checkpoint');
 let s=goldenLateCheckpoint();
 expect(s.spirit.manual).toBe('learned');expect(s.spirit.jade).toBe('none');expect(validState(s)).toBe(true);
 while(s.injury)s=dispatch(s,{id:`heal-tide-${serial++}`,type:'advance',activity:'rest',months:1});
 // The fixture is made by public commands; also cultivate the optional preparation normally.
 while(s.sense<24)s=dispatch(s,{id:`focus-tide-${serial++}`,type:'advance',activity:'meditate',months:1});
 s=win(act(s,{kind:'enter',source:'tide',preparation:'self'}));
 expect(s.spirit.jade).toBe('found');const sense=s.sense;
 s=act(s,{kind:'refine'});expect(s.spirit.jade).toBe('refined');expect(s.sense).toBe(sense+6);expect(senseLimit(s.realm,s.spirit)).toBe(60);
 expect(spiritReadiness({...s,sense:60}).breakthroughBonus).toBe(4);
 expect(spiritReadiness({...s,sense:60}).trialMind).toBe(26);
 expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
 expect(spiritQuote(s,{kind:'enter',source:'tide',preparation:'self'}).error).toContain('已取得');
});
