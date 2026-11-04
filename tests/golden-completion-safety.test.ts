import { beforeAll, expect, it } from 'vitest';
import { dispatch, validState, type State } from '../src/core';
import { goldenLateCheckpoint, goldenCompletionPlayer, finishGoldenCompletion } from '../tools/golden-completion-checkpoint';
import { chooseLizhaoMove } from '../tools/lizhao-fixture';
import { nascentGuests, nascentQuote } from '../src/nascent-soul/rules';
import { companionNews } from '../src/golden-story/rules';
let unverified:State;
let departed:State;
let completion:State;
beforeAll(()=>{
 const late=goldenLateCheckpoint();
 const p=goldenCompletionPlayer(late);
 p.rest();p.work(120);p.herbs(30);
 p.lizhao({kind:'visit'});p.lizhao({kind:'route',route:'cooperate'});p.lizhao({kind:'prepare',preparation:'purify'});p.lizhao({kind:'enter'});
 const fight=()=>{p.lizhao({kind:'fight'});p.until(()=>!p.state.lizhao.duel,()=>p.lizhao({kind:'move',move:chooseLizhaoMove(p.state)}),'safety fight',18);};
 fight();p.lizhao({kind:'deeper'});fight();
 unverified=structuredClone(p.state);
 p.lizhao({kind:'return'});p.lizhao({kind:'leave'});p.cultivate(899);p.rest();departed=p.state;
 completion=finishGoldenCompletion(late).checkpoints.completion!;
});
it('未核验离照药理不能进入会产生无效圆满记录的试炼',()=>{
 expect(validState(departed)).toBe(true);
 expect(departed.lizhao.recipeVerified).toBe(false);
 expect(nascentQuote(departed,{kind:'trial'}).error).not.toBe('');
 expect(dispatch(departed,{id:'unverified-trial',type:'nascentSoul',action:{kind:'trial'}})).toBe(departed);
});
it('身在离照内层不能隔空分发古渡拓本',()=>{
 expect(validState(unverified)).toBe(true);
 expect(unverified.lizhao.location).toBe('inner');
 expect(unverified.goldenStory.rubbings).not.toContain('chengyuan');
 expect(dispatch(unverified,{id:'remote-rubbing',type:'goldenStory',action:{kind:'rubbing',recipient:'chengyuan'}})).toBe(unverified);
});
it('失联的旧恋人不能直接现场结契或重温旧约',()=>{
 // Relationship variants isolate presence authorization; no progress or rewards are fabricated.
 for(const whereabouts of ['away','missing'] as const){
  const s=structuredClone(completion);s.foundationJourney.whereabouts=whereabouts;
  s.social.met=true;s.social.bonded=true;s.foundationJourney.bond='promised';
  expect(nascentQuote(s,{kind:'ceremony',choice:'discuss'}).error,whereabouts).not.toBe('');
  s.foundationJourney.bond='covenant';
  expect(nascentQuote(s,{kind:'ceremony',choice:'renew'}).error,whereabouts).not.toBe('');
 }
});
it('公开消息已承认去向不明时，大典不能把陈年营救当作今日在场',()=>{
 // Confirmed independent Golden cultivation extends the news window to 500 years.
 // Beyond that window even a saved rescue and old breakthrough letter prove no present contact.
 const s=structuredClone(completion);s.foundationJourney.whereabouts='rescued';s.social.met=true;s.social.metMonth=0;s.month=Math.max(s.month,6000);
 expect(companionNews(s)?.id).toBe(3);
 expect(nascentGuests(s)).not.toContain(s.social.gender==='male'?'苏婉宁':'尹照川');
});
