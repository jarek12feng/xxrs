import Phaser from 'phaser';
import { createActionSequence, type ActionSnapshot, type ActionFrame, type ActionSequence, type ActionEndReason } from './action-sequence';

/** Scene-only choreography. All outcomes have already been saved by the caller. */
export function createActionPlayer(scene: Phaser.Scene, options: {
  initial: ActionSnapshot; reduced: boolean | (() => boolean); width: number; height: number; unit: number;
  sceneKey?: string; hero?: Phaser.GameObjects.Sprite; worker?: Phaser.GameObjects.Image;
  shadow?: Phaser.GameObjects.Ellipse; onCaption?: (text: string) => void;
  restore: (sequence?: ActionSequence, reason?: ActionEndReason) => void;
}) {
  const {width,height,unit}=options;
  let image: Phaser.GameObjects.Image | undefined;
  let extra: Phaser.Time.TimerEvent | undefined;
  let disposed=false;
  const clear = (sequence?:ActionSequence, reason?:ActionEndReason) => {
    extra?.remove(false);extra=undefined;
    if(image){scene.tweens.killTweensOf(image);image.destroy();image=undefined;}
    options.hero?.setVisible(true);options.shadow?.setVisible(true);
    options.onCaption?.('');options.restore(sequence,reason);
  };
  function frameAt(frame: number, x: number, y: number, pair=false) {
    if(!scene.textures.exists('hero-sequence')) return false;
    image ??= scene.add.image(x,y,'hero-sequence',frame);
    scene.tweens.killTweensOf(image);
    image.setTexture('hero-sequence',frame).setPosition(x,y).setOrigin(.5,.985)
      .setScale(220 * unit / (image.height * .96)).setDepth(y+1).setAlpha(1);
    options.hero?.setVisible(false);options.shadow?.setVisible(false);
    if(pair) options.worker?.setVisible(false);
    return true;
  }
  function show(frame: ActionFrame) {
    extra?.remove(false);extra=undefined;
    options.onCaption?.(frame.label);
    if(frame.sequence==='rescue') {
      const index=frame.index===0?4:frame.index===1?5:6;
      const x=width*(frame.index===2?.40:.47),y=height*.78;
      if(frameAt(index,x,y,frame.index===2))options.worker?.setVisible(false);
      if(frame.index===2) extra=scene.time.delayedCall(frame.durationMs*.6,()=>{
        if(!disposed)frameAt(7,width*.36,height*.80,true);
      });
    } else if(frame.sequence==='medicine') {
      frameAt(frame.index,width*.30,height*.78);
      if(frame.phase==='seal') extra=scene.time.delayedCall(frame.durationMs*.6,()=>{
        if(!disposed)frameAt(3,width*.30,height*.78);
      });
    } else {
      // Existing character-specific guard pose for methods without a dedicated sheet.
      if(scene.textures.exists('hero-action')) options.hero?.setTexture('hero-action');
    }
  }
  const timeline=createActionSequence({initial:options.initial,reduced:options.reduced,
    schedule:(delay,callback)=>scene.time.delayedCall(delay,callback),cancel:timer=>timer.remove(false),
    onFrame:show,onEnd:(sequence,reason)=>clear(sequence,reason)});
  return {
    sync:timeline.sync, skip:timeline.skip,
    get active(){return timeline.active;},
    dispose(){if(disposed)return;disposed=true;timeline.dispose();},
  };
}
