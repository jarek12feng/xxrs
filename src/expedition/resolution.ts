import type { State } from "../world";
// Read-only consequences from choices already stored. Older cleared saves can reread;
// no invented decision, extra rewards or new persistence fields.
export function expeditionResolution(s: State) {
  if (s.expedition.cleared !== 3) return null;
  const discovery =
    "傀儡阵核裂开，掉出一卷带朱印的转运册。你将药签覆在缺角上，正好补成“雾海废驿·阵引”六字。名单记的不是欠款，而是被扣作阵引、运往雾海的药工。抢药箱的人要毁掉的，正是这份证据。";
  const evidence =
    "郁青认出姐姐留下的校药暗记：三点是救治，一道横线是扣留。她把被扣的人另抄成册，借药队往外传。青嶂翻开傀儡后颈的新符：“我的守阵符不会抽人的灵息。有人改了它，又借我的关口截下药队。”袭击与旧阵失控终于连在一起。";
  const rescue = {
    roots:
      "郁青看着你腕上的护根结：“你那时肯给后来的人留一株草，我才敢把姐姐的药签交给你。这次，我不再瞒着你。”他把完整名单放到你们两人之间。",
    supplies:
      "郁青摸了摸送到营地的药包：“你把药带回来，先救眼前的人，我一直记得。我怕你也劝我先放下姐姐，所以才瞒了你。”他展开名单：“现在有了证据，我想去找她。你愿意的话，我们一起走。”",
    legacy:
      "郁青把药签推到灯下：“先前没把姐姐的事说清，是我不敢相信还能查到这里。现在你也看见了，往后的路，我会把知道的都告诉你。”",
    none: "郁青把药签推到灯下：“现在你也看见了。往后的路，我会把知道的都告诉你。”",
  }[s.adventure.rescueChoice];
  const route = {
    none: "青嶂让出阵眼：“证据拿到了，这条路怎么留给后来人，你来定。”郁青没有催你，先把名单抄了一份交给山下药队。",
    legacy:
      "郁青收起备份：“我们沿旧路过去，至少先把名单送出去。”青嶂接过名册，答应留意仍未归来的药工。",
    medicine:
      "药站的第一盏灯亮起。郁青把姐姐的名字留在求医簿上：“若她自己走回来了，总要有个地方能找到我。”青嶂将茶碗推到你面前，答应替他守着这一页。",
    sword:
      "药车驶过新路。郁青将残存的名字抄在车板上：“多一辆车，就能多接几个人。但石上的名字没了，纸上的不能再丢。”青嶂没有接茶，只把一片有字的碎石放进他的手里。",
    array:
      "郁青在通行时刻旁加了一栏“接人”：“我会按约回来。有人没到，就给他留下一班。”青嶂点头，让他亲手敲响开关的三声木杖。",
  }[s.adventure.road.solution];
  return {
    title: "名单上的人，原来还在等归途",
    discovery,
    evidence,
    response: rescue,
    route,
    next: "最后一页有姐姐留下的短句：“若我未归，去雾海废驿查交接簿，别只问活着的人。”你们已知道药工被送往哪里，却还不知道她是否也在其中。旅亭的归路记好后，循雾海来信前往废驿，核对这批人的去向。",
  };
}

export function expeditionMistEcho(s: State, action: string) {
  if (s.expedition.cleared !== 3) return "";
  if (action === "accept")
    return "你把青嶂关的转运册与来信放在一起。两份纸上都有雾海废驿的朱印；这一趟还要替郁青核对被扣药工的交接记录。";
  if (action === "decode")
    return "废驿交接簿的批次与转运册完全相合。姐姐的校药暗记出现在“随队救治”一栏，而非押送者一栏：她不是替劫药者带路，是跟着被扣的药工进了雾海。最后一笔仍在提醒后来者，别把伤者留在阵里。";
  if (action === "share" && !s.adventure.mist.station)
    return "你把青嶂关的转运册交还郁青，也坦言此行还未核实废驿交接簿。他点点头：‘有证据的就告诉家属，没查清的先留着。姐姐的事，我会等下一次消息。’你们没有把猜测当作她的下落。";
  if (action === "share")
    return "你另抄了一份交接记录留给郁青。他读到“随队救治”时，终于松开攥皱的药签：“原来她不是不要我们了。”他没有把这句话当作姐姐平安的证明，先逐户送去查实的药工去向，再与你约定追查尚未归来的人。";
  return "";
}
