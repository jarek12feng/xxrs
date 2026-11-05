import { describe, it, expect } from 'vitest';
import { auctionFixture } from '../tools/auction-checkpoint';
import { dispatch } from '../src/core';
import { auctionMapInfo, auctionVenueAt } from '../src/auction/map';
import { routeNodes } from '../src/landmarks';
import { travelQuote } from '../src/wayfaring/rules';

describe('拍卖地图与真实赴会行程', () => {
  it('场所沿用所属目的地，未发现的药庄不会提前泄露', () => {
    const s = auctionFixture();
    expect(auctionVenueAt('market')).toBe('market');
    expect(auctionVenueAt('estate')).toBe('foundation');
    expect(auctionVenueAt('inland-estate')).toBe('foundation');
    expect(auctionMapInfo(s, 'estate')).toBeNull();
    expect(routeNodes(s).find(n => n.key === 'market')?.auction).toBe('market');
    expect(routeNodes(s).find(n => n.key === 'inland-estate')).toBeUndefined();
  });
  it('已发现地点只提示当地会场，浏览不会领取会讯或消耗随机种子', () => {
    const s = auctionFixture('foundation', 55);
    s.foundationJourney.location = 'home';
    s.foundationJourney.ferry = 1;
    const before = structuredClone(s);
    expect(auctionMapInfo(s, 'estate', 6)?.timing).toContain('尚未收到会讯');
    expect(auctionMapInfo(s, 'estate', 6)?.arrival).toBe('');
    expect(routeNodes(s).find(n => n.key === 'inland-estate')?.auction).toBe('foundation');
    expect(s).toEqual(before);
  });
  it('已知会期按真实陆路及御剑耗时判断抵达，并严格排除截止月', () => {
    let s = dispatch(auctionFixture('foundation', 58), {type:'treasure',action:{kind:'catalog',venue:'foundation'},id:'map-catalog'});
    s.foundationJourney.location = 'home';
    s.foundationJourney.ferry = 1;
    const land = travelQuote(s, 'estate', 'land');
    s.wayfaring.swordFlight = 'learned';
    const flight = travelQuote(s, 'estate', 'flight');
    expect(land.remaining).toBe(6);
    expect(flight.remaining).toBe(2);
    expect(auctionMapInfo(s,'estate',land.remaining)?.arrival).toContain('将错过');
    expect(auctionMapInfo(s,'estate',flight.remaining)?.arrival).toContain('入场窗口内');
    expect(auctionMapInfo(s,'estate',1)?.arrival).toContain('距开场尚有');
    expect(auctionMapInfo(s,'estate',5)?.arrival).toContain('将错过');
  });
});

it('赴会用现有公共旅行命令抵达后才可入场，陆路确实错过本届', async () => {
  const {auctionTravelFixture}=await import('../tools/auction-checkpoint');
  const {validState}=await import('../src/core');
  const s=auctionTravelFixture();
  expect(validState(s)).toBe(true);
  for(const mode of ['land','flight'] as const){
    const q=travelQuote(s,'estate',mode);
    expect(q.error).toBe('');
    const n=dispatch(s,{type:'foundationJourney',action:{kind:'travel',destination:'estate',mode},id:`arrive-${mode}`});
    expect(n.foundationJourney.location).toBe('estate');
    expect(n.month).toBe(s.month+q.remaining);
    expect(validState(n)).toBe(true);
    const entered=dispatch(n,{type:'treasure',action:{kind:'enter'},id:`enter-${mode}`});
    expect(!!entered.treasures.auction?.entered).toBe(mode==='flight');
  }
});
