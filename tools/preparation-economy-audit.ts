/** Marginal cost comparisons plus controlled age projections, not full-player survival rates. */
import { monthlyGatherIncome, monthlyWorkIncome } from '../src/preparation-rates';
import { workshopQuote } from '../src/workshop/rules';
import { cultivationProjection } from '../src/progression';
import { goldenLateCheckpoint } from './golden-completion-checkpoint';
const earned=goldenLateCheckpoint();
const economy=[0,1,2,3].map(realm=>{
 const s=structuredClone(earned);s.realm=realm;s.journey.support=null;
 const craft=workshopQuote(s,{product:'healing',method:'craft'});
 const buy=workshopQuote(s,{product:'healing',method:'buy'});
 const gather=monthlyGatherIncome(s);
 s.journey.support='herb';s.growth.training.herb=realm?2:1;
 return {realm,workPerMonth:monthlyWorkIncome(s),baseGather:gather,trainedHerbGather:monthlyGatherIncome(s),herbsAffordablePerWorkMonth:monthlyWorkIncome(s)/2,ordinaryBatch:{quantity:craft.quantity,stones:craft.stones,herbs:craft.herbs,months:craft.months,opportunityCostPerItem:(craft.stones+craft.herbs*2+craft.months*monthlyWorkIncome(s))/craft.quantity},buyPrice:buy.stones};
});
const agePressure=[0,120,180,220,240].map(delayYears=>{
 const s={...earned,age:earned.age+delayYears*12};
 const p=cultivationProjection(s,899,120);
 return {delayYears,age:s.age/12,limit:s.limit/12,current:p.current,target:p.target,monthsToTarget:p.monthsToTarget,remainingAfterTarget:p.remainingAfterTarget};
});
console.log(JSON.stringify({scope:'Economy quote controls vary realm for comparison, not earned progress. Age pressure changes only age on an earned golden-late checkpoint and projects cultivation to 899; it ignores events and does not prove delayed full-story survival.',economy,agePressure},null,2));
