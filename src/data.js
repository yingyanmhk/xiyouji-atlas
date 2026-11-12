// 45 scenes in the order of the journey: 7 of the prologue, Chang'an, 36 stations of the road, Vulture Peak.
// Quotations are from the 百回本 original (public domain); notes are written for this atlas.
// TODO(P1): verify every 回目 / 原文 against a reference edition (人民文学出版社 1980).

export const CATEGORIES = [
  { id: 'origin', name: '前传', long: '前传 · 大闹天宫', color: '#d9a441' },
  { id: 'disciple', name: '收徒', long: '收徒 · 五圣聚首', color: '#6fae7f' },
  { id: 'backed', name: '有来头的', long: '有来头的 · 天上下来的妖', color: '#7f8fd6' },
  { id: 'wild', name: '野妖精', long: '野妖精 · 没有靠山的妖', color: '#c46a4a' },
  { id: 'realm', name: '人间国', long: '人间国 · 凡人的劫', color: '#b28fc4' },
  { id: 'trial', name: '仙佛试炼', long: '仙佛试炼 · 考验与心魔', color: '#4fb0b0' },
  { id: 'end', name: '灵山', long: '灵山 · 取经圆满', color: '#f0c860' },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, { ...c, index: i }]));

// [id, name, cat, hui]
const RAW = [
  ['huaguoshan', '花果山·水帘洞', 'origin', '1'],
  ['sanxingdong', '斜月三星洞', 'origin', '1–2'],
  ['longgong', '东海龙宫', 'origin', '3'],
  ['difu', '幽冥地府', 'origin', '3'],
  ['pantaoyuan', '蟠桃园', 'origin', '5'],
  ['doushuaigong', '兜率宫·八卦炉', 'origin', '7'],
  ['wuxingshan', '五行山', 'disciple', '7, 14'],
  ['changan', '长安', 'origin', '9–12'],
  ['yingchoujian', '鹰愁涧', 'disciple', '15'],
  ['guanyinyuan', '观音禅院', 'backed', '16–17'],
  ['gaolaozhuang', '高老庄', 'disciple', '18–19'],
  ['huangfengling', '黄风岭', 'backed', '20–21'],
  ['liushahe', '流沙河', 'disciple', '22'],
  ['sisheng', '四圣试禅心', 'trial', '23'],
  ['wuzhuangguan', '五庄观', 'trial', '24–26'],
  ['baihuling', '白虎岭', 'wild', '27'],
  ['baoxiangguo', '宝象国·波月洞', 'backed', '28–31'],
  ['pingdingshan', '平顶山·莲花洞', 'backed', '32–35'],
  ['wujiguo', '乌鸡国', 'backed', '36–39'],
  ['huoyundong', '火云洞', 'backed', '40–42'],
  ['heishuihe', '黑水河', 'backed', '43'],
  ['chechiguo', '车迟国', 'wild', '44–46'],
  ['tongtianhe', '通天河', 'backed', '47–49'],
  ['jindoudong', '金兜洞', 'backed', '50–52'],
  ['nverguo', '女儿国', 'realm', '53–54'],
  ['pipadong', '琵琶洞', 'wild', '55'],
  ['zhenjia', '真假美猴王', 'trial', '56–58'],
  ['huoyanshan', '火焰山', 'wild', '59–61'],
  ['jisaiguo', '祭赛国', 'realm', '62–63'],
  ['jingjiling', '荆棘岭', 'wild', '64'],
  ['xiaoleiyin', '小雷音寺', 'backed', '65–66'],
  ['xishitong', '稀柿衕', 'wild', '67'],
  ['zhuziguo', '朱紫国', 'backed', '68–71'],
  ['pansidong', '盘丝洞', 'wild', '72–73'],
  ['shituoling', '狮驼岭', 'backed', '74–77'],
  ['biqiuguo', '比丘国', 'backed', '78–79'],
  ['wudidong', '无底洞', 'backed', '80–83'],
  ['miefaguo', '灭法国', 'realm', '84–85'],
  ['yinwushan', '隐雾山', 'wild', '85–86'],
  ['fengxianjun', '凤仙郡', 'realm', '87'],
  ['yuhuazhou', '玉华州', 'backed', '88–90'],
  ['jinpingfu', '金平府', 'wild', '91–92'],
  ['tianzhuguo', '天竺国', 'backed', '93–95'],
  ['tongtaifu', '铜台府', 'realm', '96–97'],
  ['lingshan', '灵山·雷音寺', 'end', '98–100'],
];

// full texts for the scenes that are built
const TEXT = {
  huaguoshan: {
    title: '第一回　灵根孕育源流出　心性修持大道生',
    quote: '海外有一国土，名曰傲来国。国近大海，海中有一座名山，唤为花果山。……那座山正当顶上，有一块仙石。',
    note: '山顶仙石受天真地秀、日精月华，一日迸裂，产一石卵，见风化作石猴。石猴率先跳入瀑布，发现水帘之后别有洞天，众猴遂拜他为美猴王。一切从这块石头开始。',
  },
  huoyanshan: {
    title: '第五十九回　唐三藏路阻火焰山　孙行者一调芭蕉扇',
    quote: '那火焰山有八百里火焰，四周围寸草不生。若过得山，就是铜脑盖，铁身躯，也要化成汁哩！',
    note: '土地说破了来历：五百年前大圣蹬倒八卦炉，落下几块带火的炉砖，化成了这座山。挡住取经路的火，是悟空自己放的。三调芭蕉扇——一扇息火，二扇生风，三扇下雨。',
  },
  tongtianhe: {
    title: '第四十八回　魔弄寒风飘大雪　僧思拜佛履层冰',
    quote: '径过八百里，亘古少人行。',
    note: '河边石碑上只写了这十个字。灵感大王作法降雪，一夜冻住八百里河面，师徒踏冰西行，行至河心冰裂，唐僧落入水府。那妖怪原是观音莲花池里养大的金鱼。取经归来的第八十一难，老鼋驮经落水，也在这条河上。',
  },
};

// texts written by the scene builders: docs/texts/<builder>.json → { id: { title, quote, note } }
// (nan81.json and tour.json are other data, loaded separately)
const BUILT_TEXTS = Object.assign({}, ...Object.entries(import.meta.glob('../docs/texts/*.json', { eager: true, import: 'default' }))
  .filter(([k]) => !/nan81|tour/.test(k)).map(([, v]) => v));
for (const [id, t] of Object.entries(BUILT_TEXTS)) if (t && typeof t === 'object' && !Array.isArray(t)) TEXT[id] = { ...TEXT[id], ...t };

export const SCENES = RAW.map(([id, name, cat, hui], i) => ({
  id, name, cat, hui, index: i,
  title: TEXT[id]?.title || `第${hui}回`,
  quote: TEXT[id]?.quote || '',
  note: TEXT[id]?.note || '（尚未建造）',
}));
export const SCENE = Object.fromEntries(SCENES.map((s) => [s.id, s]));
