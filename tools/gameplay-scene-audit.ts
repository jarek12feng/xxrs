// Development-only visual harness. Does not read/write real saves or claim normal progression.
import { createApp, h, ref } from 'vue';
import { createCultivator } from './cultivator-fixture';
import '../src/style.css';
import EventScene from '../src/scene2d/EventScene.vue';
import QiNarrativeScene from '../src/qi-journey/QiNarrativeScene.vue';
import QiJourneyPanel from '../src/qi-journey/QiJourneyPanel.vue';
import RoadPanel from '../src/RoadPanel.vue';
import FoundationPanel from '../src/foundation-journey/FoundationPanel.vue';
import AuctionScene from '../src/auction/AuctionScene.vue';
import OuterSeaPanel from '../src/outer-sea/OuterSeaPanel.vue';
import ConclavePanel from '../src/conclave/ConclavePanel.vue';
import GoldenStoryScene from '../src/golden-story/GoldenStoryScene.vue';
import LizhaoPanel from '../src/lizhao/LizhaoPanel.vue';
import CovenantScene from '../src/nascent-soul/CovenantScene.vue';
const choices=['炼气街口','青嶂关外','筑基药庄','坊市拍卖','外海古渡','诸宗会谷','问法','离照港','结契庭院','剧情弹窗','药窟卢雁回','药庄岑霁'];
const active=ref(0);
function view(index:number){
 const s=createCultivator('场景检查','wood',42,'insightful','male');
 s.stones=500;s.herbs=30;s.qi=120;
 const common={game:s,busy:false};
 if(index===10){s.qiJourney.narrative.location='cave';return h(QiNarrativeScene,common);}
 if(index===11){s.realm=1;s.foundationJourney.location='estate';s.foundationJourney.growth.routes.estate.prepared=true;return h(FoundationPanel,{...common,mode:'journey'});}
 if(index===0)return h(QiJourneyPanel,common);
 if(index===1){s.adventure.road.stage='beyond';s.adventure.road.passed=true;return h(RoadPanel,common);}
 if(index===2){s.realm=1;s.foundationJourney.location='estate';return h(FoundationPanel,{...common,mode:'journey'});}
 if(index===3){s.month=12;return h(AuctionScene,{...common,venue:'market'});}
 s.realm=2;s.goldenCore.farShore=true;s.outerSea.location='ferry';s.outerSea.met=true;
 if(index===4)return h(OuterSeaPanel,common);
 s.outerSea.notice=1;s.conclave.location='court';s.conclave.introduced=true;
 if(index===5)return h(ConclavePanel,common);
 if(index===6)return h(GoldenStoryScene,{...common,place:'conclave'});
 if(index===7){s.lizhao.location='harbor';return h(LizhaoPanel,common);}
 if(index===8){s.realm=3;return h(CovenantScene,common);}
 return h(EventScene,{image:'/art/scene2d/apothecary-floor-v1.png',title:'药炉旁',speaker:'温蘅',portrait:'/characters/wenheng.png',quote:'先辨清药性，我替你看着火候。',body:'温蘅取出三味药，把炉边的位置让给你。耗费灵草与月份的条件应显示在操作旁。'},()=>h('button','检查练习药材 · 不提交游戏命令'));
}
createApp({setup:()=>()=>h('main',[
 h('nav',{style:'height:48px;display:flex;gap:6px;align-items:center;background:#122b24;padding:6px;color:white;box-sizing:border-box'},[h('small','隔离场景'),...choices.map((label,i)=>h('button',{onClick:()=>active.value=i,'aria-pressed':active.value===i},label))]),
 h('div',{key:active.value,style:'height:calc(100dvh - 48px);position:relative;overflow:hidden'},[view(active.value)])
])}).mount('#audit');
