# 金丹攻击法宝生成提示词

工具：内置 image_gen；两次调用均设置 transparent_background=true。
第一张独立生成，第二张以上一张原图为编辑目标，以确保同源造型。

## tide-embryo

```text
Use case: stylized-concept
Asset type: Chinese cultivation RPG inventory icon, square transparent isolated item.
Primary request: 潮纹剑胚, an ancient damaged but repairable unfinished short Chinese jian sword blank, dark blue-green bronze with weathered tidal engravings. ONE single object.
Composition: whole sword diagonally from lower left pommel to upper right tip, centered, occupying about 82 percent of square, generous transparent margin, readable at 64px. Broad simple silhouette, short unfinished blunt blade with one conspicuous chipped edge and a few repairable cracks, not shattered.
Design identity: simple oval bronze pommel with a hollow crescent tide motif, short dark wrapped grip, small curved wave-shaped Chinese sword guard (not long crossguard), three flowing parallel tidal grooves along the blade. Restrained antique Chinese xianxia hand-painted realistic game art, crisp cutout edges, tactile bronze, modest pale turquoise patina in recesses, no excessive glow.
Constraints: real transparent alpha background, no floor, no shadow plane, no scenery, no card frame, no text, no watermark, no detached fragments, no Western greatsword, no gems, no hands. The blade is unfinished but clearly a sword artifact.
```

## tide-blade

参考/编辑目标：originals/tide-embryo.png。

```text
Use case: precise-object-edit
Asset type: Chinese cultivation RPG inventory icon, square transparent isolated item.
Input image: the supplied tide sword embryo is the edit target and exact design identity reference.
Primary request: transform this same damaged unfinished sword blank into its fully repaired and spiritually nourished mature form, 潮纹剑, a restrained Eastern Chinese xianxia offensive magical artifact.
Preserve: same bottom-left to top-right diagonal pose, same small wave-shaped Chinese guard, same hollow oval crescent-wave pommel, dark wrapped grip, three flowing parallel tide grooves, dark blue-green bronze identity, centered whole object with clear transparent margin.
Change: eliminate ALL cracks and missing edge pieces; refine the broad blunt blank into a complete elegant tapered straight double-edged Chinese jian blade with a clear sharp point and silver-teal edge, visibly smoother and slightly more slender than the embryo, dark teal metal core, clean bronze guard and pommel, tide engravings with restrained pale turquoise inner light. It must look like the SAME ancient artifact restored, not an unrelated new weapon.
Style: refined hand-painted realistic game item art, crisp readable silhouette at 64px, tangible metal, no overpowering glow.
Constraints: ONE object only, actual transparent alpha background, no floor, no shadow plane, no text, no watermark, no frames, no scenery, no particles, no Western crossguard or greatsword, no jewels, no hands. Full sword uncut inside square canvas.
```
