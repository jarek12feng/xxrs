import Phaser from "phaser";
import type { Adventure } from "../adventure";
import type { SceneObject } from "./opening";
import { createActionPlayer } from "./action-player";
import { planWalk } from "./navigation";
import { approachPoint, groundScale, coveredArtworkPoint } from "./stage-geometry";
interface StageState { prepared: boolean; rescued: boolean; method?: Adventure["method"] }
export interface StageConfig {
  method?: Adventure["method"];
  image: string;
  hero: string;
  heroAction?: string;
  entry?: {x:number;y:number};
  heroWalk?: { url: string; frameWidth: number; frameHeight: number };
  onMotion?: (moving: boolean) => void;
  onPerformance?: (caption: string) => void;
  heroSequence?: {url:string;frameWidth:number;frameHeight:number};
  objects: SceneObject[];
  calm: boolean;
  gate: boolean;
  reduced: boolean;
  sceneKey?: string;
  prepared?: boolean;
  rescued?: boolean;
}
export interface StageHandle {
  move(x: number, y: number): void;
  getPosition?(): {x:number;y:number};
  walkTo?(x: number, y: number): void;
  nudge?(x: number, y: number): void;
  skipWalk?(): void;
  skipPerformance?(): void;
  stop?(): void;
  focus?(id: string): void;
  settle(calm: boolean): void;
  sync?(state: StageState): void;
  destroy(): void;
}
// Renderer owns only pixels and ephemeral movement. It cannot dispatch or mutate a State.
export function mountStage(
  parent: HTMLElement,
  config: StageConfig,
  onReady: () => void,
): StageHandle {
  const width = Math.max(1, parent.clientWidth || 1200);
  const height = Math.max(1, parent.clientHeight || 760);
  const unit = Math.min(width / 1200, height / 760);
  let actor: Phaser.GameObjects.Sprite | undefined;
  let shadow: Phaser.GameObjects.Ellipse | undefined;
  let readiness: Phaser.GameObjects.Ellipse | undefined;
  let ring: Phaser.GameObjects.Arc | undefined;
  let rescuedWorker: Phaser.GameObjects.Image | undefined;
  let current: Phaser.Scene | undefined;
  let destroyed = false;
  let performance: ReturnType<typeof createActionPlayer> | undefined;
  let settled = config.calm;
  let state: StageState = {
    method: config.method,
    prepared: config.prepared ?? false,
    rescued: config.rescued ?? false,
  };
  const position = { x: width * (config.entry?.x ?? 35) / 100, y: height * (config.entry?.y ?? 84) / 100 };
  const people = new Map<string,Phaser.GameObjects.Image>();
  let walkRevision = 0;
  let walkEnd: { x: number; y: number } | undefined;
  const placeActor = () => {
    if (!actor) return;
    const scale = groundScale(position.y, height);
    actor
      .setPosition(position.x, position.y)
      .setOrigin(.5, actor.texture.key === "hero-walk" ? .94 : 1)
      .setScale((220 * unit * scale) / (actor.height * (actor.texture.key === "hero-walk" ? .86 : 1)))
      .setDepth(position.y);
    shadow
      ?.setPosition(position.x, position.y - 2 * unit)
      .setScale(scale)
      .setDepth(position.y - 2);
    readiness
      ?.setPosition(position.x, position.y)
      .setScale(scale)
      .setDepth(position.y - 3);
  };
  const applyState = () => {
    rescuedWorker?.setVisible(state.rescued);
    readiness?.setVisible(state.prepared).setAlpha(state.rescued ? 0.12 : 0.3);
    if (!ring || !current) return;
    current.tweens.killTweensOf(ring);
    const quiet = settled || state.rescued;
    ring
      .setAlpha(1)
      .setFillStyle(0x71dfce, quiet ? 0.025 : 0.11)
      .setStrokeStyle(
        3 * unit,
        quiet ? 0xc6dab2 : 0x67e5d3,
        quiet ? 0.12 : 0.65,
      );
    if (!config.reduced && !quiet)
      current.tweens.add({
        targets: ring,
        alpha: 0.45,
        duration: 1400,
        yoyo: true,
        repeat: -1,
      });
  };
  class OpeningStage extends Phaser.Scene {
    private weather?: Phaser.GameObjects.Graphics;
    private preparation?: Phaser.GameObjects.Graphics;
    private drawPreparation(time: number) {
      if (!this.preparation) return;
      const g = this.preparation.clear();
      if (!state.prepared || config.sceneKey !== "apothecary") return;
      if (state.method === "medicine") {
        // Warm vapor rises from the actual furnace in the pharmacy background.
        for (let i = 0; i < 7; i++) {
          const phase = config.reduced ? i / 7 : ((time / 2200 + i / 7) % 1);
          g.fillStyle(0xe8d5ae, (1 - phase) * .18);
          g.fillEllipse(width * .17 + Math.sin(phase * 5 + i) * 9 * unit,
            height * .44 - phase * 100 * unit, (10 + phase * 18) * unit, 9 * unit);
        }
        g.fillStyle(0xf9bf63, .12);
        g.fillEllipse(width * .17, height * .52, 55 * unit, 28 * unit);
      } else if (state.method === "guide") {
        // The agreed return cord stays visible; it is not a newly granted item.
        g.lineStyle(3 * unit, 0xd9987e, .65);
        g.beginPath();g.moveTo(width * .67, height * .79);
        g.lineTo(width * .75, height * .84);g.lineTo(width * .85, height * .82);g.strokePath();
      } else if (state.method === "ward") {
        const pulse = config.reduced ? 1 : .75 + Math.sin(time / 900) * .25;
        g.lineStyle(2 * unit, 0xe9d9a3, .4 * pulse);
        g.strokeCircle(width * .43, height * .35, 28 * unit);
        g.strokeCircle(width * .43, height * .35, 40 * unit);
      }
    }
    preload() {
      this.load.image("backdrop", config.image);
      this.load.image("hero", config.hero);
      if(config.sceneKey === "apothecary")this.load.image("wenheng", "/art/characters/wenheng.webp");
      if(config.sceneKey === "apothecary" || config.sceneKey === "shrine") this.load.spritesheet("opening-people", "/art/scene2d/opening-people-v1.png", {frameWidth:627,frameHeight:1254});
      if(config.heroSequence && (config.sceneKey === "apothecary" || config.sceneKey === "shrine")) this.load.spritesheet("hero-sequence",config.heroSequence.url,{frameWidth:config.heroSequence.frameWidth,frameHeight:config.heroSequence.frameHeight});
      if (config.heroWalk) this.load.spritesheet("hero-walk", config.heroWalk.url, { frameWidth: config.heroWalk.frameWidth, frameHeight: config.heroWalk.frameHeight });
      if (config.heroAction) this.load.image("hero-action", config.heroAction);
      for (const o of config.objects) if (o.art) this.load.image(o.id, o.art);
    }
    create() {
      if (this.textures.exists("hero-walk")) this.anims.create({ key: "walk", frames: this.anims.generateFrameNumbers("hero-walk", { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
      if (destroyed) return;
      current = this;
      if (this.textures.exists("backdrop")) {
        const backdrop = this.add
          .image(width / 2, height / 2, "backdrop")
          .setDepth(-10);
        backdrop.setScale(
          Math.max(width / backdrop.width, height / backdrop.height),
        );
        // The red-rope trail enters along the central stone path, not the left cliff.
        // Keep the foot attached to the painted road when cover crops a narrow viewport.
        if (config.sceneKey === "forest" && !config.entry) {
          Object.assign(position, coveredArtworkPoint(width, height, backdrop.width, backdrop.height, {x:56,y:84}));
        }
      }
      this.add
        .rectangle(width / 2, height / 2, width, height, 0x061c20, 0.06)
        .setDepth(-9);
      for (const o of config.objects) {
        if (!o.art || !this.textures.exists(o.id)) continue;
        const x = ((o.foot?.x ?? o.x) * width) / 100,
          y = ((o.foot?.y ?? o.y) * height) / 100;
        const scale = groundScale(y, height);
        const person = o.id === "luchi" || o.id === "exit";
        this.add
          .ellipse(
            x,
            y - 2 * unit,
            (person ? 72 : 52) * unit * scale,
            12 * unit * scale,
            0x061917,
            0.48,
          )
          .setDepth(y - 2);
        const art = this.add.image(x, y, o.id).setOrigin(0.5, 1).setDepth(y);
        art.setScale(((person ? 230 : 90) * unit * scale) / art.height);
        if(person)people.set(o.id,art);
      }
      if(this.textures.exists("opening-people")) {
        if(config.sceneKey === "apothecary") {
          const npc=this.add.image(width*.22,height*.72,"wenheng").setOrigin(.5,.99).setDepth(height*.72);
          npc.setScale(230 * unit / (npc.height * .97));people.set("medicine",npc);
        }
        if(config.sceneKey === "shrine") {
          rescuedWorker=this.add.image(width*.34,height*.80,"opening-people",1).setOrigin(.5,.99).setDepth(height*.80);
          rescuedWorker.setScale(215 * unit / (rescuedWorker.height*.97));people.set("worker",rescuedWorker);
        }
      }
      if (config.gate)
        ring = this.add
          .circle(width * 0.51, height * 0.38, 106 * unit)
          .setDepth(0);
      if (this.textures.exists("hero")) {
        readiness = this.add.ellipse(
          position.x,
          position.y,
          94 * unit,
          20 * unit,
          0xe9ca83,
          0.3,
        );
        shadow = this.add.ellipse(
          position.x,
          position.y,
          80 * unit,
          15 * unit,
          0x04100e,
          0.55,
        );
        actor = this.add
          .sprite(position.x, position.y, "hero")
          .setOrigin(0.5, 1);
        placeActor();
      }
      if (!config.reduced) {
        this.weather = this.add.graphics().setDepth(height + 1);
        this.cameras.main.fadeIn(260, 7, 21, 22);
      }
      this.preparation = this.add.graphics().setDepth(height);
      this.drawPreparation(0);
      applyState();
      performance=createActionPlayer(this,{initial:state,reduced:config.reduced,width,height,unit,sceneKey:config.sceneKey,
        hero:actor,worker:rescuedWorker,shadow,onCaption:config.onPerformance,
        restore:(sequence,reason)=>{
          if(sequence === "rescue" && reason !== "disposed" && reason !== "replaced") Object.assign(position,{x:width*.41,y:height*.82});
          actor?.setTexture("hero");placeActor();applyState();}});
      onReady();
      if (document.hidden) this.game.loop.sleep();
    }
    update(time: number) {
      this.drawPreparation(time);
      if (!this.weather) return;
      const g = this.weather.clear();
      if (config.sceneKey === "ferry" || config.sceneKey === "invitation") {
        // Deterministic, sparse rain; render time is never a world clock.
        g.lineStyle(Math.max(1, unit), 0xb8d3d2, 0.13);
        for (let i = 0; i < 24; i++) {
          const x = (i * 137 + time * 0.018) % width;
          const y = (i * 83 + time * 0.18) % height;
          g.lineBetween(x, y, x - 5 * unit, y + 15 * unit);
        }
      } else if (config.sceneKey === "forest") {
        g.fillStyle(0xc0d6d1, 0.025);
        for (let i = 0; i < 4; i++)
          g.fillEllipse(
            width * (0.15 + i * 0.25) + Math.sin(time / 5000 + i) * 22 * unit,
            height * (0.55 + (i % 2) * 0.12),
            width * 0.45,
            90 * unit,
          );
      }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width,
    height,
    backgroundColor: "#102823",
    banner: false,
    audio: { noAudio: true },
    fps: { target: 30 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: OpeningStage,
  });
  const visibility = () => {
    if (document.hidden) game.loop.sleep();
    else game.loop.wake();
  };
  document.addEventListener("visibilitychange", visibility);
  function stopWalking() {
    walkRevision++;
    current?.tweens.killTweensOf(position);
    walkEnd = undefined;
    if(actor?.texture.key === "hero-walk") actor.setFlipX(!actor.flipX);
    actor?.stop();actor?.setTexture("hero");placeActor();config.onMotion?.(false);
  }
  function walkTo(x: number, y: number) {
    if (destroyed) return;
    const route = planWalk(config.sceneKey ?? "", {x:position.x / width * 100,y:position.y / height * 100}, {x,y});
    if (!route.length) return;
    // Redirect the path without restarting the gait on every held-key repeat.
    walkRevision++;current?.tweens.killTweensOf(position);walkEnd=undefined;
    performance?.skip();
    Object.assign(position,{x:route[0].x / 100 * width,y:route[0].y / 100 * height});
    const ticket=walkRevision;
    const last=route[route.length-1];walkEnd={x:last.x / 100 * width,y:last.y / 100 * height};
    if (!actor || !current || config.reduced) { Object.assign(position,walkEnd);stopWalking();return; }
    config.onMotion?.(true);
    const step=(index:number) => {
      if(ticket!==walkRevision || destroyed || !actor || !current) return;
      if(index>=route.length){stopWalking();return;}
      const p={x:route[index].x / 100 * width,y:route[index].y / 100 * height};
      const distance=Math.hypot(p.x-position.x,p.y-position.y);
      if(distance<1){step(index+1);return;}
      // Generated walk frames face right; idle reference faces left.
      actor.setFlipX(current.textures.exists("hero-walk") ? p.x < position.x : p.x > position.x);
      if(current.textures.exists("hero-walk")) actor.play("walk",true);
      current.tweens.add({targets:position,...p,duration:Math.max(30,distance / Math.max(.1,unit) / .24),ease:"Linear",onUpdate:placeActor,onComplete:()=>step(index+1)});
    };
    step(0);
  }
  return {
    move(x,y) {
      const point=approachPoint(width,height,x,y);
      walkTo(point.x / width * 100,point.y / height * 100);
    },
    walkTo,
    skipPerformance(){performance?.skip();},
    getPosition(){return {x:position.x / width * 100,y:position.y / height * 100};},
    focus(id){
      for(const [key,person] of people){
        person.clearTint();
        if(key===id){ person.setTint(0xffedc5);
          if(!config.reduced && current){current.tweens.killTweensOf(person);person.setAngle(0);current.tweens.add({targets:person,angle:2,duration:140,yoyo:true,onComplete:()=>person.setAngle(0)});}
        }
      }
    },
    nudge(x,y){walkTo(position.x / width * 100+x,position.y / height * 100+y);},
    skipWalk(){if(walkEnd)Object.assign(position,walkEnd);stopWalking();},
    stop:stopWalking,
    settle(calm) {
      settled = calm;
      applyState();
    },
    sync(next) {
      const justRescued = !state.rescued && next.rescued;
      const changed =
        (!state.prepared && next.prepared) || (!state.rescued && next.rescued);
      if (changed) stopWalking();
      state = { ...next };
      applyState();
      // A single dispersing ring only after the persisted rescue transition.
      // Loading an already rescued save does not replay it.
      if (justRescued && current && config.gate && !config.reduced) {
        const release = current.add.circle(width * .51, height * .38, 106 * unit)
          .setStrokeStyle(3 * unit, 0xe6d7a4, .8).setDepth(height);
        current.tweens.add({ targets: release, scale: 1.6, alpha: 0, duration: 700,
          onComplete: () => release.destroy() });
      }
      performance?.sync(next);
    },
    destroy() {
      if (destroyed) return;
      stopWalking();
      destroyed = true;
      document.removeEventListener("visibilitychange", visibility);
      performance?.dispose();
      performance=undefined;
      game.destroy(true);
      current = undefined;
      actor = undefined;
      shadow = undefined;
      readiness = undefined;
      ring = undefined;
    },
  };
}
