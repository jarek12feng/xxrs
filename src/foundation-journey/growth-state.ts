export const resourceRoutes = ['estate', 'snow', 'frontier'] as const;
export type ResourceRoute = typeof resourceRoutes[number];
export interface FoundationGrowth {
  routes: Record<ResourceRoute, { prepared: boolean; choice: '' | 'careful' | 'swift'; processed: boolean; revisited: boolean }>;
  refined: boolean;
  steady: 'none' | 'mentor' | 'medicine' | 'practice';
  steadyStudy: 'none' | 'medicine' | 'practice';
  rankGift: boolean;
}
export const freshFoundationGrowth = (): FoundationGrowth => ({
  routes: { estate: {prepared:false,choice:'',processed:false,revisited:false}, snow:{prepared:false,choice:'',processed:false,revisited:false}, frontier:{prepared:false,choice:'',processed:false,revisited:false} },
  refined:false,steady:'none',steadyStudy:'none',rankGift:false,
});
export interface FoundationProgress {
  cultivation: number;
  won?: readonly string[];
  growth?: FoundationGrowth;
  rescue: number;
}
import { foundationCap } from "../progression/caps";
export { foundationCap, hasSteady } from "../progression/caps";
export function foundationBlock(s: {foundationJourney?: FoundationProgress}) {
  const cap=foundationCap(s);
  return cap===199 ? '在无名渡取得并装配沉井传承，通过试运新法。' : cap===399 ? '药庄、雪线、古道择一路取材，再处理主材凝练灵元。' : cap===599 ? '学会稳脉，修行至 500 后贯通周天，通过长风归流。' : '筑基本境圆满；可筹备凝丹主药、丹药与灵地。';
}
