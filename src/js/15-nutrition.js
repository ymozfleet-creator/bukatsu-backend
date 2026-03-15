// 15 - 栄養管理: FOOD_DB(176品), 食事記録, AI写真解析, PFC分析, 週間トレンド
const FOOD_DB=[
  // ===== 主食（16品） =====
  {name:'白ごはん（1膳150g）',kcal:252,protein:3.8,carb:55.7,fat:0.5,fiber:0.5,vitB1:0.03,vitC:0,calcium:5,iron:0.2,sodium:2,zinc:0.9,magnesium:11,vitD:0,omega3:0,gi:84,serving:150,cat:'主食'},
  {name:'玄米ごはん（1膳150g）',kcal:248,protein:4.2,carb:53.4,fat:1.5,fiber:2.1,vitB1:0.24,vitC:0,calcium:11,iron:0.9,sodium:2,zinc:1.2,magnesium:74,vitD:0,omega3:0,gi:56,serving:150,cat:'主食'},
  {name:'食パン（6枚切り1枚）',kcal:158,protein:5.6,carb:28.0,fat:2.6,fiber:1.4,vitB1:0.04,vitC:0,calcium:29,iron:0.4,sodium:310,zinc:0.4,magnesium:12,vitD:0,omega3:0,gi:91,serving:60,cat:'主食'},
  {name:'うどん（1玉230g）',kcal:242,protein:6.0,carb:49.7,fat:0.9,fiber:1.4,vitB1:0.05,vitC:0,calcium:14,iron:0.5,sodium:340,zinc:0.2,magnesium:9,vitD:0,omega3:0,gi:80,serving:230,cat:'主食'},
  {name:'パスタ（乾100g）',kcal:378,protein:13.0,carb:72.2,fat:2.2,fiber:2.7,vitB1:0.21,vitC:0,calcium:18,iron:1.4,sodium:4,zinc:1.5,magnesium:55,vitD:0,omega3:0,gi:65,serving:100,cat:'主食'},
  {name:'そば（1玉170g）',kcal:224,protein:8.2,carb:43.2,fat:1.7,fiber:2.9,vitB1:0.12,vitC:0,calcium:17,iron:1.4,sodium:2,zinc:0.7,magnesium:27,vitD:0,omega3:0,gi:59,serving:170,cat:'主食'},
  {name:'もち（1個50g）',kcal:118,protein:2.1,carb:25.2,fat:0.4,fiber:0.3,vitB1:0.02,vitC:0,calcium:3,iron:0.2,sodium:1,zinc:0.4,magnesium:4,vitD:0,omega3:0,gi:85,serving:50,cat:'主食'},
  {name:'オートミール（30g）',kcal:114,protein:4.1,carb:20.7,fat:1.7,fiber:2.8,vitB1:0.06,vitC:0,calcium:14,iron:1.2,sodium:1,zinc:0.7,magnesium:30,vitD:0,omega3:0,gi:55,serving:30,cat:'主食'},
  {name:'おにぎり（鮭）',kcal:183,protein:4.8,carb:37.0,fat:1.2,fiber:0.4,vitB1:0.04,vitC:0,calcium:8,iron:0.3,sodium:390,zinc:0.5,magnesium:10,vitD:0,omega3:0.1,gi:76,serving:110,cat:'主食'},
  {name:'おにぎり（ツナマヨ）',kcal:232,protein:5.2,carb:37.0,fat:6.5,fiber:0.4,vitB1:0.03,vitC:0,calcium:8,iron:0.3,sodium:420,zinc:0.4,magnesium:9,vitD:0,omega3:0.2,gi:76,serving:110,cat:'主食'},
  {name:'おにぎり（梅）',kcal:170,protein:3.5,carb:37.0,fat:0.5,fiber:0.4,vitB1:0.02,vitC:0,calcium:8,iron:0.3,sodium:560,zinc:0.3,magnesium:8,vitD:0,omega3:0,gi:76,serving:110,cat:'主食'},
  {name:'赤飯おにぎり',kcal:200,protein:4.2,carb:42.0,fat:0.8,fiber:1.2,vitB1:0.04,vitC:0,calcium:12,iron:0.8,sodium:250,zinc:0.6,magnesium:15,vitD:0,omega3:0,gi:72,serving:110,cat:'主食'},
  {name:'お茶漬け（1杯）',kcal:220,protein:5.0,carb:45.0,fat:0.8,fiber:0.5,vitB1:0.03,vitC:0,calcium:10,iron:0.3,sodium:650,zinc:0.5,magnesium:12,vitD:0,omega3:0,gi:82,serving:250,cat:'主食'},
  {name:'食パン（全粒粉・1枚）',kcal:145,protein:6.2,carb:24.0,fat:2.8,fiber:3.5,vitB1:0.12,vitC:0,calcium:35,iron:1.0,sodium:300,zinc:0.8,magnesium:30,vitD:0,omega3:0,gi:50,serving:60,cat:'主食'},
  {name:'コーンフレーク（40g）',kcal:152,protein:2.8,carb:34.0,fat:0.4,fiber:1.0,vitB1:0.40,vitC:0,calcium:2,iron:3.2,sodium:280,zinc:0.2,magnesium:8,vitD:0,omega3:0,gi:81,serving:40,cat:'主食'},
  {name:'グラノーラ（50g）',kcal:220,protein:4.0,carb:36.0,fat:7.0,fiber:2.5,vitB1:0.30,vitC:0,calcium:20,iron:2.5,sodium:110,zinc:0.5,magnesium:25,vitD:0,omega3:0.1,gi:55,serving:50,cat:'主食'},
  // ===== 肉類（14品） =====
  {name:'鶏むね肉（皮なし100g）',kcal:108,protein:22.3,carb:0,fat:1.5,fiber:0,vitB1:0.10,vitC:3,calcium:4,iron:0.3,sodium:46,zinc:0.6,magnesium:28,vitD:0.1,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'鶏もも肉（皮なし100g）',kcal:116,protein:18.8,carb:0,fat:3.9,fiber:0,vitB1:0.07,vitC:3,calcium:5,iron:0.6,sodium:70,zinc:1.6,magnesium:22,vitD:0.1,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'ささみ（100g）',kcal:105,protein:23.0,carb:0,fat:0.8,fiber:0,vitB1:0.09,vitC:3,calcium:3,iron:0.2,sodium:33,zinc:0.6,magnesium:31,vitD:0.1,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'牛もも肉（100g）',kcal:182,protein:21.2,carb:0.3,fat:10.7,fiber:0,vitB1:0.09,vitC:1,calcium:4,iron:2.7,sodium:47,zinc:4.2,magnesium:22,vitD:0,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'牛ヒレ肉（100g）',kcal:133,protein:20.5,carb:0.3,fat:4.8,fiber:0,vitB1:0.09,vitC:1,calcium:3,iron:2.5,sodium:45,zinc:4.0,magnesium:24,vitD:0,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'豚ロース（100g）',kcal:263,protein:19.3,carb:0.2,fat:19.2,fiber:0,vitB1:0.69,vitC:1,calcium:4,iron:0.3,sodium:50,zinc:1.9,magnesium:22,vitD:0.1,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'豚ヒレ肉（100g）',kcal:115,protein:22.8,carb:0.2,fat:1.9,fiber:0,vitB1:0.98,vitC:1,calcium:4,iron:0.9,sodium:42,zinc:2.1,magnesium:25,vitD:0.3,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'豚バラ肉（100g）',kcal:386,protein:14.2,carb:0.1,fat:34.6,fiber:0,vitB1:0.54,vitC:1,calcium:4,iron:0.6,sodium:48,zinc:1.8,magnesium:14,vitD:0.2,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'サラダチキン（1個110g）',kcal:121,protein:24.2,carb:1.1,fat:1.3,fiber:0,vitB1:0.10,vitC:0,calcium:5,iron:0.3,sodium:580,zinc:0.6,magnesium:28,vitD:0,omega3:0,gi:0,serving:110,cat:'肉'},
  {name:'鶏レバー（100g）',kcal:111,protein:18.9,carb:0.6,fat:3.1,fiber:0,vitB1:0.38,vitC:20,calcium:5,iron:9.0,sodium:85,zinc:3.3,magnesium:19,vitD:0.2,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'合挽きミンチ（100g）',kcal:259,protein:17.3,carb:0,fat:19.7,fiber:0,vitB1:0.12,vitC:1,calcium:7,iron:1.5,sodium:52,zinc:3.0,magnesium:18,vitD:0.1,omega3:0,gi:0,serving:100,cat:'肉'},
  {name:'ウインナー（2本50g）',kcal:161,protein:6.5,carb:1.5,fat:14.5,fiber:0,vitB1:0.11,vitC:5,calcium:6,iron:0.5,sodium:400,zinc:0.8,magnesium:7,vitD:0.2,omega3:0,gi:0,serving:50,cat:'肉'},
  {name:'ハム（2枚30g）',kcal:58,protein:5.0,carb:0.4,fat:4.0,fiber:0,vitB1:0.18,vitC:10,calcium:3,iron:0.2,sodium:350,zinc:0.5,magnesium:6,vitD:0.1,omega3:0,gi:0,serving:30,cat:'肉'},
  {name:'ベーコン（2枚30g）',kcal:122,protein:3.9,carb:0.1,fat:11.7,fiber:0,vitB1:0.15,vitC:10,calcium:2,iron:0.2,sodium:450,zinc:0.5,magnesium:5,vitD:0.1,omega3:0,gi:0,serving:30,cat:'肉'},
  // ===== 魚介（10品） =====
  {name:'鮭（1切れ80g）',kcal:106,protein:17.8,carb:0.1,fat:3.4,fiber:0,vitB1:0.19,vitC:1,calcium:10,iron:0.4,sodium:52,zinc:0.4,magnesium:22,vitD:25.6,omega3:1.4,gi:0,serving:80,cat:'魚'},
  {name:'まぐろ赤身（刺身5切80g）',kcal:100,protein:21.1,carb:0.1,fat:1.1,fiber:0,vitB1:0.08,vitC:2,calcium:4,iron:0.9,sodium:38,zinc:0.3,magnesium:34,vitD:4.0,omega3:0.1,gi:0,serving:80,cat:'魚'},
  {name:'サバ（1切れ80g）',kcal:202,protein:16.5,carb:0.2,fat:14.2,fiber:0,vitB1:0.17,vitC:1,calcium:5,iron:1.0,sodium:60,zinc:0.8,magnesium:26,vitD:8.8,omega3:2.7,gi:0,serving:80,cat:'魚'},
  {name:'ツナ缶（1缶70g）',kcal:186,protein:12.5,carb:0.1,fat:14.9,fiber:0,vitB1:0.01,vitC:0,calcium:4,iron:0.4,sodium:250,zinc:0.4,magnesium:18,vitD:2.0,omega3:0.5,gi:0,serving:70,cat:'魚'},
  {name:'えび（100g）',kcal:82,protein:18.4,carb:0.3,fat:0.6,fiber:0,vitB1:0.02,vitC:0,calcium:56,iron:0.1,sodium:170,zinc:1.4,magnesium:40,vitD:0,omega3:0.3,gi:0,serving:100,cat:'魚'},
  {name:'サバ缶・水煮（1缶190g）',kcal:332,protein:39.7,carb:0.4,fat:19.4,fiber:0,vitB1:0.30,vitC:0,calcium:520,iron:3.4,sodium:600,zinc:3.4,magnesium:57,vitD:22.0,omega3:5.7,gi:0,serving:190,cat:'魚'},
  {name:'しらす干し（20g）',kcal:25,protein:4.8,carb:0.1,fat:0.6,fiber:0,vitB1:0.01,vitC:0,calcium:104,iron:0.1,sodium:260,zinc:0.3,magnesium:12,vitD:12.2,omega3:0.3,gi:0,serving:20,cat:'魚'},
  {name:'鯖の塩焼き（1切れ100g）',kcal:230,protein:20.6,carb:0.1,fat:16.0,fiber:0,vitB1:0.20,vitC:1,calcium:8,iron:1.2,sodium:380,zinc:1.0,magnesium:30,vitD:11.0,omega3:3.0,gi:0,serving:100,cat:'魚'},
  {name:'サーモン刺身（5切80g）',kcal:140,protein:16.0,carb:0.2,fat:8.0,fiber:0,vitB1:0.15,vitC:1,calcium:8,iron:0.3,sodium:40,zinc:0.3,magnesium:24,vitD:28.0,omega3:1.8,gi:0,serving:80,cat:'魚'},
  {name:'かつおのたたき（100g）',kcal:114,protein:25.0,carb:0.1,fat:0.5,fiber:0,vitB1:0.10,vitC:0,calcium:8,iron:1.9,sodium:38,zinc:0.8,magnesium:38,vitD:9.0,omega3:0.1,gi:0,serving:100,cat:'魚'},
  // ===== 卵・大豆（8品） =====
  {name:'卵（1個60g）',kcal:91,protein:7.4,carb:0.2,fat:6.2,fiber:0,vitB1:0.04,vitC:0,calcium:31,iron:1.1,sodium:84,zinc:0.8,magnesium:7,vitD:1.8,omega3:0.2,gi:0,serving:60,cat:'卵・大豆'},
  {name:'ゆで卵（1個60g）',kcal:91,protein:7.7,carb:0.2,fat:6.0,fiber:0,vitB1:0.04,vitC:0,calcium:30,iron:1.0,sodium:84,zinc:0.8,magnesium:7,vitD:1.8,omega3:0.2,gi:0,serving:60,cat:'卵・大豆'},
  {name:'目玉焼き（1個75g）',kcal:120,protein:7.6,carb:0.3,fat:9.5,fiber:0,vitB1:0.04,vitC:0,calcium:30,iron:1.0,sodium:120,zinc:0.8,magnesium:7,vitD:1.8,omega3:0.2,gi:0,serving:75,cat:'卵・大豆'},
  {name:'納豆（1パック50g）',kcal:100,protein:8.3,carb:6.1,fat:5.0,fiber:3.4,vitB1:0.04,vitC:0,calcium:45,iron:1.7,sodium:3,zinc:1.0,magnesium:50,vitD:0,omega3:0.4,gi:33,serving:50,cat:'卵・大豆'},
  {name:'豆腐・木綿（150g）',kcal:108,protein:10.5,carb:2.4,fat:6.3,fiber:0.6,vitB1:0.11,vitC:0,calcium:129,iron:1.4,sodium:9,zinc:0.9,magnesium:44,vitD:0,omega3:0,gi:42,serving:150,cat:'卵・大豆'},
  {name:'豆腐・絹ごし（150g）',kcal:84,protein:7.4,carb:2.7,fat:4.5,fiber:0.5,vitB1:0.15,vitC:0,calcium:57,iron:0.6,sodium:7,zinc:0.5,magnesium:30,vitD:0,omega3:0,gi:42,serving:150,cat:'卵・大豆'},
  {name:'豆乳（200ml）',kcal:88,protein:7.2,carb:6.2,fat:4.0,fiber:0.4,vitB1:0.06,vitC:0,calcium:31,iron:1.2,sodium:4,zinc:0.6,magnesium:50,vitD:0,omega3:0.4,gi:44,serving:200,cat:'卵・大豆'},
  {name:'枝豆（100g・さや付き）',kcal:135,protein:11.7,carb:8.8,fat:6.2,fiber:5.0,vitB1:0.31,vitC:27,calcium:58,iron:2.7,sodium:1,zinc:1.4,magnesium:62,vitD:0,omega3:0.3,gi:30,serving:100,cat:'卵・大豆'},
  // ===== 乳製品（8品） =====
  {name:'牛乳（200ml）',kcal:134,protein:6.6,carb:9.6,fat:7.6,fiber:0,vitB1:0.08,vitC:2,calcium:220,iron:0.04,sodium:82,zinc:0.8,magnesium:20,vitD:0.6,omega3:0,gi:27,serving:200,cat:'乳製品'},
  {name:'ヨーグルト（100g）',kcal:62,protein:3.6,carb:4.9,fat:3.0,fiber:0,vitB1:0.04,vitC:1,calcium:120,iron:0.01,sodium:48,zinc:0.4,magnesium:12,vitD:0.1,omega3:0,gi:36,serving:100,cat:'乳製品'},
  {name:'ギリシャヨーグルト（100g）',kcal:59,protein:10.0,carb:3.6,fat:0.2,fiber:0,vitB1:0.04,vitC:1,calcium:110,iron:0.1,sodium:36,zinc:0.5,magnesium:11,vitD:0.1,omega3:0,gi:36,serving:100,cat:'乳製品'},
  {name:'プロテイン（1杯30g）',kcal:120,protein:24.0,carb:3.0,fat:1.5,fiber:0,vitB1:0.30,vitC:0,calcium:100,iron:2.0,sodium:110,zinc:1.5,magnesium:20,vitD:1.0,omega3:0,gi:20,serving:30,cat:'乳製品'},
  {name:'チーズ（1切れ20g）',kcal:68,protein:4.5,carb:0.3,fat:5.2,fiber:0,vitB1:0.01,vitC:0,calcium:126,iron:0.1,sodium:140,zinc:0.6,magnesium:4,vitD:0.1,omega3:0,gi:0,serving:20,cat:'乳製品'},
  {name:'カッテージチーズ（50g）',kcal:53,protein:6.8,carb:1.0,fat:2.3,fiber:0,vitB1:0.01,vitC:0,calcium:28,iron:0.1,sodium:200,zinc:0.3,magnesium:5,vitD:0,omega3:0,gi:10,serving:50,cat:'乳製品'},
  {name:'アイスクリーム（100g）',kcal:212,protein:3.5,carb:23.2,fat:12.0,fiber:0,vitB1:0.04,vitC:1,calcium:140,iron:0.1,sodium:80,zinc:0.4,magnesium:12,vitD:0.1,omega3:0,gi:61,serving:100,cat:'乳製品'},
  {name:'飲むヨーグルト（200ml）',kcal:130,protein:5.8,carb:21.0,fat:2.0,fiber:0,vitB1:0.06,vitC:2,calcium:220,iron:0,sodium:90,zinc:0.6,magnesium:18,vitD:0,omega3:0,gi:46,serving:200,cat:'乳製品'},
  // ===== 野菜（10品） =====
  {name:'ブロッコリー（100g）',kcal:33,protein:4.3,carb:5.2,fat:0.5,fiber:4.4,vitB1:0.14,vitC:120,calcium:38,iron:1.0,sodium:20,zinc:0.7,magnesium:26,vitD:0,omega3:0.1,gi:15,serving:100,cat:'野菜'},
  {name:'ほうれん草（100g）',kcal:20,protein:2.2,carb:3.1,fat:0.4,fiber:2.8,vitB1:0.11,vitC:35,calcium:49,iron:2.0,sodium:16,zinc:0.7,magnesium:69,vitD:0,omega3:0.1,gi:15,serving:100,cat:'野菜'},
  {name:'トマト（1個150g）',kcal:29,protein:1.1,carb:7.1,fat:0.2,fiber:1.5,vitB1:0.08,vitC:23,calcium:11,iron:0.3,sodium:5,zinc:0.2,magnesium:14,vitD:0,omega3:0,gi:30,serving:150,cat:'野菜'},
  {name:'アボカド（1/2個70g）',kcal:131,protein:1.8,carb:4.3,fat:13.1,fiber:3.7,vitB1:0.07,vitC:7,calcium:6,iron:0.5,sodium:5,zinc:0.5,magnesium:22,vitD:0,omega3:0.1,gi:10,serving:70,cat:'野菜'},
  {name:'キャベツ（100g）',kcal:23,protein:1.3,carb:5.2,fat:0.2,fiber:1.8,vitB1:0.04,vitC:41,calcium:43,iron:0.3,sodium:5,zinc:0.2,magnesium:14,vitD:0,omega3:0,gi:26,serving:100,cat:'野菜'},
  {name:'サラダ（1皿）',kcal:35,protein:1.5,carb:5.0,fat:0.5,fiber:2.0,vitB1:0.05,vitC:20,calcium:30,iron:0.5,sodium:10,zinc:0.3,magnesium:15,vitD:0,omega3:0,gi:15,serving:120,cat:'野菜'},
  {name:'にんじん（1本150g）',kcal:54,protein:0.9,carb:13.2,fat:0.2,fiber:3.9,vitB1:0.07,vitC:9,calcium:42,iron:0.3,sodium:39,zinc:0.3,magnesium:15,vitD:0,omega3:0,gi:47,serving:150,cat:'野菜'},
  {name:'さつまいも（100g）',kcal:132,protein:1.2,carb:31.5,fat:0.2,fiber:2.3,vitB1:0.11,vitC:29,calcium:40,iron:0.7,sodium:4,zinc:0.2,magnesium:25,vitD:0,omega3:0,gi:46,serving:100,cat:'野菜'},
  {name:'じゃがいも（1個150g）',kcal:114,protein:2.4,carb:26.3,fat:0.2,fiber:2.0,vitB1:0.13,vitC:53,calcium:5,iron:0.6,sodium:2,zinc:0.3,magnesium:30,vitD:0,omega3:0,gi:66,serving:150,cat:'野菜'},
  {name:'かぼちゃ（100g）',kcal:91,protein:1.9,carb:20.6,fat:0.3,fiber:3.5,vitB1:0.07,vitC:43,calcium:15,iron:0.5,sodium:1,zinc:0.3,magnesium:25,vitD:0,omega3:0,gi:65,serving:100,cat:'野菜'},
  // ===== 果物（6品） =====
  {name:'バナナ（1本100g）',kcal:86,protein:1.1,carb:22.5,fat:0.2,fiber:1.1,vitB1:0.05,vitC:16,calcium:6,iron:0.3,sodium:1,zinc:0.2,magnesium:32,vitD:0,omega3:0,gi:51,serving:100,cat:'果物'},
  {name:'りんご（1個250g）',kcal:145,protein:0.5,carb:38.8,fat:0.3,fiber:3.8,vitB1:0.05,vitC:10,calcium:8,iron:0.3,sodium:0,zinc:0.1,magnesium:8,vitD:0,omega3:0,gi:36,serving:250,cat:'果物'},
  {name:'オレンジ（1個180g）',kcal:69,protein:1.6,carb:17.3,fat:0.2,fiber:1.8,vitB1:0.16,vitC:72,calcium:36,iron:0.5,sodium:1,zinc:0.2,magnesium:18,vitD:0,omega3:0,gi:42,serving:180,cat:'果物'},
  {name:'キウイ（1個80g）',kcal:42,protein:0.8,carb:10.8,fat:0.1,fiber:2.0,vitB1:0.01,vitC:56,calcium:26,iron:0.2,sodium:2,zinc:0.1,magnesium:10,vitD:0,omega3:0,gi:39,serving:80,cat:'果物'},
  {name:'みかん（1個80g）',kcal:37,protein:0.6,carb:9.4,fat:0.1,fiber:0.8,vitB1:0.08,vitC:26,calcium:17,iron:0.2,sodium:1,zinc:0.1,magnesium:9,vitD:0,omega3:0,gi:33,serving:80,cat:'果物'},
  {name:'ぶどう（1房150g）',kcal:89,protein:0.6,carb:23.6,fat:0.2,fiber:0.8,vitB1:0.08,vitC:3,calcium:9,iron:0.2,sodium:2,zinc:0.2,magnesium:9,vitD:0,omega3:0,gi:46,serving:150,cat:'果物'},
  // ===== 外食・コンビニ（18品） =====
  {name:'牛丼（並盛）',kcal:652,protein:20.0,carb:89.0,fat:22.0,fiber:2.0,vitB1:0.12,vitC:3,calcium:30,iron:2.5,sodium:1100,zinc:4.0,magnesium:25,vitD:0,omega3:0,gi:72,serving:380,cat:'外食'},
  {name:'カレーライス',kcal:690,protein:18.0,carb:100.0,fat:22.0,fiber:4.0,vitB1:0.15,vitC:8,calcium:40,iron:2.0,sodium:1400,zinc:2.5,magnesium:30,vitD:0,omega3:0,gi:82,serving:450,cat:'外食'},
  {name:'ラーメン（醤油）',kcal:470,protein:18.0,carb:62.0,fat:15.0,fiber:2.5,vitB1:0.10,vitC:2,calcium:30,iron:1.5,sodium:2200,zinc:1.5,magnesium:20,vitD:0,omega3:0,gi:73,serving:500,cat:'外食'},
  {name:'チキン南蛮弁当',kcal:780,protein:28.0,carb:95.0,fat:30.0,fiber:2.0,vitB1:0.15,vitC:5,calcium:35,iron:1.8,sodium:1500,zinc:2.0,magnesium:25,vitD:0,omega3:0,gi:70,serving:450,cat:'外食'},
  {name:'コンビニサンドイッチ',kcal:320,protein:12.0,carb:30.0,fat:16.0,fiber:1.5,vitB1:0.08,vitC:3,calcium:40,iron:0.8,sodium:600,zinc:1.0,magnesium:15,vitD:0,omega3:0,gi:65,serving:180,cat:'外食'},
  {name:'親子丼',kcal:590,protein:25.0,carb:80.0,fat:18.0,fiber:1.5,vitB1:0.10,vitC:3,calcium:50,iron:2.0,sodium:1300,zinc:2.5,magnesium:25,vitD:1.0,omega3:0.1,gi:72,serving:400,cat:'外食'},
  {name:'焼き魚定食',kcal:550,protein:30.0,carb:65.0,fat:18.0,fiber:3.0,vitB1:0.20,vitC:10,calcium:80,iron:1.5,sodium:1200,zinc:2.0,magnesium:40,vitD:8.0,omega3:1.5,gi:60,serving:400,cat:'外食'},
  {name:'唐揚げ定食',kcal:750,protein:28.0,carb:90.0,fat:30.0,fiber:2.0,vitB1:0.12,vitC:5,calcium:30,iron:1.5,sodium:1400,zinc:2.0,magnesium:22,vitD:0.1,omega3:0,gi:72,serving:450,cat:'外食'},
  {name:'鮭弁当（コンビニ）',kcal:520,protein:22.0,carb:72.0,fat:15.0,fiber:1.5,vitB1:0.15,vitC:3,calcium:25,iron:1.0,sodium:900,zinc:1.5,magnesium:20,vitD:10.0,omega3:0.8,gi:68,serving:380,cat:'外食'},
  {name:'ハンバーガー（単品）',kcal:260,protein:13.0,carb:30.0,fat:9.0,fiber:1.5,vitB1:0.08,vitC:2,calcium:30,iron:1.5,sodium:500,zinc:2.0,magnesium:15,vitD:0,omega3:0,gi:66,serving:120,cat:'外食'},
  {name:'フライドポテト（M）',kcal:320,protein:3.5,carb:38.0,fat:17.0,fiber:3.5,vitB1:0.10,vitC:10,calcium:10,iron:0.5,sodium:300,zinc:0.3,magnesium:20,vitD:0,omega3:0,gi:75,serving:130,cat:'外食'},
  {name:'味噌汁（1杯）',kcal:33,protein:2.0,carb:3.5,fat:1.0,fiber:0.5,vitB1:0.02,vitC:1,calcium:20,iron:0.5,sodium:700,zinc:0.3,magnesium:15,vitD:0,omega3:0,gi:33,serving:180,cat:'外食'},
  {name:'豚汁（1杯）',kcal:100,protein:5.0,carb:8.0,fat:5.0,fiber:1.5,vitB1:0.15,vitC:5,calcium:25,iron:0.8,sodium:800,zinc:0.8,magnesium:20,vitD:0,omega3:0,gi:40,serving:200,cat:'外食'},
  {name:'すき家 牛丼（並）',kcal:652,protein:20.0,carb:89.0,fat:22.0,fiber:2.0,vitB1:0.12,vitC:3,calcium:30,iron:2.5,sodium:1100,zinc:4.0,magnesium:25,vitD:0,omega3:0,gi:72,serving:380,cat:'外食'},
  {name:'松屋 牛めし（並）',kcal:687,protein:21.0,carb:93.0,fat:23.5,fiber:2.0,vitB1:0.13,vitC:4,calcium:32,iron:2.6,sodium:1050,zinc:4.2,magnesium:26,vitD:0,omega3:0,gi:72,serving:390,cat:'外食'},
  {name:'CoCo壱 ポークカレー',kcal:755,protein:18.0,carb:108.0,fat:25.0,fiber:5.0,vitB1:0.16,vitC:8,calcium:45,iron:2.2,sodium:1500,zinc:2.5,magnesium:30,vitD:0,omega3:0,gi:82,serving:480,cat:'外食'},
  {name:'マクドナルド ビッグマック',kcal:525,protein:26.0,carb:42.0,fat:28.0,fiber:3.0,vitB1:0.15,vitC:3,calcium:120,iron:3.5,sodium:940,zinc:4.0,magnesium:30,vitD:0,omega3:0,gi:66,serving:200,cat:'外食'},
  {name:'サイゼリヤ ミラノ風ドリア',kcal:521,protein:14.0,carb:68.0,fat:21.0,fiber:2.0,vitB1:0.08,vitC:3,calcium:120,iron:1.0,sodium:950,zinc:1.5,magnesium:20,vitD:0,omega3:0,gi:72,serving:350,cat:'外食'},
  // ===== 飲料・補食・おやつ（14品） =====
  {name:'プロテインバー',kcal:190,protein:15.0,carb:20.0,fat:6.0,fiber:2.0,vitB1:0.30,vitC:0,calcium:120,iron:2.0,sodium:150,zinc:1.5,magnesium:20,vitD:0,omega3:0,gi:40,serving:45,cat:'補食'},
  {name:'エネルギーゼリー',kcal:180,protein:0,carb:45.0,fat:0,fiber:0,vitB1:0.10,vitC:50,calcium:0,iron:0,sodium:50,zinc:0,magnesium:0,vitD:0,omega3:0,gi:80,serving:180,cat:'補食'},
  {name:'カロリーメイト（2本）',kcal:200,protein:4.0,carb:20.5,fat:11.1,fiber:1.0,vitB1:0.30,vitC:25,calcium:100,iron:1.3,sodium:170,zinc:1.0,magnesium:25,vitD:1.4,omega3:0,gi:58,serving:40,cat:'補食'},
  {name:'SOYJOY（1本）',kcal:130,protein:5.0,carb:15.0,fat:6.0,fiber:2.5,vitB1:0.20,vitC:0,calcium:40,iron:1.0,sodium:50,zinc:0.5,magnesium:15,vitD:0,omega3:0,gi:45,serving:30,cat:'補食'},
  {name:'干し芋（50g）',kcal:151,protein:1.6,carb:37.0,fat:0.3,fiber:2.9,vitB1:0.07,vitC:5,calcium:27,iron:1.1,sodium:13,zinc:0.2,magnesium:24,vitD:0,omega3:0,gi:55,serving:50,cat:'補食'},
  {name:'ナッツミックス（30g）',kcal:188,protein:5.5,carb:5.5,fat:17.0,fiber:2.0,vitB1:0.10,vitC:0,calcium:30,iron:1.0,sodium:2,zinc:1.2,magnesium:50,vitD:0,omega3:0.2,gi:15,serving:30,cat:'補食'},
  {name:'あんぱん（1個）',kcal:280,protein:7.5,carb:50.0,fat:5.5,fiber:2.5,vitB1:0.06,vitC:0,calcium:30,iron:1.2,sodium:200,zinc:0.5,magnesium:15,vitD:0,omega3:0,gi:75,serving:100,cat:'補食'},
  {name:'どら焼き（1個）',kcal:260,protein:5.5,carb:48.0,fat:5.0,fiber:2.0,vitB1:0.04,vitC:0,calcium:25,iron:1.0,sodium:180,zinc:0.4,magnesium:12,vitD:0,omega3:0,gi:70,serving:90,cat:'補食'},
  {name:'スポーツドリンク（500ml）',kcal:105,protein:0,carb:26.5,fat:0,fiber:0,vitB1:0,vitC:50,calcium:5,iron:0,sodium:210,zinc:0,magnesium:2,vitD:0,omega3:0,gi:78,serving:500,cat:'飲料'},
  {name:'オレンジジュース（200ml）',kcal:84,protein:1.4,carb:19.8,fat:0.2,fiber:0.4,vitB1:0.08,vitC:84,calcium:18,iron:0.2,sodium:4,zinc:0.1,magnesium:10,vitD:0,omega3:0,gi:50,serving:200,cat:'飲料'},
  {name:'コーヒー（ブラック）',kcal:8,protein:0.4,carb:1.4,fat:0,fiber:0,vitB1:0,vitC:0,calcium:4,iron:0,sodium:4,zinc:0,magnesium:10,vitD:0,omega3:0,gi:0,serving:200,cat:'飲料'},
  {name:'コーラ（350ml）',kcal:158,protein:0,carb:39.5,fat:0,fiber:0,vitB1:0,vitC:0,calcium:4,iron:0,sodium:14,zinc:0,magnesium:0,vitD:0,omega3:0,gi:63,serving:350,cat:'飲料'},
  {name:'牛乳コーヒー（200ml）',kcal:90,protein:3.2,carb:12.0,fat:3.5,fiber:0,vitB1:0.04,vitC:1,calcium:100,iron:0,sodium:50,zinc:0.4,magnesium:12,vitD:0.3,omega3:0,gi:40,serving:200,cat:'飲料'},
  {name:'BCAA（1回分5g）',kcal:20,protein:5.0,carb:0,fat:0,fiber:0,vitB1:0,vitC:0,calcium:0,iron:0,sodium:10,zinc:0,magnesium:0,vitD:0,omega3:0,gi:0,serving:5,cat:'飲料'},
  // ===== 惣菜・家庭料理（20品） =====
  {name:'肉じゃが（1人前200g）',kcal:210,protein:10.2,carb:22.0,fat:8.5,fiber:2.0,vitB1:0.10,vitC:12,calcium:20,iron:1.0,sodium:680,zinc:1.5,magnesium:20,vitD:0,omega3:0,gi:65,serving:200,cat:'惣菜'},
  {name:'唐揚げ（5個150g）',kcal:375,protein:22.5,carb:12.0,fat:26.0,fiber:0.2,vitB1:0.08,vitC:2,calcium:12,iron:0.7,sodium:520,zinc:1.8,magnesium:22,vitD:0.1,omega3:0,gi:0,serving:150,cat:'惣菜'},
  {name:'生姜焼き（1人前150g）',kcal:330,protein:20.0,carb:8.0,fat:24.0,fiber:0.5,vitB1:0.60,vitC:3,calcium:8,iron:0.5,sodium:640,zinc:2.0,magnesium:20,vitD:0.1,omega3:0,gi:0,serving:150,cat:'惣菜'},
  {name:'ハンバーグ（1個150g）',kcal:310,protein:18.0,carb:12.0,fat:20.5,fiber:0.8,vitB1:0.12,vitC:3,calcium:25,iron:2.0,sodium:550,zinc:3.0,magnesium:18,vitD:0.2,omega3:0,gi:0,serving:150,cat:'惣菜'},
  {name:'カレーライス（1人前）',kcal:620,protein:15.0,carb:85.0,fat:22.0,fiber:3.5,vitB1:0.12,vitC:8,calcium:35,iron:1.5,sodium:900,zinc:1.8,magnesium:25,vitD:0,omega3:0,gi:82,serving:450,cat:'惣菜'},
  {name:'親子丼（1人前）',kcal:580,protein:25.0,carb:72.0,fat:16.0,fiber:1.5,vitB1:0.10,vitC:5,calcium:50,iron:1.8,sodium:880,zinc:2.0,magnesium:22,vitD:2.0,omega3:0.2,gi:75,serving:400,cat:'惣菜'},
  {name:'麻婆豆腐（1人前200g）',kcal:210,protein:12.0,carb:8.0,fat:14.5,fiber:1.2,vitB1:0.15,vitC:2,calcium:120,iron:2.5,sodium:750,zinc:1.5,magnesium:40,vitD:0,omega3:0,gi:0,serving:200,cat:'惣菜'},
  {name:'焼き餃子（6個150g）',kcal:345,protein:13.5,carb:25.0,fat:20.0,fiber:1.5,vitB1:0.15,vitC:4,calcium:18,iron:1.0,sodium:620,zinc:1.2,magnesium:14,vitD:0,omega3:0,gi:50,serving:150,cat:'惣菜'},
  {name:'野菜炒め（1人前200g）',kcal:145,protein:5.0,carb:10.0,fat:9.5,fiber:3.5,vitB1:0.08,vitC:30,calcium:40,iron:0.8,sodium:480,zinc:0.5,magnesium:18,vitD:0,omega3:0,gi:30,serving:200,cat:'惣菜'},
  {name:'豚汁（1杯250ml）',kcal:120,protein:6.5,carb:10.0,fat:5.5,fiber:2.0,vitB1:0.18,vitC:4,calcium:30,iron:0.8,sodium:900,zinc:0.8,magnesium:20,vitD:0,omega3:0,gi:35,serving:250,cat:'惣菜'},
  {name:'味噌汁（豆腐・わかめ）',kcal:42,protein:3.0,carb:3.5,fat:1.5,fiber:0.8,vitB1:0.02,vitC:0,calcium:35,iron:0.5,sodium:750,zinc:0.3,magnesium:18,vitD:0,omega3:0,gi:0,serving:200,cat:'惣菜'},
  {name:'チキン南蛮（1人前）',kcal:450,protein:25.0,carb:22.0,fat:28.0,fiber:0.5,vitB1:0.10,vitC:3,calcium:20,iron:0.8,sodium:650,zinc:1.5,magnesium:22,vitD:0.2,omega3:0,gi:40,serving:250,cat:'惣菜'},
  {name:'回鍋肉（1人前200g）',kcal:280,protein:14.0,carb:12.0,fat:20.0,fiber:2.0,vitB1:0.40,vitC:25,calcium:30,iron:0.8,sodium:700,zinc:1.5,magnesium:18,vitD:0,omega3:0,gi:0,serving:200,cat:'惣菜'},
  {name:'オムレツ（卵2個）',kcal:220,protein:14.0,carb:1.5,fat:17.0,fiber:0,vitB1:0.06,vitC:0,calcium:55,iron:1.8,sodium:300,zinc:1.4,magnesium:12,vitD:3.2,omega3:0.3,gi:0,serving:140,cat:'惣菜'},
  {name:'目玉焼き（1個）',kcal:110,protein:7.5,carb:0.3,fat:8.5,fiber:0,vitB1:0.04,vitC:0,calcium:30,iron:1.1,sodium:180,zinc:0.8,magnesium:7,vitD:1.8,omega3:0.2,gi:0,serving:70,cat:'惣菜'},
  {name:'ゆで卵（1個）',kcal:80,protein:7.0,carb:0.2,fat:5.5,fiber:0,vitB1:0.03,vitC:0,calcium:30,iron:1.0,sodium:70,zinc:0.7,magnesium:7,vitD:1.8,omega3:0.2,gi:0,serving:60,cat:'惣菜'},
  {name:'焼き魚定食（鮭）',kcal:520,protein:28.0,carb:62.0,fat:14.0,fiber:3.0,vitB1:0.25,vitC:8,calcium:40,iron:1.2,sodium:1200,zinc:1.5,magnesium:45,vitD:26.0,omega3:1.5,gi:70,serving:400,cat:'惣菜'},
  {name:'筑前煮（1人前150g）',kcal:135,protein:8.0,carb:15.0,fat:4.5,fiber:3.0,vitB1:0.08,vitC:8,calcium:25,iron:0.8,sodium:580,zinc:0.8,magnesium:22,vitD:0,omega3:0,gi:50,serving:150,cat:'惣菜'},
  {name:'豚キムチ炒め（1人前200g）',kcal:250,protein:16.0,carb:8.0,fat:17.0,fiber:2.0,vitB1:0.45,vitC:15,calcium:35,iron:0.8,sodium:800,zinc:1.8,magnesium:18,vitD:0,omega3:0,gi:0,serving:200,cat:'惣菜'},
  // ===== コンビニ・チェーン追加（28品） =====
  {name:'コンビニ幕の内弁当',kcal:680,protein:22.0,carb:88.0,fat:24.0,fiber:3.0,vitB1:0.15,vitC:10,calcium:40,iron:1.5,sodium:1400,zinc:2.0,magnesium:30,vitD:1.0,omega3:0.2,gi:75,serving:450,cat:'外食'},
  {name:'コンビニ鮭弁当',kcal:560,protein:20.0,carb:75.0,fat:18.0,fiber:2.0,vitB1:0.20,vitC:5,calcium:30,iron:1.0,sodium:1200,zinc:1.2,magnesium:25,vitD:15.0,omega3:0.8,gi:75,serving:400,cat:'外食'},
  {name:'コンビニサンドイッチ（ハムタマゴ）',kcal:320,protein:12.0,carb:30.0,fat:16.0,fiber:1.5,vitB1:0.10,vitC:3,calcium:35,iron:0.8,sodium:600,zinc:0.8,magnesium:12,vitD:0.5,omega3:0,gi:65,serving:150,cat:'外食'},
  {name:'コンビニ肉まん',kcal:240,protein:8.5,carb:30.0,fat:9.5,fiber:1.0,vitB1:0.12,vitC:2,calcium:15,iron:0.8,sodium:450,zinc:0.8,magnesium:10,vitD:0,omega3:0,gi:65,serving:110,cat:'外食'},
  {name:'ファミチキ（1個）',kcal:252,protein:12.7,carb:14.8,fat:15.7,fiber:0.3,vitB1:0.06,vitC:1,calcium:10,iron:0.5,sodium:490,zinc:0.8,magnesium:15,vitD:0,omega3:0,gi:0,serving:80,cat:'外食'},
  {name:'からあげクン（5個）',kcal:227,protein:14.0,carb:8.0,fat:15.5,fiber:0.2,vitB1:0.06,vitC:1,calcium:8,iron:0.4,sodium:460,zinc:0.7,magnesium:14,vitD:0,omega3:0,gi:0,serving:75,cat:'外食'},
  {name:'天丼（天ぷら3種）',kcal:720,protein:18.0,carb:90.0,fat:28.0,fiber:2.0,vitB1:0.10,vitC:5,calcium:30,iron:1.2,sodium:950,zinc:1.2,magnesium:20,vitD:1.0,omega3:0.3,gi:80,serving:400,cat:'外食'},
  {name:'かつ丼（1人前）',kcal:780,protein:28.0,carb:85.0,fat:32.0,fiber:2.0,vitB1:0.55,vitC:5,calcium:50,iron:2.0,sodium:1100,zinc:2.5,magnesium:25,vitD:1.5,omega3:0.2,gi:78,serving:450,cat:'外食'},
  {name:'丸亀うどん（かけ並）',kcal:305,protein:8.0,carb:58.0,fat:3.5,fiber:1.8,vitB1:0.06,vitC:0,calcium:18,iron:0.6,sodium:1200,zinc:0.3,magnesium:12,vitD:0,omega3:0,gi:80,serving:350,cat:'外食'},
  {name:'サイゼリヤ・ミラノ風ドリア',kcal:542,protein:15.0,carb:62.0,fat:24.0,fiber:1.5,vitB1:0.08,vitC:3,calcium:180,iron:0.8,sodium:850,zinc:1.5,magnesium:20,vitD:0.5,omega3:0,gi:72,serving:300,cat:'外食'},
  {name:'サブウェイ（ターキー）',kcal:280,protein:18.0,carb:38.0,fat:4.5,fiber:4.0,vitB1:0.12,vitC:15,calcium:40,iron:1.5,sodium:750,zinc:1.0,magnesium:25,vitD:0,omega3:0,gi:55,serving:240,cat:'外食'},
  {name:'ケンタッキー（オリジナル1P）',kcal:237,protein:18.0,carb:8.0,fat:14.5,fiber:0.3,vitB1:0.08,vitC:1,calcium:12,iron:0.6,sodium:530,zinc:1.0,magnesium:18,vitD:0,omega3:0,gi:0,serving:87,cat:'外食'},
  {name:'モスバーガー',kcal:367,protein:15.5,carb:36.0,fat:17.5,fiber:2.0,vitB1:0.12,vitC:8,calcium:35,iron:1.5,sodium:650,zinc:1.8,magnesium:20,vitD:0,omega3:0,gi:55,serving:210,cat:'外食'},
  {name:'ラーメン（醤油・1杯）',kcal:480,protein:18.0,carb:62.0,fat:16.0,fiber:2.0,vitB1:0.10,vitC:3,calcium:25,iron:1.0,sodium:2200,zinc:1.0,magnesium:15,vitD:0,omega3:0,gi:73,serving:500,cat:'外食'},
  {name:'ラーメン（味噌・1杯）',kcal:520,protein:20.0,carb:60.0,fat:20.0,fiber:2.5,vitB1:0.12,vitC:3,calcium:30,iron:1.2,sodium:2500,zinc:1.2,magnesium:20,vitD:0,omega3:0,gi:73,serving:500,cat:'外食'},
  {name:'ラーメン（豚骨・1杯）',kcal:550,protein:22.0,carb:58.0,fat:24.0,fiber:1.5,vitB1:0.15,vitC:2,calcium:40,iron:1.0,sodium:2300,zinc:1.5,magnesium:18,vitD:0,omega3:0,gi:73,serving:500,cat:'外食'},
  {name:'つけ麺（1人前）',kcal:580,protein:20.0,carb:72.0,fat:20.0,fiber:2.0,vitB1:0.12,vitC:3,calcium:25,iron:1.0,sodium:2000,zinc:1.0,magnesium:15,vitD:0,omega3:0,gi:70,serving:500,cat:'外食'},
  {name:'焼きそば（1人前）',kcal:460,protein:14.0,carb:58.0,fat:18.0,fiber:3.0,vitB1:0.12,vitC:15,calcium:25,iron:1.0,sodium:1100,zinc:0.8,magnesium:18,vitD:0,omega3:0,gi:70,serving:350,cat:'外食'},
  {name:'ペペロンチーノ（1人前）',kcal:520,protein:14.0,carb:70.0,fat:18.0,fiber:3.0,vitB1:0.22,vitC:5,calcium:20,iron:1.5,sodium:600,zinc:1.2,magnesium:45,vitD:0,omega3:0.1,gi:58,serving:300,cat:'外食'},
  {name:'ミートソースパスタ（1人前）',kcal:610,protein:22.0,carb:75.0,fat:22.0,fiber:4.0,vitB1:0.25,vitC:12,calcium:30,iron:2.5,sodium:800,zinc:2.5,magnesium:50,vitD:0,omega3:0,gi:55,serving:350,cat:'外食'},
  // ===== スポーツ補食・プロテイン（10品） =====
  {name:'ホエイプロテイン（1杯30g）',kcal:120,protein:24.0,carb:3.0,fat:1.5,fiber:0,vitB1:0.15,vitC:0,calcium:120,iron:1.0,sodium:80,zinc:1.0,magnesium:20,vitD:0,omega3:0,gi:0,serving:30,cat:'補食'},
  {name:'ソイプロテイン（1杯30g）',kcal:110,protein:20.0,carb:4.0,fat:2.0,fiber:1.0,vitB1:0.12,vitC:0,calcium:80,iron:1.5,sodium:80,zinc:0.8,magnesium:30,vitD:0,omega3:0,gi:0,serving:30,cat:'補食'},
  {name:'inゼリー エネルギー',kcal:180,protein:0,carb:45.0,fat:0,fiber:0,vitB1:0.09,vitC:50,calcium:0,iron:0,sodium:44,zinc:0,magnesium:0,vitD:0,omega3:0,gi:75,serving:180,cat:'補食'},
  {name:'inゼリー プロテイン',kcal:90,protein:10.0,carb:10.5,fat:0,fiber:0,vitB1:0.10,vitC:80,calcium:0,iron:1.0,sodium:60,zinc:1.0,magnesium:0,vitD:0,omega3:0,gi:50,serving:180,cat:'補食'},
  {name:'SAVAS ミルクプロテイン（200ml）',kcal:102,protein:15.0,carb:10.0,fat:0,fiber:0,vitB1:0.15,vitC:0,calcium:350,iron:3.8,sodium:80,zinc:1.0,magnesium:20,vitD:1.0,omega3:0,gi:30,serving:200,cat:'補食'},
  {name:'プロテインバー（1本）',kcal:190,protein:15.0,carb:18.0,fat:7.0,fiber:1.5,vitB1:0.20,vitC:0,calcium:80,iron:2.0,sodium:120,zinc:0.8,magnesium:15,vitD:0,omega3:0,gi:40,serving:45,cat:'補食'},
  {name:'スポーツドリンク（500ml）',kcal:105,protein:0,carb:26.0,fat:0,fiber:0,vitB1:0,vitC:10,calcium:5,iron:0,sodium:210,zinc:0,magnesium:3,vitD:0,omega3:0,gi:80,serving:500,cat:'飲料'},
  {name:'スタバ・フラペチーノ（Tall）',kcal:322,protein:4.5,carb:52.0,fat:11.0,fiber:0,vitB1:0.02,vitC:0,calcium:120,iron:0,sodium:160,zinc:0.4,magnesium:15,vitD:0,omega3:0,gi:70,serving:350,cat:'飲料'},
  {name:'スタバ・ソイラテ（Tall）',kcal:146,protein:7.0,carb:14.0,fat:6.5,fiber:0.5,vitB1:0.04,vitC:0,calcium:150,iron:0.8,sodium:120,zinc:0.5,magnesium:25,vitD:0,omega3:0,gi:30,serving:200,cat:'飲料'},
  {name:'経口補水液（500ml）',kcal:50,protein:0,carb:12.5,fat:0,fiber:0,vitB1:0,vitC:0,calcium:0,iron:0,sodium:575,zinc:0,magnesium:12,vitD:0,omega3:0,gi:60,serving:500,cat:'飲料'},
  // ===== 野菜追加（12品） =====
  {name:'キャベツ千切り（100g）',kcal:23,protein:1.3,carb:5.2,fat:0.2,fiber:1.8,vitB1:0.04,vitC:41,calcium:43,iron:0.3,sodium:5,zinc:0.2,magnesium:14,vitD:0,omega3:0,gi:26,serving:100,cat:'野菜'},
  {name:'トマト（中1個150g）',kcal:29,protein:1.1,carb:7.0,fat:0.2,fiber:1.5,vitB1:0.08,vitC:23,calcium:11,iron:0.3,sodium:5,zinc:0.2,magnesium:14,vitD:0,omega3:0,gi:30,serving:150,cat:'野菜'},
  {name:'ブロッコリー（100g茹で）',kcal:27,protein:3.5,carb:4.3,fat:0.4,fiber:3.7,vitB1:0.06,vitC:55,calcium:38,iron:0.7,sodium:15,zinc:0.3,magnesium:17,vitD:0,omega3:0,gi:15,serving:100,cat:'野菜'},
  {name:'ほうれん草おひたし（80g）',kcal:18,protein:2.2,carb:2.4,fat:0.3,fiber:2.2,vitB1:0.04,vitC:14,calcium:39,iron:1.6,sodium:200,zinc:0.5,magnesium:55,vitD:0,omega3:0,gi:15,serving:80,cat:'野菜'},
  {name:'アボカド（半個70g）',kcal:131,protein:1.8,carb:4.3,fat:13.0,fiber:3.7,vitB1:0.05,vitC:7,calcium:6,iron:0.5,sodium:5,zinc:0.5,magnesium:23,vitD:0,omega3:0.1,gi:10,serving:70,cat:'野菜'},
  {name:'かぼちゃ煮物（100g）',kcal:82,protein:1.6,carb:18.0,fat:0.3,fiber:2.8,vitB1:0.05,vitC:32,calcium:15,iron:0.5,sodium:280,zinc:0.2,magnesium:18,vitD:0,omega3:0,gi:65,serving:100,cat:'野菜'},
  {name:'ポテトサラダ（100g）',kcal:140,protein:2.5,carb:14.0,fat:8.0,fiber:1.0,vitB1:0.06,vitC:12,calcium:10,iron:0.3,sodium:350,zinc:0.2,magnesium:12,vitD:0,omega3:0,gi:55,serving:100,cat:'野菜'},
  {name:'きんぴらごぼう（80g）',kcal:72,protein:1.5,carb:12.0,fat:2.2,fiber:3.5,vitB1:0.03,vitC:2,calcium:30,iron:0.5,sodium:350,zinc:0.3,magnesium:20,vitD:0,omega3:0,gi:45,serving:80,cat:'野菜'},
  // ===== 間食（10品） =====
  {name:'せんべい（2枚）',kcal:85,protein:1.2,carb:19.0,fat:0.5,fiber:0.3,vitB1:0.01,vitC:0,calcium:3,iron:0.1,sodium:220,zinc:0.1,magnesium:5,vitD:0,omega3:0,gi:85,serving:25,cat:'補食'},
  {name:'チョコレート（半分25g）',kcal:140,protein:1.8,carb:13.5,fat:8.5,fiber:0.8,vitB1:0.02,vitC:0,calcium:28,iron:0.6,sodium:12,zinc:0.4,magnesium:18,vitD:0,omega3:0,gi:49,serving:25,cat:'補食'},
  {name:'ポテトチップス（1袋60g）',kcal:336,protein:2.8,carb:32.0,fat:21.6,fiber:2.4,vitB1:0.06,vitC:10,calcium:8,iron:0.4,sodium:340,zinc:0.2,magnesium:18,vitD:0,omega3:0,gi:60,serving:60,cat:'補食'},
  {name:'アイスクリーム（バニラ）',kcal:180,protein:3.0,carb:22.0,fat:9.0,fiber:0,vitB1:0.03,vitC:0,calcium:100,iron:0.1,sodium:55,zinc:0.3,magnesium:8,vitD:0.1,omega3:0,gi:65,serving:100,cat:'補食'},
  {name:'どら焼き（1個）',kcal:230,protein:5.0,carb:42.0,fat:3.5,fiber:1.5,vitB1:0.03,vitC:0,calcium:20,iron:0.8,sodium:100,zinc:0.3,magnesium:10,vitD:0,omega3:0,gi:78,serving:75,cat:'補食'},
  {name:'干し芋（50g）',kcal:151,protein:1.6,carb:36.0,fat:0.3,fiber:3.0,vitB1:0.05,vitC:5,calcium:25,iron:0.5,sodium:10,zinc:0.2,magnesium:15,vitD:0,omega3:0,gi:55,serving:50,cat:'補食'},
  {name:'カステラ（1切れ）',kcal:160,protein:3.5,carb:31.0,fat:2.5,fiber:0.2,vitB1:0.02,vitC:0,calcium:15,iron:0.4,sodium:40,zinc:0.3,magnesium:5,vitD:0.3,omega3:0,gi:69,serving:50,cat:'補食'},
  // ===== 果物追加（8品） =====
  {name:'みかん（1個100g）',kcal:46,protein:0.7,carb:12.0,fat:0.1,fiber:1.0,vitB1:0.10,vitC:35,calcium:21,iron:0.2,sodium:1,zinc:0.1,magnesium:11,vitD:0,omega3:0,gi:33,serving:100,cat:'果物'},
  {name:'いちご（5粒100g）',kcal:34,protein:0.9,carb:8.5,fat:0.1,fiber:1.4,vitB1:0.03,vitC:62,calcium:17,iron:0.3,sodium:1,zinc:0.2,magnesium:13,vitD:0,omega3:0,gi:29,serving:100,cat:'果物'},
  {name:'ぶどう（1房150g）',kcal:89,protein:0.6,carb:23.0,fat:0.2,fiber:0.8,vitB1:0.05,vitC:3,calcium:9,iron:0.2,sodium:2,zinc:0.2,magnesium:9,vitD:0,omega3:0,gi:46,serving:150,cat:'果物'},
  {name:'パイナップル（100g）',kcal:51,protein:0.6,carb:13.4,fat:0.1,fiber:1.2,vitB1:0.08,vitC:27,calcium:10,iron:0.2,sodium:1,zinc:0.1,magnesium:14,vitD:0,omega3:0,gi:59,serving:100,cat:'果物'},
  {name:'ドライフルーツ（30g）',kcal:90,protein:0.8,carb:22.0,fat:0.2,fiber:2.5,vitB1:0.02,vitC:2,calcium:15,iron:0.8,sodium:5,zinc:0.2,magnesium:12,vitD:0,omega3:0,gi:60,serving:30,cat:'果物'},
  // ===== 乳製品追加（5品） =====
  {name:'カッテージチーズ（50g）',kcal:53,protein:6.8,carb:1.0,fat:2.3,fiber:0,vitB1:0.02,vitC:0,calcium:28,iron:0.1,sodium:200,zinc:0.3,magnesium:4,vitD:0,omega3:0,gi:10,serving:50,cat:'乳製品'},
  {name:'豆乳（200ml）',kcal:88,protein:7.2,carb:6.2,fat:4.0,fiber:0.4,vitB1:0.06,vitC:0,calcium:30,iron:1.2,sodium:4,zinc:0.5,magnesium:50,vitD:0,omega3:0.2,gi:23,serving:200,cat:'乳製品'},
  {name:'飲むヨーグルト（200ml）',kcal:130,protein:5.8,carb:20.0,fat:2.5,fiber:0,vitB1:0.06,vitC:2,calcium:210,iron:0,sodium:80,zinc:0.6,magnesium:18,vitD:0,omega3:0,gi:36,serving:200,cat:'乳製品'},
];

// ── 食品検索ヘルパー: ひらがな⇔カタカナ変換 + シノニム ──
function _toKatakana(s){return s.replace(/[\u3041-\u3096]/g,function(c){return String.fromCharCode(c.charCodeAt(0)+96);});}
function _toHiragana(s){return s.replace(/[\u30A1-\u30F6]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-96);});}
function _getSynonyms(q){
  var syn={
    'ごはん':['白ごはん','ご飯','ライス','白米'],'ライス':['白ごはん','ご飯'],'米':['白ごはん','玄米','ご飯'],
    'パン':['食パン','全粒粉'],'ぱん':['食パン','全粒粉'],
    'とりむね':['鶏むね'],'とりもも':['鶏もも'],'チキン':['鶏むね','鶏もも','ささみ','サラダチキン'],
    'ちきん':['鶏むね','鶏もも','ささみ','サラダチキン'],'鳥':['鶏むね','鶏もも','ささみ'],
    'ぶた':['豚ロース','豚ヒレ','豚バラ'],'ビーフ':['牛もも','牛ヒレ'],
    'さけ':['鮭'],'シャケ':['鮭'],'しゃけ':['鮭'],'サーモン':['鮭','サーモン刺身'],
    'まぐろ':['まぐろ赤身'],'ツナ':['ツナ缶'],'さば':['サバ','鯖','サバ缶'],
    'たまご':['卵','ゆで卵','目玉焼き'],'玉子':['卵','ゆで卵','目玉焼き'],
    'とうふ':['豆腐'],'豆腐':['豆腐・木綿','豆腐・絹ごし'],
    'ぎゅうにゅう':['牛乳'],'ミルク':['牛乳'],'みるく':['牛乳'],
    'ヨーグルト':['ヨーグルト','ギリシャヨーグルト'],
    'バナナ':['バナナ'],'ばなな':['バナナ'],
    'おにぎり':['おにぎり（鮭）','おにぎり（ツナマヨ）','おにぎり（梅）'],
    'カレー':['カレーライス','CoCo壱'],'ラーメン':['ラーメン'],
    'ぎゅうどん':['牛丼','すき家'],'牛丼':['牛丼','すき家','松屋'],
    'プロテイン':['プロテイン','プロテインバー'],'ぷろていん':['プロテイン','プロテインバー'],
    'マック':['マクドナルド'],'マクド':['マクドナルド'],
    'サイゼ':['サイゼリヤ'],'すき家':['すき家'],'松屋':['松屋'],
    'ナッツ':['ナッツミックス'],'アーモンド':['ナッツミックス'],
    'みそしる':['味噌汁','豆腐'],'味噌汁':['味噌汁'],'豚汁':['豚汁'],
    'えだまめ':['枝豆'],'ほしいも':['干し芋'],
    'コーヒー':['コーヒー','牛乳コーヒー'],'珈琲':['コーヒー'],
    // Enhanced synonyms for better matching
    'からあげ':['唐揚げ'],'から揚げ':['唐揚げ'],'フライドチキン':['唐揚げ','ケンタッキー'],
    'しょうがやき':['生姜焼き'],'ショウガ焼き':['生姜焼き'],
    'おやこどん':['親子丼'],'カツどん':['かつ丼'],'かつどん':['かつ丼'],'てんどん':['天丼'],
    'うどん':['うどん','丸亀','冷やしうどん'],'そうめん':['うどん'],
    'やきそば':['焼きそば'],'チャーハン':['炒飯'],
    'ぎょうざ':['焼き餃子','餃子の王将'],'ギョーザ':['焼き餃子'],
    'ハンバーグ':['ハンバーグ'],'はんばーぐ':['ハンバーグ'],
    'にくじゃが':['肉じゃが'],'まーぼー':['麻婆豆腐'],'マーボー':['麻婆豆腐'],
    'ステーキ':['牛もも肉','牛ヒレ肉'],'すてーき':['牛もも肉','牛ヒレ肉'],
    'スタバ':['スタバ・フラペチーノ','スタバ・ソイラテ'],'スターバックス':['スタバ・フラペチーノ','スタバ・ソイラテ'],
    'ケンタ':['ケンタッキー'],'KFC':['ケンタッキー'],
    'モス':['モスバーガー'],'サブウェイ':['サブウェイ'],
    'サイゼ':['サイゼリヤ'],'ドリア':['サイゼリヤ・ミラノ風ドリア'],
    'まるがめ':['丸亀うどん'],'丸亀':['丸亀うどん'],
    'ファミチキ':['ファミチキ'],'からあげクン':['からあげクン'],
    'ブロッコリー':['ブロッコリー'],'ぶろっこりー':['ブロッコリー'],
    'アボカド':['アボカド'],'あぼかど':['アボカド'],
    'カステラ':['カステラ'],'干し芋':['干し芋'],
    'フラペチーノ':['スタバ・フラペチーノ'],
    'せんべい':['せんべい'],'おせんべい':['せんべい'],
    'ポテチ':['ポテトチップス'],'ポテトチップス':['ポテトチップス'],
    'アイス':['アイスクリーム'],'あいす':['アイスクリーム'],
    'ポテサラ':['ポテトサラダ'],'きんぴら':['きんぴらごぼう'],
    'みかん':['みかん'],'いちご':['いちご'],'ぶどう':['ぶどう'],
    'ザバス':['SAVAS ミルクプロテイン'],'ザバスミルク':['SAVAS ミルクプロテイン'],
    'inゼリー':['inゼリー エネルギー','inゼリー プロテイン'],
    'ウイダー':['inゼリー エネルギー','inゼリー プロテイン'],
  };
  var results=[];
  for(var key in syn){
    if(q.includes(key)||_toKatakana(q).includes(key)||_toHiragana(q).includes(key)){
      results=results.concat(syn[key]);
    }
  }
  return results;
}

// ── 残りの食事 スマート提案エンジン ──
function _nutRemainingMealsSuggestion(tots,goal){
  var hh=new Date().getHours();
  var meals=DB.meals?.today||[];
  var mealCount=meals.length;
  if(mealCount<1 || hh<8) return '';
  var remK=Math.max(0,goal.kcal-tots.kcal);
  var remP=Math.max(0,goal.protein-tots.protein);
  var remC=Math.max(0,goal.carb-tots.carb);
  var remF=Math.max(0,goal.fat-tots.fat);
  if(remK<100) return ''; // almost done

  var mealsLeft=hh<11?3:hh<15?2:hh<19?1:0;
  if(mealsLeft<1) return '';

  var perK=Math.round(remK/mealsLeft);
  var perP=Math.round(remP/mealsLeft);

  // Find best matching foods from FOOD_DB
  var candidates=FOOD_DB.filter(function(f){
    return f.kcal>=perK*0.3 && f.kcal<=perK*1.3 && f.cat!=='飲料';
  }).map(function(f){
    // Score by how well it fills remaining needs
    var pScore=f.protein>=perP*0.7?10:(f.protein>=perP*0.4?5:0);
    var kScore=Math.abs(f.kcal-perK)<100?10:(Math.abs(f.kcal-perK)<200?5:0);
    var proteinDensity=f.kcal>0?f.protein/f.kcal*100:0;
    return {food:f,score:pScore+kScore+(proteinDensity>8?5:0),pDens:proteinDensity};
  }).sort(function(a,b){return b.score-a.score;}).slice(0,4);

  if(!candidates.length) return '';

  var h='<div style="background:linear-gradient(135deg,rgba(0,207,170,.04),rgba(59,130,246,.03));border:1px solid rgba(0,207,170,.15);border-radius:14px;padding:14px 16px;margin-bottom:12px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h+='<div style="font-size:13px;font-weight:700">🎯 次の食事の提案</div>';
  h+='<div style="font-size:11px;color:var(--txt3)">残り約'+Math.round(remK)+'kcal / P'+Math.round(remP)+'g</div></div>';
  h+='<div style="font-size:11px;color:var(--txt3);margin-bottom:8px">あと'+mealsLeft+'食 · 1食あたり約'+perK+'kcal / P'+perP+'gが目安</div>';
  h+='<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">';
  var catEmojis2={'肉':'🍖','魚':'🐟','主食':'🍚','野菜':'🥦','果物':'🍎','乳製品':'🥛','卵・大豆':'🥚','外食':'🍱','補食':'🍫'};
  for(var ci=0;ci<candidates.length;ci++){
    var c=candidates[ci];var f2=c.food;
    var fidx=FOOD_DB.indexOf(f2);
    h+='<div onclick="addFoodFromSearch('+fidx+')" style="flex-shrink:0;padding:10px;border:1px solid var(--b1);border-radius:10px;cursor:pointer;min-width:110px;background:var(--surf);transition:all .15s" onmouseover="this.style.borderColor=\'var(--teal)\'" onmouseout="this.style.borderColor=\'var(--b1)\'">';
    h+='<div style="font-size:14px;margin-bottom:4px">'+(catEmojis2[f2.cat]||'🍽️')+'</div>';
    h+='<div style="font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">'+sanitize(f2.name,18)+'</div>';
    h+='<div style="font-size:10px;color:var(--org);font-weight:700">'+f2.kcal+'kcal</div>';
    h+='<div style="font-size:9px;color:var(--teal)">P'+fmtN(f2.protein)+'g</div></div>';
  }
  h+='</div></div>';
  return h;
}

// ── 食事管理 UI ヘルパー（全て文字列連結、テンプレートリテラル不使用）──
function _nutSummaryBar(tots, goal, score, scoreEmoji) {
  var pct = goal.kcal ? Math.round(tots.kcal / goal.kcal * 100) : 0;
  var barC = pct > 110 ? '#ef4444' : pct >= 80 ? 'var(--teal)' : 'var(--org)';
  var scC = score >= 80 ? 'var(--teal)' : score >= 60 ? 'var(--org)' : '#ef4444';
  return '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--surf);border:1px solid var(--b1);border-radius:14px;margin-bottom:12px">'
    + '<div style="font-size:32px">' + scoreEmoji + '</div>'
    + '<div style="flex:1"><div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px">'
    + '<span style="font-size:22px;font-weight:900;font-family:Montserrat,sans-serif">' + fmtNum(tots.kcal) + '</span>'
    + '<span style="font-size:12px;color:var(--txt3)">/ ' + fmtNum(goal.kcal) + ' kcal</span>'
    + '<span style="font-size:13px;font-weight:800;color:' + scC + ';margin-left:auto">' + score + '点</span></div>'
    + '<div style="height:6px;background:var(--surf2);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + Math.min(pct,100) + '%;background:' + barC + ';border-radius:3px"></div>'
    + '</div></div></div>';
}

function _nutPFCBars(tots, goal, pfcActual, pfcTarget) {
  var pfc = [
    {k:'P', v:tots.protein, t:goal.protein, c:'#00cfaa', pct:pfcActual.p, tp:pfcTarget.p},
    {k:'F', v:tots.fat, t:goal.fat, c:'#f59e0b', pct:pfcActual.f, tp:pfcTarget.f},
    {k:'C', v:tots.carb, t:goal.carb, c:'#3b82f6', pct:pfcActual.c, tp:pfcTarget.c}
  ];
  var h = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">';
  for (var i = 0; i < pfc.length; i++) {
    var n = pfc[i], p = n.t ? Math.min(Math.round(n.v/n.t*100),100) : 0;
    h += '<div style="background:var(--surf);border:1px solid var(--b1);border-radius:10px;padding:8px">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
      + '<span style="font-size:12px;font-weight:800;color:' + n.c + '">' + n.k + '</span>'
      + '<span style="font-size:12px;font-weight:800;font-family:Montserrat,sans-serif">' + fmtN(n.v) + '<span style="font-size:9px;color:var(--txt3);font-weight:400">/' + n.t + 'g</span></span></div>'
      + '<div style="height:5px;background:var(--surf2);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + p + '%;background:' + n.c + ';border-radius:3px"></div></div>'
      + '<div style="font-size:9px;color:var(--txt3);text-align:right;margin-top:2px">' + n.pct + '% (目標' + n.tp + '%)</div></div>';
  }
  return h + '</div>';
}

function _nutMealEntry() {
  return '<div style="background:var(--surf);border:1px solid var(--b1);border-radius:12px;padding:12px;margin-bottom:8px">'
    + '<div style="font-size:14px;font-weight:700;margin-bottom:6px">🍽️ 食事を記録</div>'
    + '<select class="input" id="meal-type" style="padding:10px 14px;font-size:14px;font-weight:600;margin-bottom:10px;border-radius:10px">'
    + '<option value="breakfast">🌅 朝食</option><option value="lunch" selected>☀️ 昼食</option>'
    + '<option value="dinner">🌙 夕食</option><option value="snack">🍌 補食</option></select>'
    + '<div style="margin-bottom:10px">'
    + '<div style="display:flex;gap:6px;margin-bottom:6px">'
    + '<button class="btn" style="flex:1;padding:10px;font-size:13px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#ff6b2b,#f59e0b);color:#fff;font-weight:700;box-shadow:0 4px 14px rgba(249,115,22,.3)" onclick="document.getElementById(\'food-photo-input\').click()">'
    + '📸 写真で記録</button>'
    + '<button class="btn" style="flex:1;padding:10px;font-size:13px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#0ea5e9,#00cfaa);color:#fff;font-weight:700;box-shadow:0 4px 14px rgba(14,165,233,.2)" onclick="openAINutritionInput()">'
    + '🤖 AIで入力</button>'
    + '<button class="btn" style="flex-shrink:0;padding:10px 14px;font-size:12px;border-radius:10px;border:1px solid var(--b1);background:var(--surf);color:var(--txt2);font-weight:600" onclick="copyYesterdayMeals()">'
    + '📋 昨日</button></div>'
    + '<input type="file" id="food-photo-input" accept="image/*" capture="environment" style="display:none" onchange="startPhotoMealFlow(this)">'
    + '<div id="photo-analysis-status" style="display:none"></div></div>'
    + '<div class="relative" style="margin-bottom:8px">'
    + '<input class="input" id="food-q" placeholder="🔍 食品を検索（ごはん、鶏胸肉、バナナ…）" oninput="foodSearch(this.value)" maxlength="30" autocomplete="off" style="padding:10px 14px;font-size:13px">'
    + '<div id="food-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surf);border:1px solid var(--b2);border-radius:12px;max-height:300px;overflow-y:auto;z-index:100;box-shadow:0 12px 32px rgba(0,0,0,.3)"></div></div>'
    + '<details style="margin-top:8px"><summary style="font-size:12px;color:var(--org);cursor:pointer;font-weight:600">✏️ 手動で入力</summary>'
    + '<div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px">'
    + '<input class="input" id="m-name" maxlength="50" placeholder="食品名" style="grid-column:1/-1;font-size:12px">'
    + '<input class="input" id="m-kcal" type="number" min="0" placeholder="kcal" style="font-size:12px">'
    + '<input class="input" id="m-protein" type="number" min="0" step="0.1" placeholder="P(g)" style="font-size:12px">'
    + '<input class="input" id="m-carb" type="number" min="0" step="0.1" placeholder="C(g)" style="font-size:12px">'
    + '<input class="input" id="m-fat" type="number" min="0" step="0.1" placeholder="F(g)" style="font-size:12px">'
    + '<button class="btn btn-primary btn-sm" style="grid-column:1/-1" onclick="addMealManual()">＋ 追加</button>'
    + '</div></details>'
    + '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--b1)">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
    + '<span style="font-size:12px;font-weight:700;color:var(--txt2)">⭐ マイ定食</span>'
    + '<button class="btn btn-ghost btn-xs" onclick="openSaveMealTemplate()" style="font-size:10px">＋ 保存</button></div>'
    + _renderMealTemplates()
    + '</div></div>';
}

function _renderMealTemplates(){
  var tpls=DB.mealTemplates||[];
  if(!tpls.length) return '<div style="font-size:11px;color:var(--txt3);text-align:center;padding:6px">今日の食事を「マイ定食」として保存できます</div>';
  var h='<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">';
  for(var i=0;i<tpls.length;i++){
    var tp=tpls[i];
    h+='<div style="flex-shrink:0;padding:8px 12px;border:1px solid var(--b1);border-radius:10px;cursor:pointer;min-width:100px;background:var(--surf);transition:all .15s" onclick="applyMealTemplate('+i+')" onmouseover="this.style.borderColor=\'var(--org)\'" onmouseout="this.style.borderColor=\'var(--b1)\'">';
    h+='<div style="font-size:11px;font-weight:700">'+sanitize(tp.name,15)+'</div>';
    h+='<div style="font-size:10px;color:var(--txt3);margin-top:2px">'+tp.items.length+'品 · '+tp.totalKcal+'kcal</div>';
    h+='<div style="font-size:9px;color:var(--teal)">P'+tp.totalP+'g</div></div>';
  }
  h+='</div>';
  return h;
}

function openSaveMealTemplate(){
  var meals=DB.meals?.today||[];
  if(meals.length===0){toast('先に食事を記録してください','e');return;}
  var h='<div style="margin-bottom:14px"><label style="font-size:12px;font-weight:600;color:var(--txt3);display:block;margin-bottom:6px">テンプレート名</label>';
  h+='<input class="input" id="tpl-name" placeholder="例：いつもの朝食" maxlength="20" style="font-size:14px"></div>';
  h+='<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;color:var(--txt3);margin-bottom:6px">含める食品 ('+meals.length+'品)</div>';
  for(var i=0;i<meals.length;i++){
    var m=meals[i];
    h+='<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;cursor:pointer">';
    h+='<input type="checkbox" class="tpl-item-chk" value="'+i+'" checked> '+sanitize(m.name,25)+' <span style="color:var(--org);margin-left:auto">'+m.kcal+'kcal</span></label>';
  }
  h+='</div>';
  h+='<button class="btn btn-primary w-full" onclick="saveMealTemplate()">⭐ 保存する</button>';
  openM('マイ定食を保存', h);
}

function saveMealTemplate(){
  var name=(document.getElementById('tpl-name')?.value||'').trim();
  if(!name){toast('名前を入力してください','e');return;}
  var checks=document.querySelectorAll('.tpl-item-chk:checked');
  var meals=DB.meals?.today||[];
  var items=[];var totalK=0;var totalP=0;
  for(var i=0;i<checks.length;i++){
    var idx=parseInt(checks[i].value);
    if(meals[idx]){items.push(Object.assign({},meals[idx]));totalK+=meals[idx].kcal||0;totalP+=Math.round(meals[idx].protein||0);}
  }
  if(!items.length){toast('食品を選択してください','e');return;}
  if(!DB.mealTemplates) DB.mealTemplates=[];
  if(DB.mealTemplates.length>=10){toast('テンプレートは最大10個です','e');return;}
  DB.mealTemplates.push({name:name,items:items,totalKcal:totalK,totalP:totalP,created:new Date().toISOString().slice(0,10)});
  saveDB();closeM();toast('「'+name+'」を保存しました','s');goTo('nutrition');
}

function applyMealTemplate(idx){
  var tpl=(DB.mealTemplates||[])[idx];if(!tpl) return;
  var t=document.getElementById('meal-type')?.value||'breakfast';
  var now=new Date();var time=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  for(var i=0;i<tpl.items.length;i++){
    var item=Object.assign({},tpl.items[i]);
    item.id='m'+Date.now()+i;item.time=time;item.type=t;
    DB.meals.today.push(item);
  }
  saveDB();toast('「'+tpl.name+'」を追加（'+tpl.totalKcal+'kcal）','s');goTo('nutrition');
}

function copyYesterdayMeals(){
  var yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
  var ydKey=yesterday.toISOString().slice(0,10);
  var ydMeals=(DB.mealHistory||{})[ydKey]||[];
  if(!ydMeals.length){toast('昨日の記録がありません','e');return;}
  var h='<div style="margin-bottom:14px;font-size:13px;color:var(--txt2)">昨日（'+ydKey.slice(5)+'）の記録を今日にコピーします</div>';
  h+='<div style="margin-bottom:14px">';
  var totalK=0;
  for(var i=0;i<ydMeals.length;i++){
    var m=ydMeals[i];totalK+=(m.kcal||0);
    h+='<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;cursor:pointer;border-bottom:1px solid var(--b1)">';
    h+='<input type="checkbox" class="yd-chk" value="'+i+'" checked>';
    h+=' <span style="flex:1">'+sanitize(m.name||'食事',25)+'</span>';
    h+='<span style="color:var(--org)">'+Math.round(m.kcal||0)+'kcal</span></label>';
  }
  h+='</div><div style="text-align:center;margin-bottom:12px;font-size:12px;color:var(--txt3)">合計: '+totalK+'kcal</div>';
  h+='<button class="btn btn-primary w-full" onclick="doApplyYesterdayMeals()">📋 コピーする</button>';
  openM('昨日の食事をコピー', h);
}
function doApplyYesterdayMeals(){
  var yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
  var ydKey=yesterday.toISOString().slice(0,10);
  var ydMeals=(DB.mealHistory||{})[ydKey]||[];
  var checks=document.querySelectorAll('.yd-chk:checked');
  var now=new Date();var time=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  var count=0;
  for(var i=0;i<checks.length;i++){
    var idx=parseInt(checks[i].value);
    if(ydMeals[idx]){
      var item=Object.assign({},ydMeals[idx]);
      item.id='m'+Date.now()+i;item.time=time;
      DB.meals.today.push(item);count++;
    }
  }
  closeM();saveDB();toast(count+'品コピーしました','s');goTo('nutrition');
}

function _nutTodayMeals(tots, goal) {
  var typeLabel = {breakfast:'🌅 朝食',lunch:'☀️ 昼食',dinner:'🌙 夕食',snack:'🍌 補食'};
  var meals = DB.meals.today || [];
  var h = '<div style="background:var(--surf);border:1px solid var(--b1);border-radius:14px;padding:16px;margin-bottom:12px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h += '<span style="font-size:14px;font-weight:700">📋 今日の食事</span>';
  h += '<span style="font-size:13px;font-weight:700;color:var(--org);font-family:Montserrat,sans-serif">' + fmtNum(tots.kcal) + ' <span style="font-size:11px;color:var(--txt3);font-weight:400">/ ' + fmtNum(goal.kcal) + ' kcal</span></span></div>';
  if (!meals.length) {
    return h + '<div style="text-align:center;padding:20px;color:var(--txt3)"><div style="font-size:32px;opacity:.3;margin-bottom:6px">🍽️</div><div style="font-size:13px">まだ記録がありません</div></div></div>';
  }
  var types = ['breakfast','lunch','dinner','snack'];
  for (var ti = 0; ti < types.length; ti++) {
    var type = types[ti];
    var items = meals.filter(function(m){return m.type===type;});
    if (!items.length) continue;
    var sub = items.reduce(function(s,m){return s+(m.kcal||0);},0);
    h += '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    h += '<span style="font-size:13px;font-weight:700">' + typeLabel[type] + '</span>';
    h += '<span style="font-size:13px;color:var(--org);font-weight:700;font-family:Montserrat,sans-serif">' + sub + ' kcal</span></div>';
    for (var j = 0; j < items.length; j++) {
      var m = items[j];
      h += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf2);border-radius:10px;margin-bottom:4px">';
      h += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sanitize(m.name,28) + _foodConfidenceBadge(m.name) + '</div>';
      h += '<div style="display:flex;gap:8px;font-size:12px"><span style="color:#00cfaa;font-weight:600">P' + fmtN(m.protein) + 'g</span><span style="color:#3b82f6;font-weight:600">C' + fmtN(m.carb) + 'g</span><span style="color:#f59e0b;font-weight:600">F' + fmtN(m.fat) + 'g</span></div></div>';
      h += '<span style="font-size:14px;font-weight:800;font-family:Montserrat,sans-serif">' + m.kcal + '</span>';
      h += '<button onclick="openFoodCorrectionModal(\'' + m.id + '\')" style="background:none;border:none;color:var(--txt3);cursor:pointer;font-size:11px;padding:4px;opacity:.5" title="栄養データを補正"><i class="fas fa-pen" style="font-size:10px"></i></button>';
      h += '<button onclick="removeMeal(\'' + m.id + '\');goTo(\'nutrition\')" style="background:none;border:none;color:var(--txt3);cursor:pointer;font-size:13px;padding:4px;opacity:.4">&times;</button></div>';
    }
    h += '</div>';
  }
  return h + '</div>';
}

function _nutNutrientsWater(tots, goal) {
  var nut = [
    {l:'食物繊維',v:tots.fiber||0,t:goal.fiber,u:'g',c:'#a855f7'},
    {l:'ビタミンB1',v:tots.vitB1||0,t:goal.vitB1,u:'mg',c:'#ec4899'},
    {l:'ビタミンC',v:tots.vitC||0,t:goal.vitC,u:'mg',c:'#f97316'},
    {l:'ビタミンD',v:tots.vitD||0,t:goal.vitD||8,u:'μg',c:'#eab308'},
    {l:'カルシウム',v:tots.calcium||0,t:goal.calcium,u:'mg',c:'#6366f1'},
    {l:'鉄分',v:tots.iron||0,t:goal.iron,u:'mg',c:'#ef4444'},
    {l:'亜鉛',v:tots.zinc||0,t:goal.zinc||10,u:'mg',c:'#14b8a6'},
    {l:'マグネシウム',v:tots.magnesium||0,t:goal.magnesium||350,u:'mg',c:'#8b5cf6'},
    {l:'ナトリウム',v:tots.sodium||0,t:goal.sodium||2000,u:'mg',c:'#64748b',rev:true},
    {l:'オメガ3',v:tots.omega3||0,t:goal.omega3||2,u:'g',c:'#0ea5e9'}
  ];
  var h = '<div style="background:var(--surf);border:1px solid var(--b1);border-radius:14px;padding:16px;margin-bottom:12px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h += '<span style="font-size:14px;font-weight:700">📊 栄養素</span>';
  h += '<span style="font-size:11px;color:var(--txt3)">💧 ' + (DB.meals.water||0) + '/8杯</span></div>';
  for (var i = 0; i < nut.length; i++) {
    var n = nut[i], pct = n.t ? Math.round(parseFloat(fmtN(n.v))/n.t*100) : 0;
    if(n.rev){var st=pct<=100?'✓':pct>150?'⚠️':'↑';var col=pct<=100?'var(--grn)':pct>150?'#ef4444':'#f59e0b';}
    else{var st = pct>=90&&pct<=130?'✓':pct>130?'↑':'↓';var col = pct>=90&&pct<=130?'var(--grn)':pct>130?'#ef4444':n.c;}
    h += '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>' + n.l + '</span>';
    h += '<span style="font-weight:700">' + fmtN(n.v) + '/' + fmtN(n.t) + n.u + ' <span style="color:' + col + '">' + st + '</span></span></div>';
    h += '<div style="height:5px;background:var(--surf2);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + Math.min(pct,100) + '%;background:' + col + ';border-radius:3px"></div></div></div>';
  }
  h += '<div style="display:flex;gap:4px;margin-top:10px;flex-wrap:wrap">';
  for (var w = 0; w < 8; w++) {
    var a = (DB.meals.water||0) > w;
    h += '<div onclick="setWater(' + (w+1) + ');goTo(\'nutrition\')" style="width:32px;height:32px;border-radius:8px;border:2px solid ' + (a?'var(--teal)':'var(--b2)') + ';background:' + (a?'rgba(0,207,170,.12)':'transparent') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px">💧</div>';
  }
  h += '<span style="font-size:10px;color:var(--txt3);align-self:center;margin-left:4px">' + ((DB.meals.water||0)*250) + 'ml</span></div>';

  // ── 週間微量栄養素トレンド ──
  var hist2=DB.mealHistory||{};
  var histDays2=Object.keys(hist2).sort().slice(-7);
  if(histDays2.length>=3){
    h+='<details style="margin-top:10px;border-top:1px solid var(--b1);padding-top:8px"><summary style="font-size:11px;font-weight:700;color:var(--txt2);cursor:pointer">📈 週間トレンド ('+histDays2.length+'日)</summary>';
    h+='<div style="margin-top:6px">';
    var trendNuts=[
      {l:'タンパク質',k:'protein',t:goal.protein,u:'g',c:'var(--teal)'},
      {l:'カルシウム',k:'calcium',t:goal.calcium,u:'mg',c:'#6366f1'},
      {l:'鉄分',k:'iron',t:goal.iron,u:'mg',c:'#ef4444'},
      {l:'ビタミンD',k:'vitD',t:goal.vitD||8,u:'μg',c:'#eab308'},
      {l:'亜鉛',k:'zinc',t:goal.zinc||10,u:'mg',c:'#14b8a6'}
    ];
    for(var ti=0;ti<trendNuts.length;ti++){
      var tn=trendNuts[ti];
      var dayVals=[];
      for(var di2=0;di2<histDays2.length;di2++){
        var dayMeals=hist2[histDays2[di2]]||[];
        var val=0;for(var mi2=0;mi2<dayMeals.length;mi2++){val+=(dayMeals[mi2][tn.k]||0);}
        dayVals.push(val);
      }
      var avg=dayVals.reduce(function(s,v){return s+v;},0)/dayVals.length;
      var pct2=tn.t?Math.round(avg/tn.t*100):0;
      var trend2=dayVals.length>=2?(dayVals[dayVals.length-1]>dayVals[0]?'↑':'↓'):'→';
      h+='<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:4px">';
      h+='<span style="width:70px;color:var(--txt3)">'+tn.l+'</span>';
      h+='<div style="flex:1;height:4px;background:var(--b2);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+Math.min(pct2,100)+'%;background:'+tn.c+';border-radius:2px"></div></div>';
      h+='<span style="font-weight:700;width:35px;text-align:right">'+pct2+'%</span>';
      h+='<span style="color:'+(trend2==='↑'?'var(--teal)':trend2==='↓'?'#ef4444':'var(--txt3)')+';font-size:12px">'+trend2+'</span></div>';
    }
    h+='<div style="font-size:9px;color:var(--txt3);margin-top:4px;text-align:right">目標達成率の7日平均</div>';
    h+='</div></details>';
  }

  h+='</div>';
  return h;
}

function _nutAISection(analysis) {
  var tips = getRealtimeCoaching();
  var freq = getFrequentFoods(5);
  var combos = detectMealCombos();
  var histDays = Object.keys(DB.mealHistory||{}).length;
  var hasTips = (tips && tips.length > 0);
  var hasAdvice = !!analysis.advice;

  // ── メインAIカード（常に表示・目立つデザイン）──
  var h = '<div style="background:linear-gradient(135deg,rgba(0,207,170,.05),rgba(59,130,246,.05));border:1px solid var(--b1);border-radius:14px;margin-bottom:12px;overflow:hidden">';

  // ヘッダー
  h += '<div style="padding:14px 16px;display:flex;align-items:center;gap:10px">';
  h += '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--teal),var(--blue));display:flex;align-items:center;justify-content:center;font-size:18px">🧠</div>';
  h += '<div style="flex:1"><div style="font-size:14px;font-weight:800">AIコーチ</div>';
  h += '<div style="font-size:10px;color:var(--txt3)">' + histDays + '日分のデータから分析</div></div>';
  h += '<div style="display:flex;gap:4px">';
  h += '<button class="btn btn-ghost" style="font-size:10px;padding:4px 8px" onclick="openWeeklyReportModal()">📊</button>';
  h += '<button class="btn btn-ghost" style="font-size:10px;padding:4px 8px" onclick="openAILearningDashboard()">🧠</button></div></div>';

  // ── 栄養アドバイス ──
  if (hasAdvice) {
    h += '<div style="padding:0 16px 10px">';
    h += '<div style="padding:10px 14px;background:var(--surf);border-radius:10px;font-size:12px;color:var(--txt2);line-height:1.6">💡 ' + analysis.advice + '</div></div>';
  }

  // ── リアルタイムコーチング ──
  if (hasTips) {
    h += '<div style="padding:0 16px 12px">';
    for (var i = 0; i < tips.length; i++) {
      var t = tips[i];
      var bg, col, bdr;
      if (t.type === 'good') { bg='rgba(0,207,170,.08)'; col='var(--teal)'; bdr='rgba(0,207,170,.2)'; }
      else if (t.type === 'warn') { bg='rgba(249,115,22,.06)'; col='var(--org)'; bdr='rgba(249,115,22,.15)'; }
      else { bg='rgba(59,130,246,.06)'; col='var(--blue)'; bdr='rgba(59,130,246,.15)'; }
      h += '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;background:'+bg+';border:1px solid '+bdr+';border-radius:10px;margin-bottom:4px">';
      h += '<span style="font-size:14px;flex-shrink:0;line-height:1.2">' + t.icon + '</span>';
      h += '<span style="font-size:12px;color:'+col+';line-height:1.5">' + t.msg + '</span></div>';
    }
    h += '</div>';
  }

  // ── 週間トレンド ──
  var weekTrend = getWeeklyNutritionTrend();
  if(weekTrend.daysWithData >= 2) {
    var tIcon = weekTrend.trend==='up'?'📈':weekTrend.trend==='down'?'📉':'➡️';
    h += '<div style="padding:8px 16px 10px;border-top:1px solid var(--b1)">';
    h += '<div style="font-size:11px;font-weight:700;margin-bottom:6px;color:var(--txt2)">'+tIcon+' 週間トレンド（'+weekTrend.daysWithData+'日分）</div>';
    h += '<div style="display:flex;gap:4px;margin-bottom:4px">';
    weekTrend.days.forEach(function(d){
      var pct = d.kcal > 0 ? Math.min(100, Math.round(d.kcal / (getAdaptiveGoals().kcal||2000) * 100)) : 0;
      var col = pct >= 80 && pct <= 120 ? 'var(--teal)' : pct > 120 ? 'var(--red)' : pct > 0 ? 'var(--yel)' : 'var(--b2)';
      h += '<div style="flex:1;text-align:center"><div style="height:24px;background:var(--b1);border-radius:3px;overflow:hidden;display:flex;align-items:flex-end"><div style="width:100%;height:'+pct+'%;background:'+col+';border-radius:3px;min-height:'+(pct>0?'2px':'0')+'"></div></div><div style="font-size:8px;color:var(--txt3);margin-top:2px">'+d.date.slice(8)+'</div></div>';
    });
    h += '</div>';
    h += '<div style="font-size:10px;color:var(--txt3)">平均 '+weekTrend.avgKcal+'kcal / P'+weekTrend.avgProtein+'g';
    if(weekTrend.consistency==='poor') h += ' · <span style="color:var(--red)">記録が少なめです</span>';
    h += '</div></div>';
  }

  // ── 食事-体調相関インサイト ──
  var correlation = getNutritionConditionCorrelation();
  if(correlation && correlation.insights.length > 0) {
    h += '<div style="padding:6px 16px 10px;border-top:1px solid var(--b1)">';
    h += '<div style="font-size:11px;font-weight:700;margin-bottom:4px;color:var(--txt2)">🔬 食事-体調の相関分析</div>';
    correlation.insights.forEach(function(ins){
      h += '<div style="font-size:11px;color:var(--teal);padding:4px 8px;background:rgba(0,207,170,.06);border-radius:6px;margin-bottom:3px;line-height:1.5">💡 '+ins.msg+'</div>';
    });
    h += '</div>';
  }

  // ── クイック追加セクション（折りたたみ）──
  var hasQuickAdd = (freq.length > 0 || (combos && combos.length > 0) || (analysis.recommended && analysis.recommended.length > 0));
  if (hasQuickAdd) {
    h += '<details style="border-top:1px solid var(--b1)">';
    h += '<summary style="padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--txt2);list-style:none;display:flex;align-items:center;gap:6px">';
    h += '⚡ クイック追加・おすすめ';
    h += '<span style="font-size:10px;color:var(--txt3);font-weight:400;margin-left:auto">▼</span></summary>';
    h += '<div style="padding:6px 16px 14px">';

    // おすすめ食材（不足栄養素ベース）
    if (analysis.recommended && analysis.recommended.length > 0) {
      h += '<div style="margin-bottom:8px"><div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:4px">🥗 不足を補う食材</div>';
      for (var i = 0; i < Math.min(analysis.recommended.length, 4); i++) {
        var f = analysis.recommended[i], idx = FOOD_DB.indexOf(f);
        var ic = f.cat==='肉'?'🍖':f.cat==='魚'?'🐟':f.cat==='野菜'?'🥦':f.cat==='果物'?'🍎':f.cat==='乳製品'?'🥛':f.cat==='卵・大豆'?'🥚':'🍽️';
        h += '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surf);border-radius:8px;margin-bottom:3px;cursor:pointer" onclick="quickAddFood(\''+idx+'\')">';
        h += '<span>'+ic+'</span><div style="flex:1"><span style="font-size:12px;font-weight:600">'+sanitize(f.name,18)+'</span>';
        h += ' <span style="font-size:10px;color:var(--txt3)">P'+fmtN(f.protein)+'g '+f.kcal+'kcal</span></div>';
        h += '<span style="color:var(--org);font-weight:700;font-size:12px">＋</span></div>';
      }
      h += '</div>';
    }

    // よく食べるもの
    if (freq.length > 0) {
      h += '<div style="margin-bottom:8px"><div style="font-size:11px;font-weight:700;margin-bottom:4px">⭐ よく食べるもの</div><div style="display:flex;flex-wrap:wrap;gap:4px">';
      for (var i = 0; i < freq.length; i++) {
        var f = freq[i], dbIdx = FOOD_DB.findIndex(function(d){return d.name===f.name;});
        var oc = dbIdx >= 0 ? 'quickAddFood('+dbIdx+')' : "quickAddMyFood('"+f.name.replace(/'/g,"\\'")+"')";
        h += '<button onclick="'+oc+'" style="padding:4px 10px;border-radius:16px;border:1px solid var(--b1);background:var(--surf);font-size:11px;cursor:pointer;color:var(--txt2)">'+(f.count||1)+'回 '+f.name.split('（')[0]+'</button>';
      }
      h += '</div></div>';
    }

    // 組み合わせ
    if (combos && combos.length > 0) {
      h += '<div><div style="font-size:11px;font-weight:700;margin-bottom:4px">🔗 よく食べる組み合わせ</div>';
      for (var i = 0; i < Math.min(combos.length, 3); i++) {
        var c = combos[i];
        h += '<button onclick="addMealCombo(\''+c.items.map(function(x){return x.replace(/'/g,"\\'");}).join('|')+'\')" style="display:block;width:100%;padding:6px 10px;border-radius:8px;border:1px solid var(--b1);background:var(--surf);font-size:11px;cursor:pointer;color:var(--txt2);margin-bottom:3px;text-align:left">';
        h += c.items.join(' + ') + ' <span style="color:var(--org)">' + c.totalKcal + 'kcal</span></button>';
      }
      h += '</div>';
    }
    h += '</div></details>';
  }
  h += '</div>';
  return h;
}


function nutritionPage(){
  var tots = calcTotals();
  var player = DB.players.find(function(x){return x.id===DB.currentUser?.id;});
  var _goals = _getNutriGoals();
  var goal = _goals;
  var pfcTarget = {p:_goals.pfcP, f:_goals.pfcF, c:_goals.pfcC};
  var totalMacroKcal = (tots.protein*4)+(tots.carb*4)+(tots.fat*9);
  var pfcActual = {
    p: totalMacroKcal ? Math.round(tots.protein*4/totalMacroKcal*100) : 0,
    f: totalMacroKcal ? Math.round(tots.fat*9/totalMacroKcal*100) : 0,
    c: totalMacroKcal ? Math.round(tots.carb*4/totalMacroKcal*100) : 0
  };
  var score = calcNutritionScore(tots, goal);
  var scoreEmoji = score>=80?'😄':score>=60?'😊':score>=40?'😐':'😶';
  var analysis = analyzeNutrients(tots, goal);

  var html = '';
  // Header
  html += '<div class="pg-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
  html += '<div><div class="pg-title">🍽️ 食事管理</div></div>';
  html += '<div style="display:flex;gap:6px">';
  html += '<button class="btn btn-ghost btn-sm" onclick="openNutritionGoals()">🎯 目標</button>';
  html += '<button class="btn btn-ghost btn-sm" onclick="openNutritionAI()">🤖 AI分析</button>';
  html += '<button class="btn btn-ghost btn-sm" onclick="saveNutritionHistory();goTo(\'nutrition\');toast(\'保存しました\',\'s\')">💾</button></div></div>';
  // 初回: 目標未設定なら設定を促す
  if(!_goals.isSet){
    html += '<div style="background:linear-gradient(135deg,rgba(14,165,233,.08),rgba(0,207,170,.08));border:1.5px solid rgba(14,165,233,.25);border-radius:14px;padding:16px;margin-bottom:12px;text-align:center">'
      + '<div style="font-size:24px;margin-bottom:8px">🎯</div>'
      + '<div style="font-size:14px;font-weight:700;color:var(--txt1);margin-bottom:4px">PFC目標を設定しましょう</div>'
      + '<div style="font-size:12px;color:var(--txt3);margin-bottom:12px">体重に合わせた推奨値を自動計算します</div>'
      + '<button class="btn btn-primary" onclick="openNutritionGoals()" style="padding:10px 24px;font-size:13px">⚡ 目標を設定する</button></div>';
  }
  // 1. Summary bar
  html += _nutSummaryBar(tots, goal, score, scoreEmoji);
  // 2. PFC bars
  html += _nutPFCBars(tots, goal, pfcActual, pfcTarget);
  // 3. Meal entry (MOST IMPORTANT ACTION)
  html += _nutMealEntry();
  // 4. Today's meals
  html += _nutTodayMeals(tots, goal);
  // 5. Nutrients + Water
  html += _nutNutrientsWater(tots, goal);
  // 6. Smart remaining meals suggestion
  html += _nutRemainingMealsSuggestion(tots, goal);
  // 7. AI section (collapsed)
  html += _nutAISection(analysis);

  return html;
}

function calcNutritionScore(tots,goal){
  let score=100;
  const checks=[
    {v:tots.kcal,t:goal.kcal,w:18},{v:tots.protein,t:goal.protein,w:18},
    {v:tots.carb,t:goal.carb,w:12},{v:tots.fat,t:goal.fat,w:12},
    {v:tots.fiber||0,t:goal.fiber,w:8},{v:tots.vitC||0,t:goal.vitC,w:6},
    {v:tots.calcium||0,t:goal.calcium,w:5},{v:tots.iron||0,t:goal.iron,w:5},
    {v:tots.zinc||0,t:goal.zinc||10,w:4},{v:tots.magnesium||0,t:goal.magnesium||350,w:4},
    {v:tots.vitD||0,t:goal.vitD||8,w:4},{v:tots.omega3||0,t:goal.omega3||2,w:4},
  ];
  checks.forEach(c=>{
    const ratio=c.t?c.v/c.t:0;
    if(ratio<0.5) score-=c.w;
    else if(ratio<0.8) score-=c.w*0.5;
    else if(ratio>1.5) score-=c.w*0.3;
  });
  if(!DB.meals.today.length) score=0;
  return Math.max(0,Math.min(100,Math.round(score)));
}

function analyzeNutrients(tots,goal){
  const deficient=[];const excess=[];
  const nutrients=[
    {l:'タンパク質',v:tots.protein,t:goal.protein},{l:'炭水化物',v:tots.carb,t:goal.carb},
    {l:'脂質',v:tots.fat,t:goal.fat},{l:'食物繊維',v:tots.fiber||0,t:goal.fiber},
    {l:'ビタミンC',v:tots.vitC||0,t:goal.vitC},{l:'カルシウム',v:tots.calcium||0,t:goal.calcium},
    {l:'鉄分',v:tots.iron||0,t:goal.iron},{l:'亜鉛',v:tots.zinc||0,t:goal.zinc||10},
    {l:'マグネシウム',v:tots.magnesium||0,t:goal.magnesium||350},
    {l:'ビタミンD',v:tots.vitD||0,t:goal.vitD||8},{l:'オメガ3',v:tots.omega3||0,t:goal.omega3||2},
  ];
  nutrients.forEach(n=>{
    const r=n.t?n.v/n.t:0;
    if(r<0.7) deficient.push(n.l);
    else if(r>1.3) excess.push(n.l);
  });
  let advice='';
  if(!DB.meals.today.length){advice='食事を記録するとアドバイスが表示されます。';}
  else{
    if(deficient.length) advice+=`<b>不足:</b> ${deficient.join('、')}が不足しています。`;
    if(excess.length) advice+=`${deficient.length?' ':''}<b>過剰:</b> ${excess.join('、')}が多めです。`;
    if(!deficient.length&&!excess.length) advice='全体的にバランスが良好です！この調子で続けましょう。';
  }
  // おすすめ食品
  const recommended=[];
  if(deficient.includes('タンパク質')) recommended.push(...FOOD_DB.filter(f=>f.protein>=15).slice(0,2));
  if(deficient.includes('ビタミンC')) recommended.push(...FOOD_DB.filter(f=>(f.vitC||0)>=20).slice(0,2));
  if(deficient.includes('カルシウム')) recommended.push(...FOOD_DB.filter(f=>(f.calcium||0)>=80).slice(0,2));
  if(deficient.includes('鉄分')) recommended.push(...FOOD_DB.filter(f=>(f.iron||0)>=1).slice(0,2));
  if(deficient.includes('食物繊維')) recommended.push(...FOOD_DB.filter(f=>(f.fiber||0)>=2).slice(0,2));
  if(deficient.includes('亜鉛')) recommended.push(...FOOD_DB.filter(f=>(f.zinc||0)>=2).slice(0,2));
  if(deficient.includes('マグネシウム')) recommended.push(...FOOD_DB.filter(f=>(f.magnesium||0)>=30).slice(0,2));
  if(deficient.includes('ビタミンD')) recommended.push(...FOOD_DB.filter(f=>(f.vitD||0)>=3).slice(0,2));
  if(deficient.includes('オメガ3')) recommended.push(...FOOD_DB.filter(f=>(f.omega3||0)>=0.5).slice(0,2));
  if(!recommended.length) recommended.push(...FOOD_DB.filter(f=>f.cat==='野菜'||f.cat==='果物').slice(0,3));
  // deduplicate
  const seen=new Set();const unique=recommended.filter(f=>{if(seen.has(f.name))return false;seen.add(f.name);return true;});
  return {deficient,excess,advice,recommended:unique};
}

function quickAddMyFood(foodName) {
  if (!DB.myFoods) return;
  var f = null;
  for (var i=0; i<DB.myFoods.length; i++) { if (DB.myFoods[i].name === foodName) { f = DB.myFoods[i]; break; } }
  if (!f) { toast('食品が見つかりません','e'); return; }
  var t = document.getElementById('meal-type')?.value || 'lunch';
  var now = new Date();
  var time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  DB.meals.today.push({id:'m'+Date.now(), name:f.name, kcal:f.kcal||0, protein:f.protein||0, carb:f.carb||0, fat:f.fat||0,
    fiber:f.fiber||0, vitB1:f.vitB1||0, vitC:f.vitC||0, calcium:f.calcium||0, iron:f.iron||0, time:time, type:t, source:'my-food'});
  learnFromMeal(f, t);
  saveDB(); toast('✅ '+f.name+' を追加','s'); goTo('nutrition');
}
// インデックスベースのマイ食品追加（テンプレート安全版）
function quickAddMyFoodByIdx(freqIdx, isTimeRec) {
  var list = isTimeRec ? getTimeBasedRecommendations('lunch',10) : getFrequentFoods(10);
  var f = list[freqIdx];
  if (f) quickAddMyFood(f.name);
}
function quickAddMyFoodByIdx2(myIdx) {
  var f = (DB.myFoods||[])[myIdx];
  if (f) quickAddMyFood(f.name);
}

function quickAddFood(idx){
  const f=FOOD_DB[parseInt(idx)];if(!f)return;
  const t=document.getElementById('meal-type')?.value||'snack';
  const now=new Date();const time=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  DB.meals.today.push({id:'m'+Date.now(),name:f.name,kcal:f.kcal,protein:f.protein,carb:f.carb,fat:f.fat,fiber:f.fiber||0,vitB1:f.vitB1||0,vitC:f.vitC||0,calcium:f.calcium||0,iron:f.iron||0,time,type:t});
  learnFromMeal(f, t);
  saveDB();toast(`${f.name} を追加`,'s');goTo('nutrition');
}

function calcTotals(){
  return DB.meals.today.reduce((s,m)=>({
    kcal:s.kcal+(m.kcal||0),protein:s.protein+(m.protein||0),carb:s.carb+(m.carb||0),fat:s.fat+(m.fat||0),
    fiber:s.fiber+(m.fiber||0),vitB1:s.vitB1+(m.vitB1||0),vitC:s.vitC+(m.vitC||0),calcium:s.calcium+(m.calcium||0),iron:s.iron+(m.iron||0),
    sodium:s.sodium+(m.sodium||0),zinc:s.zinc+(m.zinc||0),magnesium:s.magnesium+(m.magnesium||0),vitD:s.vitD+(m.vitD||0),omega3:s.omega3+(m.omega3||0)
  }),{kcal:0,protein:0,carb:0,fat:0,fiber:0,vitB1:0,vitC:0,calcium:0,iron:0,sodium:0,zinc:0,magnesium:0,vitD:0,omega3:0});
}
function initNutrition(){
  document.addEventListener('click',e=>{if(!e.target.closest('#food-q')&&!e.target.closest('#food-results')){const r=document.getElementById('food-results');if(r)r.style.display='none'}});
}

// ── PFC目標設定 ──
function openNutritionGoals(){
  const p=DB.players?.find(x=>x.id===DB.currentUser?.id)||{};
  const w=p.weight||65;
  // 現在の設定値 or デフォルト推奨値
  const tk=p.targetKcal||Math.round(w*35);
  const tp=p.targetProtein||Math.round(w*1.6);
  const tc=p.targetCarb||Math.round(tk*0.55/4);
  const tf=p.targetFat||Math.round(tk*0.25/9);
  const pfcP=p.pfcRatioP||20;
  const pfcF=p.pfcRatioF||25;
  const pfcC=p.pfcRatioC||55;

  openM('🎯 PFC目標設定',`<div style="display:grid;gap:14px">
    <div style="background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.2);border-radius:10px;padding:12px;font-size:12px;color:var(--txt2)">
      💡 体重 <b>${w}kg</b> をもとに推奨値を計算しています。<br>体重を変更するには<a href="#" onclick="event.preventDefault();closeM();goTo('profile')" style="color:var(--org);font-weight:600">プロフィール設定</a>から。
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div>
        <label class="label">目標カロリー (kcal)</label>
        <input class="input" id="ng-kcal" type="number" value="${tk}" min="800" max="6000" step="50" oninput="recalcPFCFromKcal()">
      </div>
      <div>
        <label class="label">タンパク質 P (g)</label>
        <input class="input" id="ng-protein" type="number" value="${tp}" min="20" max="400" step="1">
      </div>
      <div>
        <label class="label">炭水化物 C (g)</label>
        <input class="input" id="ng-carb" type="number" value="${tc}" min="20" max="800" step="1">
      </div>
      <div>
        <label class="label">脂質 F (g)</label>
        <input class="input" id="ng-fat" type="number" value="${tf}" min="10" max="300" step="1">
      </div>
    </div>
    <div>
      <label class="label">PFCバランス目標 (%)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
        <div style="text-align:center">
          <div style="font-size:11px;color:#00cfaa;font-weight:700;margin-bottom:4px">P (タンパク質)</div>
          <input class="input" id="ng-pfc-p" type="number" value="${pfcP}" min="5" max="60" style="text-align:center;font-weight:700">
        </div>
        <div style="text-align:center">
          <div style="font-size:11px;color:#f59e0b;font-weight:700;margin-bottom:4px">F (脂質)</div>
          <input class="input" id="ng-pfc-f" type="number" value="${pfcF}" min="5" max="60" style="text-align:center;font-weight:700">
        </div>
        <div style="text-align:center">
          <div style="font-size:11px;color:#3b82f6;font-weight:700;margin-bottom:4px">C (炭水化物)</div>
          <input class="input" id="ng-pfc-c" type="number" value="${pfcC}" min="5" max="80" style="text-align:center;font-weight:700">
        </div>
      </div>
      <div id="ng-pfc-total" style="text-align:center;font-size:11px;color:var(--txt3);margin-top:4px">合計: ${pfcP+pfcF+pfcC}%</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
      <button class="btn btn-ghost btn-sm" onclick="setNutriPreset('bulk')" style="font-size:11px">💪 増量期</button>
      <button class="btn btn-ghost btn-sm" onclick="setNutriPreset('maintain')" style="font-size:11px">⚖️ 維持</button>
      <button class="btn btn-ghost btn-sm" onclick="setNutriPreset('cut')" style="font-size:11px">🔥 減量期</button>
    </div>
    <div style="border-top:1px solid var(--b1);padding-top:12px;margin-top:4px">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">🤖 AI写真解析の設定</div>
      <div style="font-size:11px;color:var(--txt3);line-height:1.6;margin-bottom:8px">
        Gemini APIキーを設定すると<b>食事写真の自動解析</b>と<b>テキストAI入力</b>が有効になります。
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--org);font-weight:600">Google AI Studio</a>で無料取得できます。
      </div>
      <div class="form-group" style="margin-bottom:6px">
        <input class="input" id="ng-gemini-key" type="password" value="" placeholder="${_getGeminiKey()?'••••••（設定済み・変更する場合のみ入力）':'AIza...'}" style="font-family:monospace;font-size:12px">
      </div>
      <div style="font-size:10px;color:var(--txt3)">${DB.settings?.geminiKey?'<span style="color:var(--teal)">✅ 設定済み — 📸写真AI解析 + 🤖テキストAI入力が有効</span>':'⚠️ 未設定 — 写真撮影時は手動選択のみ'}</div>
    </div>
    <button class="btn btn-primary w-full" onclick="saveNutritionGoals()" style="margin-top:12px">💾 保存する</button>
  </div>`);
  // PFC合計リアルタイム更新
  ['ng-pfc-p','ng-pfc-f','ng-pfc-c'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('input',()=>{
      const t=(parseInt(document.getElementById('ng-pfc-p')?.value)||0)+(parseInt(document.getElementById('ng-pfc-f')?.value)||0)+(parseInt(document.getElementById('ng-pfc-c')?.value)||0);
      const tel=document.getElementById('ng-pfc-total');
      if(tel){tel.textContent='合計: '+t+'%';tel.style.color=t===100?'var(--teal)':'var(--red)';}
    });
  });
}

function recalcPFCFromKcal(){
  const k=parseInt(document.getElementById('ng-kcal')?.value)||2200;
  const pp=parseInt(document.getElementById('ng-pfc-p')?.value)||20;
  const fp=parseInt(document.getElementById('ng-pfc-f')?.value)||25;
  const cp=parseInt(document.getElementById('ng-pfc-c')?.value)||55;
  const pe=document.getElementById('ng-protein');if(pe)pe.value=Math.round(k*pp/100/4);
  const ce=document.getElementById('ng-carb');if(ce)ce.value=Math.round(k*cp/100/4);
  const fe=document.getElementById('ng-fat');if(fe)fe.value=Math.round(k*fp/100/9);
}

function setNutriPreset(type){
  const p=DB.players?.find(x=>x.id===DB.currentUser?.id)||{};
  const w=p.weight||65;
  const presets={
    bulk:{kcal:Math.round(w*45),p:25,f:25,c:50},
    maintain:{kcal:Math.round(w*35),p:20,f:25,c:55},
    cut:{kcal:Math.round(w*28),p:30,f:20,c:50}
  };
  const pr=presets[type]||presets.maintain;
  const ke=document.getElementById('ng-kcal');if(ke)ke.value=pr.kcal;
  const ppe=document.getElementById('ng-pfc-p');if(ppe)ppe.value=pr.p;
  const fe=document.getElementById('ng-pfc-f');if(fe)fe.value=pr.f;
  const ce=document.getElementById('ng-pfc-c');if(ce)ce.value=pr.c;
  recalcPFCFromKcal();
  const tel=document.getElementById('ng-pfc-total');
  if(tel){tel.textContent='合計: '+(pr.p+pr.f+pr.c)+'%';tel.style.color=(pr.p+pr.f+pr.c)===100?'var(--teal)':'var(--red)';}
  toast(type==='bulk'?'💪 増量期プリセット':type==='cut'?'🔥 減量期プリセット':'⚖️ 維持プリセット','s');
}

function saveNutritionGoals(){
  const kcal=parseInt(document.getElementById('ng-kcal')?.value)||2200;
  const protein=parseInt(document.getElementById('ng-protein')?.value)||80;
  const carb=parseInt(document.getElementById('ng-carb')?.value)||275;
  const fat=parseInt(document.getElementById('ng-fat')?.value)||60;
  const pfcP=parseInt(document.getElementById('ng-pfc-p')?.value)||20;
  const pfcF=parseInt(document.getElementById('ng-pfc-f')?.value)||25;
  const pfcC=parseInt(document.getElementById('ng-pfc-c')?.value)||55;
  if(pfcP+pfcF+pfcC!==100){toast('PFC比率の合計を100%にしてください','e');return;}
  // Save to player or currentUser
  let p=DB.players?.find(x=>x.id===DB.currentUser?.id);
  if(!p){
    // If not a player, save to DB.nutriGoals for current user
    if(!DB.nutriGoals)DB.nutriGoals={};
    DB.nutriGoals[DB.currentUser?.id||'default']={targetKcal:kcal,targetProtein:protein,targetCarb:carb,targetFat:fat,pfcRatioP:pfcP,pfcRatioF:pfcF,pfcRatioC:pfcC};
  } else {
    p.targetKcal=kcal;p.targetProtein=protein;p.targetCarb=carb;p.targetFat=fat;
    p.pfcRatioP=pfcP;p.pfcRatioF=pfcF;p.pfcRatioC=pfcC;
  }
  // Save Gemini API key (only if user entered a new value)
  var _gemKeyEl = document.getElementById('ng-gemini-key');
  if(_gemKeyEl) {
    if(!DB.settings) DB.settings = {};
    var _newKey = (_gemKeyEl.value||'').trim();
    DB.settings.geminiKey = _newKey ? _obfuscateKey(_newKey) : (DB.settings.geminiKey || '');
  }
  saveDB();closeM();toast('🎯 目標を保存しました','s');goTo('nutrition');
}

function _getNutriGoals(){
  const p=DB.players?.find(x=>x.id===DB.currentUser?.id);
  const g=(DB.nutriGoals||{})[DB.currentUser?.id||'default'];
  const src=p||g||{};
  const w=p?.weight||65;
  return {
    kcal:src.targetKcal||Math.round(w*35),
    protein:src.targetProtein||Math.round(w*1.6),
    carb:src.targetCarb||Math.round((src.targetKcal||Math.round(w*35))*0.55/4),
    fat:src.targetFat||Math.round((src.targetKcal||Math.round(w*35))*0.25/9),
    fiber:25,vitB1:1.4,vitC:100,calcium:800,iron:10,sodium:2000,zinc:10,magnesium:350,vitD:8,omega3:2,
    pfcP:src.pfcRatioP||20,pfcF:src.pfcRatioF||25,pfcC:src.pfcRatioC||55,
    isSet:!!(src.targetKcal)
  };
}
function renderMealList(){ if(typeof goTo==='function') goTo('nutrition'); }
function renderWater(){ if(typeof goTo==='function') goTo('nutrition'); }
function setWater(n){DB.meals.water=DB.meals.water===n?n-1:n;saveDB();}
function foodSearch(q){
  const r=document.getElementById('food-results');if(!r)return;
  if(!q.trim()){r.style.display='none';return}
  const ql=q.toLowerCase();
  // ── 拡張検索: ひらがな⇔カタカナ変換、シノニム対応 ──
  const qk=_toKatakana(ql);const qh=_toHiragana(ql);
  function _fmatch(name){
    var nl=name.toLowerCase();
    if(nl.includes(ql)) return 10;
    if(nl.includes(qk)||nl.includes(qh)) return 8;
    // シノニム検索
    var syns=_getSynonyms(ql);
    for(var si2=0;si2<syns.length;si2++){if(nl.includes(syns[si2])) return 6;}
    return 0;
  }
  // FOOD_DB + myFoods（学習済み）から検索、学習済みを優先
  const myRes = (DB.myFoods||[]).filter(f=>_fmatch(f.name)>0);
  const dbRes = FOOD_DB.filter(f=>_fmatch(f.name)>0);
  // チーム共有学習DBからも検索
  const knowledgeRes = Object.values(DB.foodKnowledge||{}).filter(f=>_fmatch(f.name)>0 && f.confidence>=20);
  // マイ食品+学習DB+FOOD_DBを統合（重複排除）
  const allNames = new Set();
  const combined = [];
  // 優先順: 1.マイ食品 2.チーム学習DB 3.FOOD_DB
  myRes.forEach(f=>{allNames.add(f.name);combined.push({...f,isLearned:true,learnCount:f.count||0});});
  knowledgeRes.forEach(f=>{if(!allNames.has(f.name)){allNames.add(f.name);combined.push({...f,isLearned:true,learnCount:f.samples||0,_fromKnowledge:true});}});
  dbRes.forEach(f=>{if(!allNames.has(f.name)){combined.push({...f,isLearned:false});}});
  // 学習回数でソート
  combined.sort((a,b)=>(b.learnCount||0)-(a.learnCount||0));

  if(!combined.length){r.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:var(--txt3)">見つかりません。手動入力をお試しください。</div>';r.style.display='block';return}
  r.style.display='block';
  r.innerHTML=combined.slice(0,12).map(f=>{
    const idx=FOOD_DB.findIndex(x=>x.name===f.name);
    const myIdx=(DB.myFoods||[]).findIndex(x=>x.name===f.name); const onclick = idx >= 0 ? `addFoodFromSearch(\x27${idx}\x27)` : `quickAddMyFoodByIdx2(${myIdx})`;
    const catEmojis={'肉':'🍖','魚':'🐟','主食':'🍚','野菜':'🥦','果物':'🍎','乳製品':'🥛','卵・大豆':'🥚','外食':'🍱','補食':'🍫','飲料':'🥤','マイ食品':'⭐'};
    return`<div onclick="${onclick}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--b1);transition:background .1s" onmouseover="this.style.background='var(--surf3)'" onmouseout="this.style.background=''">
      <span style="font-size:16px">${catEmojis[f.cat]||'🍽️'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.isLearned?'<span style="font-size:9px;background:rgba(249,115,22,.15);color:var(--org);padding:1px 5px;border-radius:6px;margin-right:4px">学習済</span>':''}${sanitize(f.name,40)}</div>
        <div style="font-size:10px;color:var(--txt3)"><span style="color:var(--teal)">P${fmtN(f.protein)}g</span> <span style="color:var(--blue)">C${fmtN(f.carb)}g</span> <span style="color:var(--yel)">F${fmtN(f.fat)}g</span>${f.gi?` <span style="padding:0 4px;border-radius:4px;font-size:8px;font-weight:700;background:${f.gi>=70?'rgba(239,68,68,.12);color:#ef4444':f.gi>=55?'rgba(249,115,22,.12);color:var(--org)':'rgba(0,207,170,.12);color:var(--teal)'}">GI${f.gi}</span>`:''}${f.serving?' · '+f.serving+'g':''} ${f.isLearned?' · <span style="color:var(--org)">'+f.count+'回</span>':''}</div>
      </div>
      <span style="font-size:12px;font-weight:700;color:var(--org);flex-shrink:0">${f.kcal}kcal</span>
    </div>`;
  }).join('');
}
function addFoodFromSearch(idx){
  const f=FOOD_DB[parseInt(idx)];if(!f)return;
  // 量調整モーダル
  _showServingModal(f, parseInt(idx));
}
function _showServingModal(f, dbIdx){
  var servingG=f.serving||100;
  var h='<div style="text-align:center;margin-bottom:16px">';
  h+='<div style="font-size:16px;font-weight:800">'+sanitize(f.name,30)+'</div>';
  h+='<div style="font-size:12px;color:var(--txt3);margin-top:4px">'+servingG+'g あたりの栄養素</div></div>';
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px;text-align:center">';
  h+='<div style="background:rgba(249,115,22,.06);border-radius:10px;padding:8px"><div style="font-size:18px;font-weight:800;color:var(--org)">'+f.kcal+'</div><div style="font-size:9px;color:var(--txt3)">kcal</div></div>';
  h+='<div style="background:rgba(0,207,170,.06);border-radius:10px;padding:8px"><div style="font-size:18px;font-weight:800;color:var(--teal)">'+fmtN(f.protein)+'</div><div style="font-size:9px;color:var(--txt3)">P(g)</div></div>';
  h+='<div style="background:rgba(59,130,246,.06);border-radius:10px;padding:8px"><div style="font-size:18px;font-weight:800;color:var(--blue)">'+fmtN(f.carb)+'</div><div style="font-size:9px;color:var(--txt3)">C(g)</div></div>';
  h+='<div style="background:rgba(234,179,8,.06);border-radius:10px;padding:8px"><div style="font-size:18px;font-weight:800;color:#b45309">'+fmtN(f.fat)+'</div><div style="font-size:9px;color:var(--txt3)">F(g)</div></div></div>';
  // GI表示
  if(f.gi){
    var giCol=f.gi>=70?'#ef4444':f.gi>=55?'var(--org)':'var(--teal)';
    var giLbl=f.gi>=70?'高GI':f.gi>=55?'中GI':'低GI';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:var(--surf2);border-radius:10px">';
    h+='<div style="font-size:11px;color:var(--txt3)">GI値</div>';
    h+='<div style="font-size:16px;font-weight:800;color:'+giCol+'">'+f.gi+'</div>';
    h+='<span style="font-size:10px;color:'+giCol+';font-weight:600">'+giLbl+'</span>';
    h+='<div style="font-size:10px;color:var(--txt3);margin-left:auto">'+(f.gi>=70?'練習直前・直後に最適':'食後血糖値が緩やか')+'</div></div>';
  }
  // 微量栄養素
  h+='<details style="margin-bottom:14px"><summary style="font-size:11px;color:var(--txt3);cursor:pointer">📊 詳細栄養素</summary>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:6px;font-size:11px">';
  var micros=[['食物繊維',f.fiber,'g'],['VitB1',f.vitB1,'mg'],['VitC',f.vitC,'mg'],['VitD',f.vitD,'μg'],['Ca',f.calcium,'mg'],['鉄',f.iron,'mg'],['亜鉛',f.zinc,'mg'],['Mg',f.magnesium,'mg'],['Na',f.sodium,'mg'],['Ω3',f.omega3,'g']];
  for(var mi=0;mi<micros.length;mi++){
    var mv=micros[mi][1]||0;
    h+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="color:var(--txt3)">'+micros[mi][0]+'</span><span style="font-weight:600">'+fmtN(mv)+micros[mi][2]+'</span></div>';
  }
  h+='</div></details>';
  // 量調整
  h+='<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;margin-bottom:8px">📏 量を調整</div>';
  h+='<div id="serving-display" style="text-align:center;font-size:14px;font-weight:700;margin-bottom:8px">1.0 人前 ('+servingG+'g) = '+f.kcal+'kcal</div>';
  // グラム入力スライダー
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
  h+='<input type="range" id="sv-slider" min="10" max="'+Math.round(servingG*3)+'" value="'+servingG+'" step="5" style="flex:1;accent-color:var(--org)" oninput="_updateServingGram('+dbIdx+',this.value)">';
  h+='<input type="number" id="sv-gram" value="'+servingG+'" min="1" max="9999" style="width:65px;padding:6px 8px;border:1px solid var(--b1);border-radius:8px;text-align:center;font-size:14px;font-weight:700;background:var(--surf);color:var(--txt)" onchange="_updateServingGram('+dbIdx+',this.value)">';
  h+='<span style="font-size:12px;color:var(--txt3)">g</span></div>';
  // プリセットボタン
  h+='<div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-bottom:4px">';
  var presets=[{l:'半分',m:0.5},{l:'少なめ',m:0.75},{l:'1人前',m:1.0},{l:'多め',m:1.25},{l:'大盛',m:1.5},{l:'2人前',m:2.0}];
  for(var si3=0;si3<presets.length;si3++){
    var pr=presets[si3]; var isDefault=pr.m===1.0;
    h+='<button onclick="_updateServing('+dbIdx+','+pr.m+')" id="sv-btn-'+si3+'" style="padding:5px 10px;border-radius:8px;border:'+(isDefault?'2px solid var(--org)':'1px solid var(--b1)')+';background:'+(isDefault?'rgba(249,115,22,.1)':'var(--surf)')+';cursor:pointer;font-size:11px;font-weight:'+(isDefault?'700':'500')+';color:'+(isDefault?'var(--org)':'var(--txt2)')+'">'+pr.l+'</button>';
  }
  h+='</div></div>';
  h+='<button class="btn btn-primary w-full" style="padding:14px;font-size:15px;font-weight:700" onclick="_confirmAddFood('+dbIdx+')">✅ 追加する</button>';
  openM(sanitize(f.name,25), h);
  window._servingMultiplier=1.0;
}
function _updateServingGram(idx,grams){
  var f=FOOD_DB[idx];if(!f) return;
  var baseG=f.serving||100;
  var mult=Math.round(grams/baseG*100)/100;
  window._servingMultiplier=mult;
  var k=Math.round(f.kcal*mult);
  var el=document.getElementById('serving-display');
  if(el) el.innerHTML=mult.toFixed(2)+' 人前 ('+grams+'g) = <span style="color:var(--org);font-size:16px">'+k+'kcal</span>';
  var slider=document.getElementById('sv-slider');
  var gramInput=document.getElementById('sv-gram');
  if(slider) slider.value=grams;
  if(gramInput) gramInput.value=grams;
  // Deselect all preset buttons
  [0,1,2,3,4,5].forEach(function(i){
    var btn=document.getElementById('sv-btn-'+i);
    if(btn){btn.style.border='1px solid var(--b1)';btn.style.background='var(--surf)';btn.style.fontWeight='500';btn.style.color='var(--txt2)';}
  });
}
function _updateServing(idx,mult){
  window._servingMultiplier=mult;
  var f=FOOD_DB[idx];if(!f) return;
  var g=Math.round((f.serving||100)*mult);
  var k=Math.round(f.kcal*mult);
  var el=document.getElementById('serving-display');
  if(el) el.innerHTML=mult+' 人前 ('+g+'g) = <span style="color:var(--org);font-size:16px">'+k+'kcal</span>';
  // Sync slider & gram input
  var f2=FOOD_DB[idx];if(f2){
    var newG=Math.round((f2.serving||100)*mult);
    var slider2=document.getElementById('sv-slider');
    var gramInput2=document.getElementById('sv-gram');
    if(slider2) slider2.value=newG;
    if(gramInput2) gramInput2.value=newG;
  }
  // Update button styles
  [0.5,0.75,1.0,1.25,1.5,2.0].forEach(function(m,i){
    var btn=document.getElementById('sv-btn-'+i);
    if(btn){
      var active=m===mult;
      btn.style.border=active?'2px solid var(--org)':'1px solid var(--b1)';
      btn.style.background=active?'rgba(249,115,22,.1)':'var(--surf)';
      btn.style.fontWeight=active?'700':'500';
      btn.style.color=active?'var(--org)':'var(--txt2)';
    }
  });
}
function _confirmAddFood(idx){
  var f=FOOD_DB[idx];if(!f) return;
  var mult=window._servingMultiplier||1.0;
  var t=document.getElementById('meal-type')?.value||'breakfast';
  var now=new Date();var time=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  var g=Math.round((f.serving||100)*mult);
  DB.meals.today.push({
    id:'m'+Date.now(),
    name:f.name+(mult!==1.0?' ('+mult+'×)':''),
    kcal:Math.round(f.kcal*mult),protein:Math.round(f.protein*mult*10)/10,
    carb:Math.round(f.carb*mult*10)/10,fat:Math.round(f.fat*mult*10)/10,
    fiber:Math.round((f.fiber||0)*mult*10)/10,
    vitB1:Math.round((f.vitB1||0)*mult*100)/100,vitC:Math.round((f.vitC||0)*mult*10)/10,
    calcium:Math.round((f.calcium||0)*mult),iron:Math.round((f.iron||0)*mult*10)/10,
    sodium:Math.round((f.sodium||0)*mult),zinc:Math.round((f.zinc||0)*mult*10)/10,
    magnesium:Math.round((f.magnesium||0)*mult),vitD:Math.round((f.vitD||0)*mult*10)/10,
    omega3:Math.round((f.omega3||0)*mult*10)/10,
    gi:f.gi||0,serving:g,time:time,type:t
  });
  learnFromMeal(f, t);
  document.getElementById('food-q').value='';
  document.getElementById('food-results').style.display='none';
  closeM();
  saveDB();toast(f.name+(mult!==1.0?' ('+mult+'×)':'')+' を追加（'+Math.round(f.kcal*mult)+'kcal）','s');goTo('nutrition');
}
function addMealManual(){
  const n=document.getElementById('m-name')?.value;const k=parseInt(document.getElementById('m-kcal')?.value)||0;
  const p=parseFloat(document.getElementById('m-protein')?.value)||0;const c=parseFloat(document.getElementById('m-carb')?.value)||0;const fa=parseFloat(document.getElementById('m-fat')?.value)||0;
  if(!n){toast('食品名を入力してください','e');return}
  const t=document.getElementById('meal-type')?.value||'breakfast';
  const now=new Date();const time=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  var manualFood = {name:sanitize(n,50),kcal:k,protein:p,carb:c,fat:fa,fiber:0,vitB1:0,vitC:0,calcium:0,iron:0,cat:'マイ食品',source:'manual'};
  DB.meals.today.push({id:'m'+Date.now(),name:sanitize(n,50),kcal:k,protein:p,carb:c,fat:fa,fiber:0,vitB1:0,vitC:0,calcium:0,iron:0,time,type:t});
  learnFromMeal(manualFood, t);
  ['m-name','m-kcal','m-protein','m-carb','m-fat'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
  saveDB();toast(`${n} を追加`,'s');goTo('nutrition');
}
function removeMeal(id){DB.meals.today=DB.meals.today.filter(m=>m.id!==id);saveDB();}

// ==================== 🧠 AI学習エンジン ====================
// 食事を記録するたびに学習DBを更新
function learnFromMeal(food, mealType) {
  if (!food || !food.name) return;
  if (!DB.myFoods) DB.myFoods = [];
  if (!DB.mealHistory) DB.mealHistory = {};

  var today = new Date().toISOString().slice(0, 10);
  var hour = new Date().getHours();

  // 1. myFoodsに学習（既存なら回数＋、なければ追加）
  var existing = null;
  for (var i = 0; i < DB.myFoods.length; i++) {
    if (DB.myFoods[i].name === food.name) { existing = DB.myFoods[i]; break; }
  }
  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.lastUsed = today;
    if (!existing.timeSlots) existing.timeSlots = {};
    var slot = hour < 10 ? 'morning' : hour < 14 ? 'lunch' : hour < 18 ? 'afternoon' : 'dinner';
    existing.timeSlots[slot] = (existing.timeSlots[slot] || 0) + 1;
    if (!existing.mealTypes) existing.mealTypes = {};
    existing.mealTypes[mealType] = (existing.mealTypes[mealType] || 0) + 1;
  } else {
    var slot = hour < 10 ? 'morning' : hour < 14 ? 'lunch' : hour < 18 ? 'afternoon' : 'dinner';
    var ts = {}; ts[slot] = 1;
    var mt = {}; mt[mealType] = 1;
    DB.myFoods.push({
      name: food.name, kcal: food.kcal || 0, protein: food.protein || 0,
      carb: food.carb || 0, fat: food.fat || 0, fiber: food.fiber || 0,
      vitB1: food.vitB1 || 0, vitC: food.vitC || 0, calcium: food.calcium || 0, iron: food.iron || 0,
      cat: food.cat || 'マイ食品', count: 1, lastUsed: today, source: food.source || 'manual',
      timeSlots: ts, mealTypes: mt
    });
  }

  // 2. mealHistoryに日別アーカイブ
  if (!DB.mealHistory[today]) DB.mealHistory[today] = [];
  DB.mealHistory[today].push({
    name: food.name, kcal: food.kcal || 0, protein: food.protein || 0,
    carb: food.carb || 0, fat: food.fat || 0, type: mealType, time: hour + ':00',
    date: today
  });
  // 3. チーム共有AI食品学習DBに蓄積
  _addToFoodKnowledge(food, food.source || 'user');
}

// ================================================================
// ■ 独自AI食品学習システム（チーム共有ナレッジベース）
// ================================================================
// 蓄積した食品データでAI精度を向上させる仕組み:
// 1. AI解析結果を自動蓄積 → 同じ食品は平均化して精度向上
// 2. ユーザーの手動補正を反映 → 補正データで学習
// 3. ローカルDB優先マッチ → API呼び出し前に蓄積データで即応答
// 4. 信頼度スコア → サンプル数・補正回数で精度を可視化
// ================================================================

function _normalizeFoodName(name){
  // 食品名の正規化（揺れ吸収）
  return (name||'').trim().toLowerCase()
    .replace(/（.*?）/g,'').replace(/\(.*?\)/g,'')
    .replace(/\s+/g,' ').replace(/　/g,' ')
    .replace(/[０-９]/g,function(s){return String.fromCharCode(s.charCodeAt(0)-0xFEE0);})
    .replace(/[ａ-ｚＡ-Ｚ]/g,function(s){return String.fromCharCode(s.charCodeAt(0)-0xFEE0);})
    .trim();
}

function _getFoodKnowledge(name){
  if(!DB.foodKnowledge) DB.foodKnowledge={};
  var key=_normalizeFoodName(name);
  return key ? DB.foodKnowledge[key] || null : null;
}

function _addToFoodKnowledge(food, source){
  // AI解析結果やユーザー入力を学習DBに蓄積
  if(!food||!food.name) return;
  if(!DB.foodKnowledge) DB.foodKnowledge={};
  var key=_normalizeFoodName(food.name);
  if(!key) return;

  var existing=DB.foodKnowledge[key];
  if(!existing){
    // 新規登録
    DB.foodKnowledge[key]={
      name:food.name,
      kcal:food.kcal||0, protein:food.protein||0, carb:food.carb||0,
      fat:food.fat||0, fiber:food.fiber||0,
      vitC:food.vitC||0, calcium:food.calcium||0, iron:food.iron||0,
      samples:1, corrections:0,
      confidence:_calcConfidence(1,0),
      source:source||'ai',
      lastUpdated:new Date().toISOString()
    };
  } else {
    // 既存→加重平均で精度向上（サンプル数が多いほど安定）
    var n=existing.samples||1;
    var w=1/(n+1); // 新しいサンプルの重み
    ['kcal','protein','carb','fat','fiber','vitC','calcium','iron'].forEach(function(k){
      var oldVal=existing[k]||0;
      var newVal=food[k]||0;
      if(newVal>0){
        existing[k]=Math.round((oldVal*n+newVal)/(n+1)*10)/10;
      }
    });
    existing.samples=n+1;
    existing.confidence=_calcConfidence(existing.samples, existing.corrections||0);
    existing.lastUpdated=new Date().toISOString();
  }
}

function _correctFoodKnowledge(name, correctedValues){
  // ユーザーの手動補正を反映（高い重みで学習）
  if(!name||!correctedValues) return;
  if(!DB.foodKnowledge) DB.foodKnowledge={};
  var key=_normalizeFoodName(name);
  if(!key) return;

  var existing=DB.foodKnowledge[key];
  if(!existing){
    // 補正データで新規作成
    DB.foodKnowledge[key]={
      name:name,
      kcal:correctedValues.kcal||0, protein:correctedValues.protein||0,
      carb:correctedValues.carb||0, fat:correctedValues.fat||0,
      fiber:correctedValues.fiber||0,
      vitC:correctedValues.vitC||0, calcium:correctedValues.calcium||0, iron:correctedValues.iron||0,
      samples:1, corrections:1,
      confidence:_calcConfidence(1,1),
      source:'correction',
      lastUpdated:new Date().toISOString()
    };
  } else {
    // 補正は高い重みで反映（通常の3倍）
    var n=existing.samples||1;
    var correctionWeight=3;
    ['kcal','protein','carb','fat','fiber','vitC','calcium','iron'].forEach(function(k){
      if(correctedValues[k]!==undefined && correctedValues[k]!==null){
        var oldVal=existing[k]||0;
        var newVal=correctedValues[k];
        existing[k]=Math.round((oldVal*n+newVal*correctionWeight)/(n+correctionWeight)*10)/10;
      }
    });
    existing.samples=n+1;
    existing.corrections=(existing.corrections||0)+1;
    existing.confidence=_calcConfidence(existing.samples, existing.corrections);
    existing.lastUpdated=new Date().toISOString();
  }
  saveDB();
}

function _calcConfidence(samples, corrections){
  // 信頼度スコア(0-100)
  // サンプル数が多い + 補正が入っている → 高信頼
  var base=Math.min(60, samples*12); // サンプル数: 最大60点
  var corrBonus=Math.min(30, corrections*10); // 補正回数: 最大30点
  var minBonus=samples>=3?10:0; // 3件以上で+10点
  return Math.min(100, base+corrBonus+minBonus);
}

function _lookupFoodKnowledge(name){
  // 蓄積DBから食品を検索（完全一致→部分一致→類似検索）
  if(!DB.foodKnowledge||!name) return null;
  var key=_normalizeFoodName(name);
  if(!key) return null;

  // 1. 完全一致
  if(DB.foodKnowledge[key]) return DB.foodKnowledge[key];

  // 2. 部分一致（蓄積DB内を検索）
  var bestMatch=null, bestScore=0;
  Object.keys(DB.foodKnowledge).forEach(function(k){
    var entry=DB.foodKnowledge[k];
    var score=0;
    if(k.includes(key)||key.includes(k)){
      score=Math.min(k.length,key.length)/Math.max(k.length,key.length)*100;
    }
    if(score>60 && score>bestScore && entry.confidence>=30){
      bestScore=score;
      bestMatch=entry;
    }
  });
  return bestMatch;
}

function _enhanceAIResultWithKnowledge(aiFood){
  // AI解析結果を蓄積データで補正
  if(!aiFood||!aiFood.name) return aiFood;
  var known=_lookupFoodKnowledge(aiFood.name);
  if(!known||known.confidence<30) {
    // 蓄積データなし or 信頼度低い → AI結果をそのまま使い、学習に追加
    _addToFoodKnowledge(aiFood, 'ai');
    return aiFood;
  }

  // 蓄積データあり → 信頼度に応じてブレンド
  var blend=known.confidence/100; // 0.3〜1.0
  var result={name:aiFood.name, amount:aiFood.amount||'1人前', source:'ai+knowledge'};
  ['kcal','protein','carb','fat','fiber','vitC','calcium','iron'].forEach(function(k){
    var aiVal=aiFood[k]||0;
    var knownVal=known[k]||0;
    if(knownVal>0 && aiVal>0){
      result[k]=Math.round((aiVal*(1-blend)+knownVal*blend)*10)/10;
    } else {
      result[k]=aiVal||knownVal;
    }
  });
  result._confidence=known.confidence;
  result._samples=known.samples;

  // AI結果も学習に追加
  _addToFoodKnowledge(aiFood, 'ai');
  return result;
}

function openFoodCorrectionModal(mealId){
  var meal=DB.meals.today.find(function(m){return m.id===mealId;});
  if(!meal){toast('食事が見つかりません','e');return;}
  var known=_getFoodKnowledge(meal.name);
  var conf=known?known.confidence:0;
  var samples=known?known.samples:0;
  openM('栄養データを補正',
    '<div style="margin-bottom:14px;font-size:13px;color:var(--txt2);line-height:1.7">'+
    '<b>'+sanitize(meal.name,30)+'</b> の栄養データを補正します。<br>'+
    '補正データはチーム全体のAI学習に反映され、今後の精度が向上します。'+
    (conf>0?'<div style="margin-top:6px;font-size:11px;color:var(--txt3)">現在の信頼度: <b style="color:'+(conf>=70?'var(--teal)':conf>=40?'var(--org)':'var(--red)')+'">'+conf+'%</b> ('+samples+'件のデータ)</div>':'')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<div class="form-group"><label class="label">カロリー (kcal)</label><input class="input" id="fc-kcal" type="number" value="'+(meal.kcal||0)+'"></div>'+
    '<div class="form-group"><label class="label">タンパク質 (g)</label><input class="input" id="fc-protein" type="number" step="0.1" value="'+(meal.protein||0)+'"></div>'+
    '<div class="form-group"><label class="label">炭水化物 (g)</label><input class="input" id="fc-carb" type="number" step="0.1" value="'+(meal.carb||0)+'"></div>'+
    '<div class="form-group"><label class="label">脂質 (g)</label><input class="input" id="fc-fat" type="number" step="0.1" value="'+(meal.fat||0)+'"></div>'+
    '<div class="form-group"><label class="label">食物繊維 (g)</label><input class="input" id="fc-fiber" type="number" step="0.1" value="'+(meal.fiber||0)+'"></div>'+
    '<div class="form-group"><label class="label">ビタミンC (mg)</label><input class="input" id="fc-vitc" type="number" step="0.1" value="'+(meal.vitC||0)+'"></div>'+
    '</div>'+
    '<button class="btn btn-primary w-full" onclick="applyFoodCorrection(\''+mealId+'\')">補正を保存してAIを学習させる</button>'
  );
}

function applyFoodCorrection(mealId){
  var meal=DB.meals.today.find(function(m){return m.id===mealId;});
  if(!meal){toast('食事が見つかりません','e');closeM();return;}
  var corrected={
    kcal:parseInt(document.getElementById('fc-kcal')?.value)||0,
    protein:parseFloat(document.getElementById('fc-protein')?.value)||0,
    carb:parseFloat(document.getElementById('fc-carb')?.value)||0,
    fat:parseFloat(document.getElementById('fc-fat')?.value)||0,
    fiber:parseFloat(document.getElementById('fc-fiber')?.value)||0,
    vitC:parseFloat(document.getElementById('fc-vitc')?.value)||0
  };
  // 1. 食事レコードを更新
  meal.kcal=corrected.kcal; meal.protein=corrected.protein;
  meal.carb=corrected.carb; meal.fat=corrected.fat;
  meal.fiber=corrected.fiber; meal.vitC=corrected.vitC;
  // 2. チーム共有学習DBに補正データを反映
  _correctFoodKnowledge(meal.name, corrected);
  // 3. myFoodsも更新
  var myF=(DB.myFoods||[]).find(function(f){return f.name===meal.name;});
  if(myF){
    myF.kcal=corrected.kcal; myF.protein=corrected.protein;
    myF.carb=corrected.carb; myF.fat=corrected.fat;
  }
  saveDB();
  closeM();
  toast('補正を保存しました（AI学習に反映済み）','s');
  goTo('nutrition');
}

function _foodConfidenceBadge(name){
  var known=_getFoodKnowledge(name);
  if(!known) return '';
  var c=known.confidence;
  var color=c>=70?'var(--teal)':c>=40?'var(--org)':'var(--txt3)';
  var label=c>=70?'高精度':c>=40?'学習中':'推定';
  return '<span style="font-size:8px;padding:1px 5px;border-radius:4px;background:'+color+'18;color:'+color+';font-weight:600;margin-left:4px" title="信頼度'+c+'% ('+known.samples+'件)">'+label+'</span>';
}

// 日付変更時に前日の食事をアーカイブ
function archiveMealsIfNewDay() {
  if (!DB.mealHistory) DB.mealHistory = {};
  var today = new Date().toISOString().slice(0, 10);
  var lastKey = Object.keys(DB.mealHistory).sort().pop();
  if (DB.meals.today && DB.meals.today.length > 0) {
    // 既存の今日の記録で、まだアーカイブされてないものを保存
    var existing = DB.mealHistory[today] || [];
    var existingNames = existing.map(function(m) { return m.name + m.time; });
    for (var i = 0; i < DB.meals.today.length; i++) {
      var m = DB.meals.today[i];
      var key = m.name + (m.time || '');
      if (existingNames.indexOf(key) < 0) {
        if (!DB.mealHistory[today]) DB.mealHistory[today] = [];
        DB.mealHistory[today].push({
          name: m.name, kcal: m.kcal || 0, protein: m.protein || 0,
          carb: m.carb || 0, fat: m.fat || 0, type: m.type || 'lunch',
          time: m.time || '', date: today
        });
      }
    }
  }
  _syncPlayerMealsToShared();
}

// 選手の食事データを共有フィールドに同期（チーム管理者が閲覧可能にする）
function _syncPlayerMealsToShared(){
  var u=DB.currentUser;
  if(!u||u.role!=='player') return;
  var pid=u.id;
  if(!pid) return;
  if(!DB.playerMealHistory) DB.playerMealHistory={};
  if(!DB.playerMealHistory[pid]) DB.playerMealHistory[pid]={};
  // 今日の食事を同期
  var today=new Date().toISOString().slice(0,10);
  var todayMeals=(DB.meals&&DB.meals.today)||[];
  if(todayMeals.length>0){
    DB.playerMealHistory[pid][today]=todayMeals.map(function(m){
      return{name:m.name,kcal:m.kcal||0,protein:m.protein||0,carb:m.carb||0,fat:m.fat||0,type:m.type||'',time:m.time||''};
    });
  }
  // mealHistoryもマージ
  var hist=DB.mealHistory||{};
  Object.keys(hist).forEach(function(dk){
    if(!DB.playerMealHistory[pid][dk] && hist[dk] && hist[dk].length>0){
      DB.playerMealHistory[pid][dk]=hist[dk];
    }
  });
}

// よく食べるものTOP N（頻度順）
function getFrequentFoods(n) {
  if (!DB.myFoods || !DB.myFoods.length) return [];
  var sorted = DB.myFoods.slice().sort(function(a, b) { return (b.count || 0) - (a.count || 0); });
  return sorted.slice(0, n || 8);
}

// 時間帯に合ったレコメンド
function getTimeBasedRecommendations(mealType, n) {
  if (!DB.myFoods || !DB.myFoods.length) return [];
  var hour = new Date().getHours();
  var slot = hour < 10 ? 'morning' : hour < 14 ? 'lunch' : hour < 18 ? 'afternoon' : 'dinner';

  var scored = DB.myFoods.map(function(f) {
    var timeScore = (f.timeSlots && f.timeSlots[slot]) || 0;
    var typeScore = (f.mealTypes && f.mealTypes[mealType]) || 0;
    var recencyDays = f.lastUsed ? Math.max(0, (Date.now() - new Date(f.lastUsed).getTime()) / 86400000) : 30;
    var recencyBonus = Math.max(0, 10 - recencyDays);
    return { food: f, score: timeScore * 3 + typeScore * 2 + (f.count || 0) + recencyBonus };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.slice(0, n || 6).filter(function(s) { return s.score > 0; }).map(function(s) { return s.food; });
}

// 栄養パターン分析（過去7日の傾向）
function analyzeNutritionPattern() {
  if (!DB.mealHistory) return {patterns:[],insights:[],totalDays:0,weeklyAvg:null};
  var player = DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  var weight = (player && player.weight) || 65;
  var goal = {kcal:weight*40, protein:weight*2, carb:weight*5, fat:weight*1};
  var days = Object.keys(DB.mealHistory).sort().slice(-14);
  var patterns = [], defNut = {};
  var totalP=0, totalK=0, totalF=0, totalC=0, recDays=0;
  var skipBf=0, lateDinner=0, lowMealDays=0;

  for (var d = 0; d < days.length; d++) {
    var meals = DB.mealHistory[days[d]] || [];
    if (!meals.length) continue;
    recDays++;
    var dt = {kcal:0,protein:0,carb:0,fat:0,mealCount:meals.length,hasBf:false,lateDin:false};
    for (var m = 0; m < meals.length; m++) {
      dt.kcal += meals[m].kcal||0; dt.protein += meals[m].protein||0;
      dt.carb += meals[m].carb||0; dt.fat += meals[m].fat||0;
      if (meals[m].type==='breakfast') dt.hasBf = true;
      var mTime = parseInt(meals[m].time)||12;
      if (meals[m].type==='dinner' && mTime >= 21) dt.lateDin = true;
    }
    totalP += dt.protein; totalK += dt.kcal; totalF += dt.fat; totalC += dt.carb;
    if (dt.protein < goal.protein*0.7) defNut['タンパク質'] = (defNut['タンパク質']||0)+1;
    if (dt.carb < goal.carb*0.7) defNut['炭水化物'] = (defNut['炭水化物']||0)+1;
    if (dt.kcal < goal.kcal*0.7) defNut['カロリー'] = (defNut['カロリー']||0)+1;
    if (dt.fat > goal.fat*1.3) defNut['脂質過多'] = (defNut['脂質過多']||0)+1;
    if (!dt.hasBf) skipBf++;
    if (dt.lateDin) lateDinner++;
    if (dt.mealCount < 3) lowMealDays++;
    patterns.push({date:days[d], totals:dt, meals:dt.mealCount});
  }

  var insights = [];
  // 栄養素の傾向
  for (var nut in defNut) {
    if (defNut[nut] >= Math.ceil(recDays * 0.4)) {
      if (nut === '脂質過多') insights.push({icon:'⚖️', msg:'脂質が過剰な日が'+defNut[nut]+'日。揚げ物を週2回以下に抑えると改善', type:'warn'});
      else insights.push({icon:'📉', msg:nut+'が'+defNut[nut]+'日間不足。慢性的な不足は疲労回復の遅れにつながります', type:'warn'});
    }
  }
  // 食事パターン
  if (skipBf >= Math.ceil(recDays * 0.4)) {
    insights.push({icon:'🌅', msg:'朝食スキップが'+skipBf+'日。アスリートは朝食で1日の代謝スイッチをONに', type:'warn'});
  }
  if (lateDinner >= 3) {
    insights.push({icon:'🌙', msg:'遅い夕食（21時以降）が'+lateDinner+'日。睡眠の質と翌日のコンディションに影響', type:'info'});
  }
  if (lowMealDays >= Math.ceil(recDays * 0.3)) {
    insights.push({icon:'🍽️', msg:'1日2食以下の日が'+lowMealDays+'日。3食+補食で栄養を分散摂取が理想', type:'info'});
  }
  // 週間平均
  var weeklyAvg = recDays > 0 ? {
    kcal: Math.round(totalK/recDays),
    protein: Math.round(totalP/recDays),
    fat: Math.round(totalF/recDays),
    carb: Math.round(totalC/recDays),
    days: recDays
  } : null;

  if (weeklyAvg) {
    var kcalPct = Math.round(weeklyAvg.kcal / goal.kcal * 100);
    var pPct = Math.round(weeklyAvg.protein / goal.protein * 100);
    if (kcalPct >= 85 && pPct >= 85) {
      insights.unshift({icon:'🏆', msg:'直近'+recDays+'日の平均摂取は良好（カロリー'+kcalPct+'% / P'+pPct+'%）！', type:'good'});
    }
  }

  return {patterns:patterns, insights:insights, totalDays:days.length, weeklyAvg:weeklyAvg};
}


// myFoodsの学習データをエクスポート（デバッグ用）
function getLearningSummary() {
  var freq = getFrequentFoods(5);
  var pattern = analyzeNutritionPattern();
  return { topFoods: freq.map(function(f) { return f.name + '(' + f.count + '回)'; }), pattern: pattern };
}

// 曜日別パターン分析
function analyzeWeekdayPattern() {
  if (!DB.mealHistory) return {};
  var dayStats = {};
  var keys = Object.keys(DB.mealHistory);
  for (var i = 0; i < keys.length; i++) {
    var dayOfWeek = new Date(keys[i] + 'T12:00').getDay();
    var meals = DB.mealHistory[keys[i]] || [];
    if (!dayStats[dayOfWeek]) dayStats[dayOfWeek] = { kcal: [], protein: [], count: 0 };
    var dayK = 0, dayP = 0;
    for (var m = 0; m < meals.length; m++) { dayK += meals[m].kcal || 0; dayP += meals[m].protein || 0; }
    dayStats[dayOfWeek].kcal.push(dayK);
    dayStats[dayOfWeek].protein.push(dayP);
    dayStats[dayOfWeek].count++;
  }
  // 平均を計算
  for (var d in dayStats) {
    var s = dayStats[d];
    s.avgKcal = s.kcal.length ? Math.round(s.kcal.reduce(function(a,b){return a+b;},0) / s.kcal.length) : 0;
    s.avgProtein = s.protein.length ? Math.round(s.protein.reduce(function(a,b){return a+b;},0) / s.protein.length * 10) / 10 : 0;
  }
  return dayStats;
}

// よく一緒に食べるもの（コンボ検出）
function detectMealCombos() {
  if (!DB.mealHistory) return [];
  var comboCounts = {};
  var keys = Object.keys(DB.mealHistory);
  for (var i = 0; i < keys.length; i++) {
    var meals = DB.mealHistory[keys[i]] || [];
    // 食事タイプ別にグループ化
    var byType = {};
    for (var m = 0; m < meals.length; m++) {
      var t = meals[m].type || 'other';
      if (!byType[t]) byType[t] = [];
      byType[t].push(meals[m].name);
    }
    // 各タイプ内の組み合わせを記録（2品以上）
    for (var t in byType) {
      var items = byType[t].sort();
      if (items.length >= 2 && items.length <= 4) {
        var key = items.join('|');
        if (!comboCounts[key]) comboCounts[key] = { items: items, count: 0, totalKcal: 0 };
        comboCounts[key].count++;
        var k = 0;
        for (var mi = 0; mi < meals.length; mi++) {
          if (items.indexOf(meals[mi].name) >= 0) k += meals[mi].kcal || 0;
        }
        comboCounts[key].totalKcal = Math.round(k / comboCounts[key].count);
      }
    }
  }
  var combos = [];
  for (var ck in comboCounts) {
    if (comboCounts[ck].count >= 2) combos.push(comboCounts[ck]);
  }
  combos.sort(function(a,b) { return b.count - a.count; });
  return combos.slice(0, 5);
}

// コンボを一括追加
function addMealCombo(comboStr) {
  var items = comboStr.split('|');
  var type = document.getElementById('meal-type') ? document.getElementById('meal-type').value : 'lunch';
  var now = new Date();
  var time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  var added = 0;
  for (var i = 0; i < items.length; i++) {
    var f = null;
    // FOOD_DBから検索
    for (var j = 0; j < FOOD_DB.length; j++) {
      if (FOOD_DB[j].name === items[i]) { f = FOOD_DB[j]; break; }
    }
    // myFoodsから検索
    if (!f && DB.myFoods) {
      for (var k = 0; k < DB.myFoods.length; k++) {
        if (DB.myFoods[k].name === items[i]) { f = DB.myFoods[k]; break; }
      }
    }
    if (f) {
      DB.meals.today.push({
        id: 'm' + Date.now() + '_' + i, name: f.name,
        kcal: f.kcal||0, protein: f.protein||0, carb: f.carb||0, fat: f.fat||0,
        fiber: f.fiber||0, vitB1: f.vitB1||0, vitC: f.vitC||0, calcium: f.calcium||0, iron: f.iron||0,
        time: time, type: type, source: 'combo'
      });
      learnFromMeal(f, type);
      added++;
    }
  }
  if (added) { saveDB(); toast('🔗 '+added+'品目をセット追加！','s'); goTo('nutrition'); }
}

// 不足栄養素に基づくおすすめ食品
function getDeficiencyRecommendations() {
  var todayTotals = getTodayTotals();
  var player = DB.players.find(function(x) { return x.id === (DB.currentUser||{}).id; });
  var w = (player && player.weight) || 65;
  var goals = { protein: w*2, carb: w*5, fat: w*1, calcium: 800, iron: 10, vitC: 100 };
  var deficiencies = [];
  if (todayTotals.protein < goals.protein * 0.5) deficiencies.push({nut:'protein', label:'タンパク質'});
  if (todayTotals.carb < goals.carb * 0.5) deficiencies.push({nut:'carb', label:'炭水化物'});
  if ((todayTotals.calcium||0) < goals.calcium * 0.5) deficiencies.push({nut:'calcium', label:'Ca'});
  if ((todayTotals.iron||0) < goals.iron * 0.5) deficiencies.push({nut:'iron', label:'鉄'});
  if ((todayTotals.vitC||0) < goals.vitC * 0.5) deficiencies.push({nut:'vitC', label:'VitC'});

  var recs = [];
  for (var di = 0; di < deficiencies.length && recs.length < 4; di++) {
    var nut = deficiencies[di].nut;
    var best = null, bestVal = 0;
    for (var fi = 0; fi < FOOD_DB.length; fi++) {
      var val = FOOD_DB[fi][nut] || 0;
      // 既に今日食べたものは除外
      var alreadyEaten = DB.meals.today.some(function(m) { return m.name === FOOD_DB[fi].name; });
      if (!alreadyEaten && val > bestVal) { bestVal = val; best = FOOD_DB[fi]; }
    }
    if (best) recs.push({ food: best, reason: deficiencies[di].label + '↑' });
  }
  return recs;
}

// 今日の合計を取得するヘルパー
function getTodayTotals() {
  var t = { kcal:0, protein:0, carb:0, fat:0, fiber:0, vitB1:0, vitC:0, calcium:0, iron:0 };
  if (!DB.meals || !DB.meals.today) return t;
  for (var i=0; i<DB.meals.today.length; i++) {
    var m = DB.meals.today[i];
    t.kcal += m.kcal||0; t.protein += m.protein||0; t.carb += m.carb||0; t.fat += m.fat||0;
    t.fiber += m.fiber||0; t.vitB1 += m.vitB1||0; t.vitC += m.vitC||0; t.calcium += m.calcium||0; t.iron += m.iron||0;
  }
  // 浮動小数点を丸める
  t.kcal=Math.round(t.kcal); t.protein=Math.round(t.protein*10)/10; t.carb=Math.round(t.carb*10)/10;
  t.fat=Math.round(t.fat*10)/10; t.fiber=Math.round(t.fiber*10)/10; t.vitB1=Math.round(t.vitB1*100)/100;
  t.vitC=Math.round(t.vitC); t.calcium=Math.round(t.calcium); t.iron=Math.round(t.iron*10)/10;
  return t;
}

// 🧠 AI学習ダッシュボード（モーダル）
function openAILearningDashboard() {
  var myFoods = DB.myFoods || [];
  var history = DB.mealHistory || {};
  var histDays = Object.keys(history).length;
  var totalMeals = 0;
  for (var k in history) totalMeals += (history[k]||[]).length;
  var freq = getFrequentFoods(10);
  var pattern = analyzeNutritionPattern();
  var weekday = analyzeWeekdayPattern();
  var combos = detectMealCombos();
  var dayNames = ['日','月','火','水','木','金','土'];

  var h = '<div style="display:grid;gap:14px">';

  // 学習サマリー
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
  h += '<div style="padding:12px;background:var(--surf2);border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--org)">'+myFoods.length+'</div><div style="font-size:10px;color:var(--txt3)">学習済み食品</div></div>';
  h += '<div style="padding:12px;background:var(--surf2);border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--teal)">'+histDays+'</div><div style="font-size:10px;color:var(--txt3)">記録日数</div></div>';
  h += '<div style="padding:12px;background:var(--surf2);border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--blue)">'+totalMeals+'</div><div style="font-size:10px;color:var(--txt3)">累計食事数</div></div>';
  h += '</div>';

  // マイ食品ランキングTOP10
  if (freq.length) {
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">🏆 マイ食品ランキング</div>';
    for (var fi=0; fi<freq.length; fi++) {
      var f = freq[fi];
      var medal = fi===0?'🥇':fi===1?'🥈':fi===2?'🥉':'';
      var barW = Math.max(10, (f.count / (freq[0].count||1)) * 100);
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      h += '<span style="width:22px;font-size:11px;color:var(--txt3);text-align:right">'+(medal||(fi+1))+'</span>';
      h += '<div style="flex:1"><div style="font-size:11px;font-weight:600">'+f.name.split('（')[0]+'</div>';
      h += '<div style="height:4px;background:var(--b2);border-radius:2px;margin-top:2px"><div style="width:'+barW+'%;height:100%;background:linear-gradient(90deg,var(--org),var(--teal));border-radius:2px"></div></div></div>';
      h += '<span style="font-size:10px;color:var(--org);font-weight:700;min-width:30px;text-align:right">'+f.count+'回</span></div>';
    }
    h += '</div>';
  }

  // 曜日別カロリー平均
  if (Object.keys(weekday).length) {
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">📅 曜日別平均カロリー</div>';
    h += '<div style="display:flex;gap:4px;align-items:flex-end;height:60px">';
    var maxAvg = 0;
    for (var wd=0; wd<7; wd++) { if (weekday[wd] && weekday[wd].avgKcal > maxAvg) maxAvg = weekday[wd].avgKcal; }
    for (var wd2=0; wd2<7; wd2++) {
      var ws = weekday[wd2];
      var pct = ws ? Math.max(5, ws.avgKcal / (maxAvg||1) * 100) : 5;
      var today2 = new Date().getDay() === wd2;
      h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
      h += '<div style="font-size:8px;color:var(--txt3)">'+(ws?ws.avgKcal:'--')+'</div>';
      h += '<div style="width:100%;height:'+pct+'%;border-radius:3px;background:'+(today2?'var(--org)':'var(--teal)')+';opacity:'+(ws?.8:.2)+'"></div>';
      h += '<div style="font-size:9px;color:'+(today2?'var(--org)':'var(--txt3)')+';font-weight:'+(today2?'700':'400')+'">'+dayNames[wd2]+'</div></div>';
    }
    h += '</div></div>';
  }

  // コンボパターン
  if (combos.length) {
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">🔗 よく食べる組み合わせ</div>';
    for (var ci=0; ci<combos.length; ci++) {
      var c = combos[ci];
      h += '<div style="padding:8px 10px;background:var(--surf2);border-radius:8px;margin-bottom:4px;font-size:11px">';
      h += '<span style="color:var(--org);font-weight:700">'+c.count+'回</span> · '+c.items.map(function(n){return n.split('（')[0];}).join(' + ');
      h += ' <span style="color:var(--txt3)">('+c.totalKcal+'kcal)</span></div>';
    }
    h += '</div>';
  }

  // 栄養トレンドinsights
  if (pattern.insights.length) {
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">⚠️ 栄養傾向の気づき</div>';
    pattern.insights.forEach(function(msg) {
      h += '<div style="padding:8px 10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.12);border-radius:8px;font-size:11px;color:var(--red);margin-bottom:4px">'+msg+'</div>';
    });
    h += '</div>';
  }


  // 🔥 栄養バランスストリーク
  var nStreak = getNutritionStreak();
  if (nStreak > 0) {
    h += '<div style="text-align:center;padding:14px;background:linear-gradient(135deg,rgba(249,115,22,.08),rgba(0,207,170,.08));border-radius:14px;margin-bottom:8px">';
    h += '<div style="font-size:32px">🔥</div>';
    h += '<div style="font-size:24px;font-weight:800;color:var(--org)">'+nStreak+'日連続</div>';
    h += '<div style="font-size:11px;color:var(--txt3)">栄養バランススコア60+維持中</div></div>';
  }

  // 🏅 アチーブメント
  var achv = getLearningAchievements();
  h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">🏅 アチーブメント</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
  for (var achi = 0; achi < achv.length; achi++) {
    var ac = achv[achi];
    h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;border:1px solid '+(ac.earned?'var(--org)':'var(--b1)')+';opacity:'+(ac.earned?1:.6)+'">';
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-size:18px'+(ac.earned?'':';filter:grayscale(1)')+'">'+ac.icon+'</span>';
    h += '<span style="font-size:11px;font-weight:700;color:'+(ac.earned?'var(--org)':'var(--txt3)')+'">'+ac.title+'</span></div>';
    h += '<div style="font-size:9px;color:var(--txt3)">'+ac.desc+'</div>';
    if (!ac.earned && ac.progress) {
      var achParts = ac.progress.split('/');
      var achPct = Math.min(100, Math.round(parseInt(achParts[0]) / parseInt(achParts[1]) * 100));
      h += '<div style="height:3px;background:var(--b2);border-radius:2px;margin-top:4px"><div style="height:100%;width:'+achPct+'%;background:var(--org);border-radius:2px"></div></div>';
    }
    h += '</div>';
  }
  h += '</div></div>';
  // 目標自動最適化
  var goals = autoOptimizeGoals();
  if (goals) {
    var trendIcon = goals.trend==='gaining'?'📈':goals.trend==='losing'?'📉':'➡️';
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">'+trendIcon+' 目標自動最適化</div>';
    h += '<div style="padding:12px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.12);border-radius:10px">';
    h += '<div style="font-size:12px;font-weight:600;color:var(--blue);margin-bottom:4px">'+goals.goalMode+'モード ('+goals.weight+'kg)</div>';
    h += '<div style="font-size:11px;color:var(--txt2);margin-bottom:6px">'+goals.advice+'</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:10px;text-align:center">';
    h += '<div style="padding:6px;background:var(--surf);border-radius:6px"><div style="font-weight:700">'+goals.goalKcal+'</div><div style="color:var(--txt3)">kcal</div></div>';
    h += '<div style="padding:6px;background:var(--surf);border-radius:6px"><div style="font-weight:700;color:var(--teal)">'+goals.goalP+'g</div><div style="color:var(--txt3)">P</div></div>';
    h += '<div style="padding:6px;background:var(--surf);border-radius:6px"><div style="font-weight:700;color:var(--blue)">'+goals.goalC+'g</div><div style="color:var(--txt3)">C</div></div>';
    h += '<div style="padding:6px;background:var(--surf);border-radius:6px"><div style="font-weight:700;color:#eab308">'+goals.goalF+'g</div><div style="color:var(--txt3)">F</div></div>';
    h += '</div>';
    if (goals.avgKcal) {
      h += '<div style="margin-top:6px;font-size:10px;color:var(--txt3)">実績平均: '+goals.avgKcal+'kcal / P'+goals.avgP+'g（'+goals.prevDate+' ~ '+goals.latestDate+'）</div>';
    }
    h += '</div></div>';
  }

  // 日別スコア推移（過去14日）
  var scoreHistory = Object.keys(history).sort().slice(-14);
  if (scoreHistory.length >= 3) {
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">📈 日別栄養スコア推移</div>';
    h += '<div style="display:flex;gap:2px;align-items:flex-end;height:50px">';
    for (var si = 0; si < scoreHistory.length; si++) {
      var sDate = scoreHistory[si];
      var sScore = calcDailyNutritionScore(sDate);
      var sH = Math.max(8, sScore);
      var sColor = sScore>=80?'var(--teal)':sScore>=60?'var(--org)':sScore>=40?'#eab308':'var(--red)';
      var sDay = dayNames[new Date(sDate+'T12:00').getDay()];
      h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px">';
      h += '<div style="font-size:7px;font-weight:700;color:'+sColor+'">'+sScore+'</div>';
      h += '<div style="width:100%;height:'+sH+'%;border-radius:3px 3px 1px 1px;background:'+sColor+';opacity:.8"></div>';
      h += '<div style="font-size:7px;color:var(--txt3)">'+sDay+'</div></div>';
    }
    h += '</div></div>';
  }

  // 週間レポートボタン
  h += '<div style="text-align:center;margin-bottom:8px"><button class="btn btn-primary btn-sm" onclick="closeM();openWeeklyReportModal()">📊 週間AIレポートを見る</button></div>';

  // 学習データリセット
  h += '<div style="text-align:center;padding-top:10px;border-top:1px solid var(--b1)">';
  h += '<button class="btn btn-ghost btn-sm" style="color:var(--red);font-size:10px" onclick="if(confirm(\'学習データをリセットしますか？\')){DB.myFoods=[];DB.mealHistory={};saveDB();closeM();toast(\'学習データをリセットしました\',\'s\');goTo(\'nutrition\')}">🗑️ 学習データリセット</button>';
  h += '</div>';

  h += '</div>';
  openM('🧠 AI学習ダッシュボード', h, true);
}

// ==================== 🧠 Advanced AI Learning ====================

// 1. 目標自動最適化 — 体重変動に連動
function autoOptimizeGoals() {
  var player = DB.players.find(function(x) { return x.id === (DB.currentUser||{}).id; });
  if (!player) return null;
  var pid = player.id;
  var bLog = DB.bodyLog[pid] || {};
  var entries = Object.values(bLog).filter(function(e){return e && e.weight;}).sort(function(a,b){return a.date>b.date?1:-1;});
  if (entries.length < 2) return null;

  var latest = entries[entries.length - 1];
  var prev = entries.length >= 7 ? entries[entries.length - 7] : entries[0];
  var weightChange = latest.weight - prev.weight;
  var trend = weightChange > 0.5 ? 'gaining' : weightChange < -0.5 ? 'losing' : 'stable';
  var w = latest.weight;

  // 現在の摂取パターン分析
  var history = DB.mealHistory || {};
  var last7 = Object.keys(history).sort().slice(-7);
  var avgKcal = 0, avgP = 0;
  if (last7.length) {
    var totK = 0, totP = 0;
    for (var i = 0; i < last7.length; i++) {
      var meals = history[last7[i]] || [];
      for (var m = 0; m < meals.length; m++) { totK += meals[m].kcal||0; totP += meals[m].protein||0; }
    }
    avgKcal = Math.round(totK / last7.length);
    avgP = Math.round(totP / last7.length * 10) / 10;
  }

  // 目標を自動調整
  var goalKcal, goalMode, advice;
  if (trend === 'losing' && weightChange < -1) {
    goalKcal = Math.round(w * 42); goalMode = '体重維持↑';
    advice = '体重が' + Math.abs(weightChange).toFixed(1) + 'kg減少傾向です。カロリー摂取を少し増やしましょう。';
  } else if (trend === 'gaining' && weightChange > 1) {
    goalKcal = Math.round(w * 38); goalMode = '体重管理';
    advice = '体重が' + weightChange.toFixed(1) + 'kg増加傾向です。脂質を控えめにしましょう。';
  } else {
    goalKcal = Math.round(w * 40); goalMode = '現状維持';
    advice = '体重は安定しています。このバランスを維持しましょう。';
  }

  return {
    weight: w, weightChange: weightChange, trend: trend, goalMode: goalMode,
    goalKcal: goalKcal, goalP: Math.round(w * 2), goalC: Math.round(w * 5), goalF: Math.round(w * 1),
    avgKcal: avgKcal, avgP: avgP, advice: advice,
    latestDate: latest.date, prevDate: prev.date
  };
}

// 2. 週間AIレポート生成
function generateWeeklyReport() {
  var history = DB.mealHistory || {};
  var days = Object.keys(history).sort().slice(-7);
  if (days.length < 3) return null;

  var player = DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  var w = (player && player.weight) || 65;
  var goalK = w * 40, goalP = w * 2;

  var dailyData = [];
  var totalK = 0, totalP = 0, totalC = 0, totalF = 0;
  var proteinDays = 0, kcalOkDays = 0;

  for (var d = 0; d < days.length; d++) {
    var meals = history[days[d]] || [];
    var dk = 0, dp = 0, dc = 0, df = 0;
    for (var m = 0; m < meals.length; m++) { dk+=meals[m].kcal||0; dp+=meals[m].protein||0; dc+=meals[m].carb||0; df+=meals[m].fat||0; }
    dailyData.push({date:days[d], kcal:dk, protein:dp, carb:dc, fat:df, meals:meals.length});
    totalK+=dk; totalP+=dp; totalC+=dc; totalF+=df;
    if (dp >= goalP * 0.8) proteinDays++;
    if (dk >= goalK * 0.8 && dk <= goalK * 1.2) kcalOkDays++;
  }

  var avgK = Math.round(totalK/days.length);
  var avgP = Math.round(totalP/days.length*10)/10;
  var avgC = Math.round(totalC/days.length*10)/10;
  var avgF = Math.round(totalF/days.length*10)/10;

  // スコア算出
  var score = 50;
  score += Math.min(20, kcalOkDays * 3); // kcal達成日
  score += Math.min(20, proteinDays * 3); // P達成日
  if (days.length >= 7) score += 10; // 毎日記録ボーナス
  score = Math.min(100, score);

  // AIアドバイス生成
  var advices = [];
  if (avgP < goalP * 0.8) advices.push('タンパク質が目標の' + Math.round(avgP/goalP*100) + '%です。鶏むね肉やプロテインで補強を。');
  if (avgK > goalK * 1.2) advices.push('カロリーが目標を' + Math.round((avgK-goalK)/goalK*100) + '%超えています。脂質の多い食品を見直しましょう。');
  if (avgK < goalK * 0.7) advices.push('カロリーが大幅に不足しています。間食やプロテインで補いましょう。');
  if (proteinDays < days.length * 0.5) advices.push('タンパク質目標の達成率が低いです。毎食にP源を1品追加を。');
  if (kcalOkDays >= days.length * 0.7) advices.push('👏 カロリーコントロールが上手くいっています！');
  if (!advices.length) advices.push('バランスの取れた食事ができています。この調子で続けましょう！');

  // 改善ポイント
  var bestDay = dailyData.reduce(function(best,d){
    var diff = Math.abs(d.kcal - goalK) + Math.abs(d.protein - goalP) * 10;
    return (!best || diff < best.diff) ? {date:d.date,diff:diff} : best;
  }, null);

  return {
    days: dailyData, period: days[0] + ' ~ ' + days[days.length-1],
    avgKcal: avgK, avgProtein: avgP, avgCarb: avgC, avgFat: avgF,
    score: score, proteinDays: proteinDays, kcalOkDays: kcalOkDays,
    totalDays: days.length, advices: advices, bestDay: bestDay,
    goalKcal: Math.round(goalK), goalProtein: Math.round(goalP)
  };
}

// 3. 食事スコア履歴 (日別スコアをbodyLog的に保存)
function calcDailyNutritionScore(dateStr) {
  var meals = (DB.mealHistory||{})[dateStr] || [];
  if (!meals.length) return 0;
  var player = DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  var w = (player && player.weight) || 65;
  var tot = {kcal:0,protein:0,carb:0,fat:0};
  for (var i=0;i<meals.length;i++){tot.kcal+=meals[i].kcal||0;tot.protein+=meals[i].protein||0;tot.carb+=meals[i].carb||0;tot.fat+=meals[i].fat||0;}
  var goalK=w*40,goalP=w*2,goalC=w*5,goalF=w*1;
  var score = 0;
  var kR = goalK?tot.kcal/goalK:0; if(kR>=0.8&&kR<=1.2)score+=25; else if(kR>=0.6&&kR<=1.4)score+=15; else score+=5;
  var pR = goalP?tot.protein/goalP:0; if(pR>=0.8)score+=25; else if(pR>=0.5)score+=15; else score+=5;
  var cR = goalC?tot.carb/goalC:0; if(cR>=0.7&&cR<=1.3)score+=25; else if(cR>=0.5)score+=15; else score+=5;
  var fR = goalF?tot.fat/goalF:0; if(fR>=0.7&&fR<=1.3)score+=25; else if(fR>=0.5)score+=15; else score+=5;
  return Math.min(100, score);
}

// 4. スマートリマインダーチェック
function checkMealReminder() {
  var hour = new Date().getHours();
  var todayMeals = DB.meals.today || [];
  var hasMorning = todayMeals.some(function(m){return m.type==='breakfast';});
  var hasLunch = todayMeals.some(function(m){return m.type==='lunch';});
  var hasDinner = todayMeals.some(function(m){return m.type==='dinner';});

  // パターンから通常の食事時間を学習
  var myFoods = DB.myFoods || [];
  var usualSlots = {};
  for (var i=0; i<myFoods.length; i++) {
    var ts = myFoods[i].timeSlots || {};
    for (var slot in ts) usualSlots[slot] = (usualSlots[slot]||0) + ts[slot];
  }

  var reminders = [];
  if (hour >= 10 && hour < 12 && !hasMorning && usualSlots.morning > 3) {
    reminders.push({type:'breakfast', msg:'朝食がまだ記録されていません', icon:'🌅'});
  }
  if (hour >= 14 && hour < 16 && !hasLunch) {
    reminders.push({type:'lunch', msg:'昼食がまだ記録されていません', icon:'☀️'});
  }
  if (hour >= 20 && !hasDinner) {
    reminders.push({type:'dinner', msg:'夕食がまだ記録されていません', icon:'🌙'});
  }

  // 水分チェック
  var water = DB.meals.water || 0;
  if (hour >= 14 && water < 3) {
    reminders.push({type:'water', msg:'水分補給を忘れずに（現在'+water+'/8杯）', icon:'💧'});
  }

  return reminders;
}

// 5. 週間レポートモーダル
function openWeeklyReportModal() {
  var report = generateWeeklyReport();
  if (!report) {
    openM('📊 週間レポート', '<div style="text-align:center;padding:40px"><div style="font-size:40px;margin-bottom:12px">📊</div><div style="font-size:14px;font-weight:700;margin-bottom:6px">データが不足しています</div><div style="font-size:12px;color:var(--txt3)">3日以上の食事記録が必要です</div></div>');
    return;
  }
  var goals = autoOptimizeGoals();

  var scoreEmoji = report.score >= 80 ? '🎉' : report.score >= 60 ? '👍' : report.score >= 40 ? '💪' : '📝';
  var scoreColor = report.score >= 80 ? 'var(--teal)' : report.score >= 60 ? 'var(--org)' : report.score >= 40 ? '#eab308' : 'var(--red)';

  var h = '<div style="display:grid;gap:14px">';

  // 総合スコア
  h += '<div style="text-align:center;padding:20px;background:linear-gradient(135deg,rgba(249,115,22,.08),rgba(0,207,170,.08));border-radius:16px">';
  h += '<div style="font-size:40px;margin-bottom:4px">'+scoreEmoji+'</div>';
  h += '<div style="font-size:48px;font-weight:800;color:'+scoreColor+'">'+report.score+'<span style="font-size:16px;color:var(--txt3)">/100</span></div>';
  h += '<div style="font-size:13px;color:var(--txt3)">週間栄養スコア（'+report.period+'）</div></div>';

  // KPI
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
  h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:18px;font-weight:800">'+report.avgKcal+'</div><div style="font-size:9px;color:var(--txt3)">平均kcal</div></div>';
  h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">'+report.avgProtein+'g</div><div style="font-size:9px;color:var(--txt3)">平均P</div></div>';
  h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--org)">'+report.kcalOkDays+'/'+report.totalDays+'</div><div style="font-size:9px;color:var(--txt3)">kcal達成日</div></div>';
  h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--blue)">'+report.proteinDays+'/'+report.totalDays+'</div><div style="font-size:9px;color:var(--txt3)">P達成日</div></div>';
  h += '</div>';

  // 日別スコアグラフ
  h += '<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">📈 日別栄養スコア推移</div>';
  h += '<div style="display:flex;gap:4px;align-items:flex-end;height:60px">';
  var dayNames = ['日','月','火','水','木','金','土'];
  for (var di = 0; di < report.days.length; di++) {
    var dd = report.days[di];
    var dScore = calcDailyNutritionScore(dd.date);
    var barH = Math.max(8, dScore);
    var dColor = dScore>=80?'var(--teal)':dScore>=60?'var(--org)':dScore>=40?'#eab308':'var(--red)';
    var dl = dayNames[new Date(dd.date+'T12:00').getDay()];
    h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
    h += '<div style="font-size:8px;font-weight:700;color:'+dColor+'">'+dScore+'</div>';
    h += '<div style="width:100%;height:'+barH+'%;border-radius:4px 4px 1px 1px;background:'+dColor+';opacity:.85"></div>';
    h += '<div style="font-size:8px;color:var(--txt3)">'+dl+'</div></div>';
  }
  h += '</div></div>';

  // 目標自動最適化
  if (goals) {
    var trendIcon = goals.trend==='gaining'?'📈':goals.trend==='losing'?'📉':'➡️';
    h += '<div style="padding:12px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.12);border-radius:12px">';
    h += '<div style="font-size:12px;font-weight:700;margin-bottom:6px">'+trendIcon+' 目標自動調整（'+goals.goalMode+'）</div>';
    h += '<div style="font-size:11px;color:var(--txt2);margin-bottom:6px">'+goals.advice+'</div>';
    h += '<div style="display:flex;gap:8px;font-size:10px;color:var(--txt3)">';
    h += '<span>目標: '+goals.goalKcal+'kcal</span><span>P'+goals.goalP+'g</span><span>C'+goals.goalC+'g</span><span>F'+goals.goalF+'g</span>';
    h += '</div></div>';
  }

  // AIアドバイス
  h += '<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">🤖 AIアドバイス</div>';
  for (var ai = 0; ai < report.advices.length; ai++) {
    var isPositive = report.advices[ai].indexOf('👏') >= 0 || report.advices[ai].indexOf('上手') >= 0;
    h += '<div style="padding:8px 10px;background:'+(isPositive?'rgba(0,207,170,.06)':'rgba(249,115,22,.06)')+';border:1px solid '+(isPositive?'rgba(0,207,170,.12)':'rgba(249,115,22,.12)')+';border-radius:8px;font-size:11px;color:'+(isPositive?'var(--teal)':'var(--org)')+';margin-bottom:3px">'+report.advices[ai]+'</div>';
  }
  h += '</div>';

  h += '</div>';
  openM('📊 週間AIレポート', h, true);
}

// 6. ダッシュボード内リマインダー表示ウィジェット
function mealReminderWidget() {
  var reminders = checkMealReminder();
  if (!reminders.length) return '';
  var h = '<div style="margin-bottom:12px">';
  for (var i = 0; i < reminders.length; i++) {
    var r = reminders[i];
    var onclick = r.type === 'water' ? "goTo('nutrition')" : "document.getElementById('meal-type')&&(document.getElementById('meal-type').value='"+r.type+"');goTo('nutrition')";
    h += '<div onclick="'+onclick+'" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(249,115,22,.05);border:1px solid rgba(249,115,22,.12);border-radius:12px;margin-bottom:4px;cursor:pointer">';
    h += '<span style="font-size:20px">'+r.icon+'</span>';
    h += '<div style="flex:1;font-size:12px;color:var(--org);font-weight:600">'+r.msg+'</div>';
    h += '<span style="font-size:11px;color:var(--org)">記録 →</span></div>';
  }
  h += '</div>';
  return h;
}

// 7. コーチ向け選手栄養学習データ表示
function openPlayerNutritionReport(playerId) {
  var p = DB.players.find(function(x){return x.id===playerId;});
  if (!p) { toast('選手が見つかりません','e'); return; }

  // 共有フィールドから選手別の食事履歴を取得（他デバイスから同期済み）
  var pMealHist = (DB.playerMealHistory||{})[playerId] || {};
  // フォールバック: 自分自身のデータの場合はmealHistoryも参照
  var history = (DB.currentUser?.id === playerId) ? (DB.mealHistory || {}) : pMealHist;
  // 両方マージ（自分のデータの場合）
  if(DB.currentUser?.id === playerId && Object.keys(pMealHist).length > 0){
    var merged = {};
    Object.keys(history).forEach(function(k){ merged[k] = history[k]; });
    Object.keys(pMealHist).forEach(function(k){ if(!merged[k] || merged[k].length < pMealHist[k].length) merged[k] = pMealHist[k]; });
    history = merged;
  }
  var myFoods = DB.myFoods || [];
  var bLog = DB.bodyLog[playerId] || {};
  var days = Object.keys(history).sort().slice(-14);
  var histDays = days.length;

  // 14日間のデータ集計
  var dailyData = [];
  for (var d=0; d<days.length; d++) {
    var meals = history[days[d]] || [];
    var dk=0,dp=0,dc=0,df=0;
    for (var m=0;m<meals.length;m++){dk+=meals[m].kcal||0;dp+=meals[m].protein||0;dc+=meals[m].carb||0;df+=meals[m].fat||0;}
    dailyData.push({date:days[d],kcal:dk,protein:dp,carb:dc,fat:df,meals:meals.length});
  }

  var freq = getFrequentFoods(5);
  var bodyEntries = Object.values(bLog).sort(function(a,b){return a.date>b.date?-1:1;});
  var latestBody = bodyEntries[0];

  var h = '<div style="display:grid;gap:14px">';

  // ヘッダ
  h += '<div style="display:flex;align-items:center;gap:12px">';
  h += '<div class="avi avi-lg" style="background:'+(p.color||'var(--org)')+'18;color:'+(p.color||'var(--org)')+'">'+(p.name||'?')[0]+'</div>';
  h += '<div><div style="font-size:16px;font-weight:800">'+sanitize(p.name,14)+'</div>';
  h += '<div style="font-size:11px;color:var(--txt3)">'+(p.pos||'--')+' · '+(latestBody?latestBody.weight+'kg':'--')+'</div></div></div>';

  // 学習サマリー
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
  h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--org)">'+myFoods.length+'</div><div style="font-size:9px;color:var(--txt3)">学習食品</div></div>';
  h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--teal)">'+histDays+'</div><div style="font-size:9px;color:var(--txt3)">記録日数</div></div>';
  var avgK = dailyData.length ? Math.round(dailyData.reduce(function(s,d){return s+d.kcal;},0)/dailyData.length) : 0;
  h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--blue)">'+avgK+'</div><div style="font-size:9px;color:var(--txt3)">平均kcal</div></div>';
  h += '</div>';

  // カロリー推移グラフ
  if (dailyData.length >= 3) {
    var maxK2 = Math.max.apply(null, dailyData.map(function(d){return d.kcal;})) || 1;
    h += '<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">📊 カロリー推移（直近'+dailyData.length+'日）</div>';
    h += '<div style="display:flex;gap:2px;align-items:flex-end;height:50px">';
    for (var gi=0; gi<dailyData.length; gi++) {
      var gd = dailyData[gi];
      var gh = Math.max(5, gd.kcal/maxK2*100);
      var gl = ['日','月','火','水','木','金','土'][new Date(gd.date+'T12:00').getDay()];
      h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px">';
      h += '<div style="font-size:7px;color:var(--txt3)">'+gd.kcal+'</div>';
      h += '<div style="width:100%;height:'+gh+'%;border-radius:2px;background:var(--org);opacity:.7"></div>';
      h += '<div style="font-size:7px;color:var(--txt3)">'+gl+'</div></div>';
    }
    h += '</div></div>';
  }

  // よく食べるもの
  if (freq.length) {
    h += '<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">⭐ よく食べる食品</div>';
    for (var fi2=0; fi2<Math.min(5,freq.length); fi2++) {
      h += '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--surf2);border-radius:8px;margin-bottom:2px;font-size:11px">';
      h += '<span style="color:var(--org);font-weight:700;min-width:24px">'+(fi2+1)+'</span>';
      h += '<span style="flex:1">'+freq[fi2].name.split('（')[0]+'</span>';
      h += '<span style="color:var(--txt3)">'+freq[fi2].count+'回</span></div>';
    }
    h += '</div>';
  }

  h += '</div>';
  openM('🍽️ '+sanitize(p.name,10)+' の栄養レポート', h, true);
}

// ==================== 🧠 Advanced AI v2: Predictive & Coaching ====================

// 8. 予測的食事提案 — 過去パターンから「次に食べそうなもの」を予測
function getPredictiveSuggestions() {
  if (!DB.myFoods || DB.myFoods.length < 3) return [];
  var hour = new Date().getHours();
  var dayOfWeek = new Date().getDay();
  var slot = hour < 10 ? 'morning' : hour < 14 ? 'lunch' : hour < 18 ? 'afternoon' : 'dinner';

  // 今日既に食べたものを除外リストに
  var eaten = {};
  if (DB.meals && DB.meals.today) {
    for (var i = 0; i < DB.meals.today.length; i++) eaten[DB.meals.today[i].name] = true;
  }

  // 曜日+時間帯の組み合わせスコア
  var history = DB.mealHistory || {};
  var daySlotCounts = {};
  var keys = Object.keys(history);
  for (var ki = 0; ki < keys.length; ki++) {
    var d = new Date(keys[ki] + 'T12:00');
    if (d.getDay() !== dayOfWeek) continue;
    var meals = history[keys[ki]] || [];
    for (var mi = 0; mi < meals.length; mi++) {
      var mHour = parseInt(meals[mi].time) || 12;
      var mSlot = mHour < 10 ? 'morning' : mHour < 14 ? 'lunch' : mHour < 18 ? 'afternoon' : 'dinner';
      if (mSlot !== slot) continue;
      var name = meals[mi].name;
      daySlotCounts[name] = (daySlotCounts[name] || 0) + 1;
    }
  }

  // スコアリング: 曜日×時間帯一致 × 頻度 × 最近使用ボーナス
  var scored = DB.myFoods.map(function(f) {
    if (eaten[f.name]) return { food: f, score: -1 };
    var daySlotScore = daySlotCounts[f.name] || 0;
    var freqScore = f.count || 0;
    var recencyDays = f.lastUsed ? Math.max(0, (Date.now() - new Date(f.lastUsed).getTime()) / 86400000) : 30;
    var recencyBonus = Math.max(0, 14 - recencyDays);
    return { food: f, score: daySlotScore * 5 + freqScore + recencyBonus };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.filter(function(s) { return s.score > 0; }).slice(0, 5).map(function(s) { return s.food; });
}

// 9. 栄養バランスストリーク — 連続でスコア60+の日数
function getNutritionStreak() {
  var history = DB.mealHistory || {};
  var days = Object.keys(history).sort().reverse();
  var streak = 0;
  for (var i = 0; i < days.length; i++) {
    var score = calcDailyNutritionScore(days[i]);
    if (score >= 60) streak++;
    else break;
  }
  return streak;
}

// 10. AIコーチング — 今日の残り栄養素からリアルタイムアドバイス
function getRealtimeCoaching() {
  var tots = calcTotals();
  var player = DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  var w = (player && player.weight) || 65;
  var goal = {kcal:w*40, protein:w*2, carb:w*5, fat:w*1};
  var hour = new Date().getHours();
  var dayOfWeek = new Date().getDay();
  var meals = DB.meals.today || [];
  var mealCount = meals.length;
  var water = (DB.meals && DB.meals.water) || 0;
  var remaining = {
    kcal: Math.max(0, goal.kcal - tots.kcal),
    protein: Math.max(0, goal.protein - tots.protein),
    carb: Math.max(0, goal.carb - tots.carb),
    fat: Math.max(0, goal.fat - tots.fat)
  };
  var mealsLeft = hour<10?3:hour<14?2:hour<18?1:0;
  var tips = [];

  // ── A. 食事タイミング分析 ──
  var hasBf = meals.some(function(m){return m.type==='breakfast';});
  var hasLunch = meals.some(function(m){return m.type==='lunch';});
  var hasDinner = meals.some(function(m){return m.type==='dinner';});
  if (hour>=10 && !hasBf && mealCount>0) {
    tips.push({icon:'⏰',msg:'朝食が未記録。練習前は糖質中心の軽食（おにぎり・バナナ）で体を動かすエネルギーを確保',type:'warn',pri:9});
  } else if (hour>=10 && !hasBf && mealCount===0) {
    tips.push({icon:'🌅',msg:'今日の食事をまだ記録していません。朝食から記録を始めましょう',type:'info',pri:10});
  }
  if (hour>=15 && !hasLunch && hasBf) {
    tips.push({icon:'⏰',msg:'昼食が未記録。空腹が4時間以上続くと筋分解（カタボリック）が進行します',type:'warn',pri:8});
  }

  // ── B. スポーツ栄養タイミング（トレーニング連動） ──
  var todayTrain2=DB.trainingLog[player?.id||'']?.[new Date().toISOString().slice(0,10)];
  if (hour>=5 && hour<9 && !hasBf) {
    tips.push({icon:'🏃',msg:'練習前1〜2時間: 消化の良い糖質（バナナ、おにぎり、カステラ）を摂取して筋グリコーゲンを補充',type:'info',pri:7});
  }
  // 練習後30分ゴールデンタイム
  if(todayTrain2){
    var trainEnd=todayTrain2.endTime||null;
    var postTrainMeals=meals.filter(function(m){
      if(!m.time||!trainEnd) return false;
      var mt=parseInt(m.time.split(':')[0])*60+parseInt(m.time.split(':')[1]);
      var tt=parseInt(trainEnd.split(':')[0])*60+parseInt(trainEnd.split(':')[1]);
      return mt>=tt && mt<=tt+60;
    });
    var postTrainP=postTrainMeals.reduce(function(s,m){return s+(m.protein||0);},0);
    if(postTrainMeals.length===0 && hour>8){
      tips.push({icon:'⚡',msg:'トレーニング後30分以内にP20-30g摂取が筋回復のゴールデンタイム。プロテインや鶏むねがおすすめ',type:'warn',pri:9});
    } else if(postTrainP>0 && postTrainP<15){
      tips.push({icon:'💪',msg:'練習後のタンパク質が'+fmtN(postTrainP)+'gとやや少なめ。あと'+(20-Math.round(postTrainP))+'g（卵1個+ヨーグルト程度）追加すると◎',type:'info',pri:7});
    } else if(postTrainP>=20){
      tips.push({icon:'✅',msg:'練習後のタンパク質補給バッチリ！'+fmtN(postTrainP)+'g摂取で筋回復を促進中',type:'good',pri:5});
    }
    // GIベースのアドバイス
    var todayGI=meals.reduce(function(s,m){return s+(m.gi||0);},0)/(mealCount||1);
    if(todayGI>70 && !todayTrain2){
      tips.push({icon:'📊',msg:'高GI食品が多め（平均GI '+Math.round(todayGI)+'）。トレーニングがない日は低GI食品で血糖値を安定させましょう',type:'info',pri:5});
    }
  }
  // 練習予定がある場合の事前アドバイス
  var upcomingTrain=DB.events?.find(function(ev){
    if(!ev || ev.type!=='practice') return false;
    var evDate;
    if(ev.year!==undefined) evDate=new Date(ev.year,ev.month,ev.date);
    else return false;
    return evDate.toISOString().slice(0,10)===new Date().toISOString().slice(0,10);
  });
  if(upcomingTrain && !todayTrain2 && hour<14){
    tips.push({icon:'🏟️',msg:'今日は練習予定あり。練習2時間前に糖質中心（おにぎり、バナナ等）を。GI70以上の食品がおすすめ',type:'info',pri:8});
  }
  if (hour>=11 && hour<13 && hasLunch) {
    var lunchP = meals.filter(function(m){return m.type==='lunch';}).reduce(function(s,m){return s+(m.protein||0);},0);
    if (lunchP < 20) {
      tips.push({icon:'🍗',msg:'昼食のタンパク質が'+fmtN(lunchP)+'gと少なめ。午後の練習に備えて+20g（鶏むね肉100g相当）を目標に',type:'warn',pri:7});
    }
  }
  if (hour>=16 && hour<20 && tots.protein<goal.protein*0.6) {
    tips.push({icon:'💪',msg:'練習後30分以内のタンパク質摂取が筋回復のゴールデンタイム。P残り'+fmtN(remaining.protein)+'g（プロテイン1杯で約20g）',type:'warn',pri:9});
  }
  if (hour>=21 && !hasDinner && mealCount>0) {
    tips.push({icon:'🌙',msg:'夕食がまだです。就寝2時間前までに消化の良い食事を。遅すぎると睡眠の質が低下',type:'warn',pri:8});
  }

  // ── C. PFCバランスリアルタイム分析 ──
  if (mealCount >= 2) {
    var totalMacKcal = tots.protein*4 + tots.carb*4 + tots.fat*9;
    if (totalMacKcal > 0) {
      var pR = Math.round(tots.protein*4/totalMacKcal*100);
      var fR = Math.round(tots.fat*9/totalMacKcal*100);
      var cR = Math.round(tots.carb*4/totalMacKcal*100);
      if (fR > 35) {
        tips.push({icon:'⚖️',msg:'脂質比率'+fR+'%（目標25%以下）。揚げ物→焼き・蒸しに変更で大幅カット可能',type:'warn',pri:6});
      }
      if (pR < 15 && tots.kcal > goal.kcal*0.3) {
        tips.push({icon:'🥩',msg:'タンパク質比率'+pR+'%（目標20%）。主菜をもう1品追加するか、プロテインで補強を',type:'warn',pri:7});
      }
      if (cR > 65) {
        tips.push({icon:'🍚',msg:'炭水化物比率'+cR+'%と高め。副菜（サラダ・肉・魚）を増やしてバランス改善を',type:'info',pri:5});
      }
    }
  }

  // ── D. 残り食事の戦略的アドバイス ──
  if (mealsLeft > 0 && mealCount > 0 && remaining.kcal > 200) {
    var perP = Math.round(remaining.protein / mealsLeft);
    var perKcal = Math.round(remaining.kcal / mealsLeft);
    var suggestMenu = '';
    if (perP > 30) suggestMenu = '（例: 鶏むね肉定食、鮭定食、牛丼＋卵）';
    else if (perP > 15) suggestMenu = '（例: 親子丼、ツナサンド、納豆ご飯＋味噌汁）';
    tips.push({icon:'🎯',msg:'残り'+mealsLeft+'食の目安: 各'+perKcal+'kcal / P'+perP+'g' + suggestMenu,type:'info',pri:6});
  }
  if (mealsLeft===0 && mealCount>0) {
    if (tots.protein>=goal.protein*0.9 && tots.kcal>=goal.kcal*0.8) {
      tips.push({icon:'🎉',msg:'今日の栄養バランスは優秀です！この食事パターンを継続しましょう',type:'good',pri:10});
    } else if (tots.protein<goal.protein*0.7) {
      tips.push({icon:'🥛',msg:'寝る前にプロテイン+牛乳（P約25g）またはギリシャヨーグルト（P約10g）で補強を',type:'warn',pri:8});
    }
    if (tots.kcal < goal.kcal * 0.7) {
      tips.push({icon:'⚡',msg:'総カロリーが目標の'+Math.round(tots.kcal/goal.kcal*100)+'%。慢性的なエネルギー不足は怪我・免疫低下のリスク',type:'warn',pri:8});
    }
  }

  // ── E2. ナトリウム・栄養警告 ──
  if(tots.sodium>0){
    if(tots.sodium>2500){
      tips.push({icon:'🧂',msg:'塩分摂取量が'+Math.round(tots.sodium)+'mg（食塩相当約'+fmtN(tots.sodium/400)+'g）と多め。むくみや血圧上昇の原因に。漬物・汁物を控えめに',type:'warn',pri:7});
    }
    if(tots.sodium>3500){
      tips.push({icon:'⚠️',msg:'塩分が'+Math.round(tots.sodium)+'mg（WHO推奨2000mg/日の'+(Math.round(tots.sodium/20))+'%）。腎臓への負担に注意',type:'warn',pri:8});
    }
  }
  if(tots.omega3>0 && tots.omega3<0.5 && mealCount>=2){
    tips.push({icon:'🐟',msg:'オメガ3脂肪酸が不足気味（'+fmtN(tots.omega3)+'g/目標2g）。サバ缶や鮭を取り入れると抗炎症効果で回復促進',type:'info',pri:4});
  }
  if(tots.vitD>0 && tots.vitD<3 && mealCount>=2){
    tips.push({icon:'☀️',msg:'ビタミンDが不足気味（'+fmtN(tots.vitD)+'μg/目標8μg）。骨密度と免疫力に影響。鮭・しらす・卵がおすすめ',type:'info',pri:4});
  }
  if(tots.zinc>0 && tots.zinc<4 && mealCount>=2){
    tips.push({icon:'⚡',msg:'亜鉛が不足気味（'+fmtN(tots.zinc)+'mg/目標10mg）。筋回復・免疫に必須。牛赤身肉・牡蠣・納豆で補給を',type:'info',pri:4});
  }

  // ── E. 水分（運動量考慮） ──
  var waterPace = Math.floor(8 * Math.min(hour, 20) / 20);
  if (water < waterPace && hour >= 10) {
    var gap = waterPace - water;
    tips.push({icon:'💧',msg:'水分ペース遅れ（'+water+'/8杯）。この時間帯なら'+waterPace+'杯が目安。あと'+gap+'杯を意識',type:'warn',pri:5});
  }

  // ── F. 過去データから傾向分析 ──
  var hist = DB.mealHistory || {};
  var histKeys = Object.keys(hist).sort().slice(-7);
  if (histKeys.length >= 3) {
    var lowPDays = 0, lowKcalDays = 0, skipBfDays = 0;
    for (var i = 0; i < histKeys.length; i++) {
      var dMeals = hist[histKeys[i]] || [];
      var dP = 0, dK = 0, dHasBf = false;
      for (var j = 0; j < dMeals.length; j++) {
        dP += dMeals[j].protein || 0;
        dK += dMeals[j].kcal || 0;
        if (dMeals[j].type === 'breakfast') dHasBf = true;
      }
      if (dP < goal.protein * 0.7 && dMeals.length > 0) lowPDays++;
      if (dK < goal.kcal * 0.7 && dMeals.length > 0) lowKcalDays++;
      if (!dHasBf && dMeals.length > 0) skipBfDays++;
    }
    if (lowPDays >= 3) {
      tips.push({icon:'📊',msg:'直近'+histKeys.length+'日中'+lowPDays+'日でタンパク質不足。毎食P20g以上（手のひらサイズの肉/魚）を意識',type:'warn',pri:7});
    }
    if (lowKcalDays >= 3) {
      tips.push({icon:'📊',msg:'直近'+histKeys.length+'日中'+lowKcalDays+'日でカロリー不足。エネルギー不足は疲労蓄積・パフォーマンス低下の原因に',type:'warn',pri:7});
    }
    if (skipBfDays >= 3) {
      tips.push({icon:'📊',msg:'朝食を'+skipBfDays+'日スキップ。アスリートの朝食は午前中の集中力と練習の質に直結します',type:'warn',pri:6});
    }
  }

  // ── G. 曜日パターンアドバイス ──
  var dayNames = ['日','月','火','水','木','金','土'];
  var sameDayHistory = [];
  for (var i = 0; i < histKeys.length; i++) {
    var dd = new Date(histKeys[i] + 'T12:00');
    if (dd.getDay() === dayOfWeek) sameDayHistory.push(hist[histKeys[i]]);
  }
  if (sameDayHistory.length >= 2) {
    var avgDayKcal = 0;
    for (var i = 0; i < sameDayHistory.length; i++) {
      for (var j = 0; j < sameDayHistory[i].length; j++) avgDayKcal += sameDayHistory[i][j].kcal || 0;
    }
    avgDayKcal = Math.round(avgDayKcal / sameDayHistory.length);
    if (avgDayKcal < goal.kcal * 0.7) {
      tips.push({icon:'📅',msg:dayNames[dayOfWeek]+'曜日は平均'+avgDayKcal+'kcalと摂取量が少ない傾向。意識的に食事量を増やしましょう',type:'info',pri:4});
    }
  }

  // 優先度順にソートして最大5件
  tips.sort(function(a,b){return (b.pri||0)-(a.pri||0);});
  return tips.slice(0, 5);
}


// 11. 学習進捗のゲーミフィケーション
function getLearningAchievements() {
  var myFoods = DB.myFoods || [];
  var history = DB.mealHistory || {};
  var histDays = Object.keys(history).length;
  var streak = getNutritionStreak();
  var achievements = [];

  if (myFoods.length >= 5) achievements.push({ icon: '🌟', title: '食品マスター', desc: myFoods.length + '食品を学習済み', earned: true });
  else achievements.push({ icon: '🌟', title: '食品マスター', desc: '5食品を登録しよう', earned: false, progress: myFoods.length + '/5' });

  if (histDays >= 7) achievements.push({ icon: '📅', title: '1週間継続', desc: histDays + '日間記録中', earned: true });
  else achievements.push({ icon: '📅', title: '1週間継続', desc: '7日間記録しよう', earned: false, progress: histDays + '/7' });

  if (histDays >= 30) achievements.push({ icon: '🏆', title: '30日チャレンジ', desc: '1ヶ月継続達成！', earned: true });
  else if (histDays >= 7) achievements.push({ icon: '🏆', title: '30日チャレンジ', desc: '30日間記録しよう', earned: false, progress: histDays + '/30' });

  if (streak >= 3) achievements.push({ icon: '🔥', title: 'バランスストリーク', desc: streak + '日連続で高スコア', earned: true });
  else achievements.push({ icon: '🔥', title: 'バランスストリーク', desc: '3日連続でスコア60+を目指そう', earned: false, progress: streak + '/3' });

  var totalMeals = 0;
  for (var k in history) totalMeals += (history[k]||[]).length;
  if (totalMeals >= 50) achievements.push({ icon: '🍽️', title: '50食記録', desc: totalMeals + '食を記録済み', earned: true });
  else achievements.push({ icon: '🍽️', title: '50食記録', desc: '50食を記録しよう', earned: false, progress: totalMeals + '/50' });

  return achievements;
}

// ==================== 📸 写真で食事記録 (v3 — AI + フォールバック) ====================
window._photoState = { foods: null, imgDataUrl: null, analyzing: false, file: null };

var MEAL_SETS = [
  {name:'和定食（ごはん・味噌汁・焼魚・小鉢）', items:['白ごはん（1膳150g）','鮭（1切れ80g）','サラダ（1皿）'], emoji:'🍱'},
  {name:'カレーライス', items:['カレーライス'], emoji:'🍛'},
  {name:'牛丼', items:['牛丼（並盛）'], emoji:'🥩'},
  {name:'ラーメン＋卵', items:['ラーメン（醤油）','卵（1個60g）'], emoji:'🍜'},
  {name:'パスタランチ', items:['パスタ（乾100g）','サラダ（1皿）'], emoji:'🍝'},
  {name:'筋トレ飯（鶏むね定食）', items:['白ごはん（1膳150g）','鶏むね肉（皮なし100g）','ブロッコリー（100g）','卵（1個60g）'], emoji:'💪'},
  {name:'コンビニ飯', items:['おにぎり（鮭）','サラダチキン（1個110g）'], emoji:'🏪'},
  {name:'朝食セット', items:['食パン（6枚切り1枚）','卵（1個60g）','ヨーグルト（100g）','バナナ（1本100g）'], emoji:'🌅'},
  {name:'プロテイン＋バナナ', items:['プロテイン（1杯30g）','バナナ（1本100g）'], emoji:'🥤'},
  {name:'チキン南蛮弁当', items:['チキン南蛮弁当'], emoji:'🍗'},
];

function resizeImageForAPI(file, maxDim) {
  maxDim = maxDim || 800;
  return new Promise(function(resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function() {
      URL.revokeObjectURL(url);
      var w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = function() { URL.revokeObjectURL(url); reject(new Error('画像読込失敗')); };
    img.src = url;
  });
}

async function startPhotoMealFlow(inputEl) {
  var file = inputEl && inputEl.files && inputEl.files[0];
  if (!file) return;
  if(!RateLimit.check('photo_ai', 5, 60000)){ toast('写真解析が頻繁すぎます。しばらくお待ちください。','e'); return; }
  window._photoState.file = file;
  if (inputEl) inputEl.value = '';

  var statusEl = document.getElementById('photo-analysis-status');
  if (!statusEl) return;

  // 1. 写真プレビュー生成
  var dataUrl;
  try {
    dataUrl = await resizeImageForAPI(file, 800);
  } catch(e) {
    dataUrl = URL.createObjectURL(file);
  }
  window._photoState.imgDataUrl = dataUrl;

  // 2. 即座にUI表示（AI解析中 + 手動選択可）
  showPhotoMealUI(dataUrl, null, 'analyzing');

  // 3. バックグラウンドでAI解析
  tryAIAnalysis(dataUrl).then(function(foods) {
    if (foods && foods.length > 0) {
      window._photoState.foods = foods;
      showPhotoMealUI(dataUrl, foods, 'done');
    } else {
      showPhotoMealUI(dataUrl, null, 'fallback');
    }
  }).catch(function(err) {
    // AI fallback (suppressed)
    showPhotoMealUI(dataUrl, null, 'fallback');
  });
}

async function tryAIAnalysis(dataUrl) {
  var base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('no base64');

  // ── 1. Gemini Vision API（ユーザーのAPIキーで直接呼び出し）──
  var apiKey = _getGeminiKey();
  if(apiKey) {
    var prompt = 'あなたはスポーツ栄養の専門家です。この食事写真を分析してください。\n\n'
      + '【指示】\n'
      + '1. 写真に写っている全ての食品・飲み物を特定\n'
      + '2. 各食品の量を見た目から推定（g単位）\n'
      + '3. 日本食品成分表に基づいて栄養素を正確に計算\n'
      + '4. 調味料・ソース・ドレッシングも含める\n\n'
      + '【出力】JSON配列のみ返してください。マークダウンや説明文は一切不要です。\n'
      + '[{"name":"食品名","amount":"推定量","kcal":数値,"protein":数値,"carb":数値,"fat":数値,"fiber":数値,"vitC":数値,"calcium":数値,"iron":数値,"zinc":数値,"sodium":数値}]\n'
      + 'kcal=kcal, protein/carb/fat/fiber=g, vitC/calcium/iron/zinc/sodium=mg\n'
      + '食べ物なしの場合: []';

    var resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
      body:JSON.stringify({
        contents:[{parts:[
          {inline_data:{mime_type:'image/jpeg',data:base64}},
          {text:prompt}
        ]}],
        generationConfig:{temperature:0.1,maxOutputTokens:3000}
      })
    });

    if(!resp.ok) {
      var errTxt = '';
      try { errTxt = await resp.text(); } catch(e){}
      throw new Error('Gemini API error: '+resp.status);
    }

    var data = await resp.json();
    var rawText = data?.candidates?.[0]?.content?.parts?.map(function(p){return p.text||'';}).join('') || '';
    
    // JSON解析
    var jsonStr = rawText.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    var foods = null;
    try { foods = JSON.parse(jsonStr); } catch(e1) {
      var m = jsonStr.match(/\[[\s\S]*\]/);
      if(m) { try { foods = JSON.parse(m[0]); } catch(e2) {} }
    }
    if(foods && !Array.isArray(foods)) foods = [foods];
    if(foods) foods = foods.filter(function(f){ return f && f.name; });

    if(foods && foods.length > 0) {
      return foods.map(function(f) {
        var parsed = { name:String(f.name||'不明'), amount:String(f.amount||'1人前'),
          kcal:Math.round(Number(f.kcal)||0), protein:Math.round((Number(f.protein)||0)*10)/10,
          carb:Math.round((Number(f.carb)||0)*10)/10, fat:Math.round((Number(f.fat)||0)*10)/10,
          fiber:Math.round((Number(f.fiber)||0)*10)/10, vitC:Math.round(Number(f.vitC)||0),
          calcium:Math.round(Number(f.calcium)||0), iron:Math.round((Number(f.iron)||0)*10)/10,
          zinc:Math.round((Number(f.zinc)||0)*10)/10, sodium:Math.round(Number(f.sodium)||0) };
        return _enhanceAIResultWithKnowledge(parsed);
      });
    }
    throw new Error('No foods detected');
  }

  // ── 2. バックエンドフォールバック ──
  if(typeof API_BASE !== 'undefined' && API_BASE) {
    var _fbToken = '';
    try { _fbToken = await window._fbAuth?.currentUser?.getIdToken() || ''; } catch(e){}
    var response = await fetch(API_BASE + '/api/ai/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _fbToken},
      body: JSON.stringify({
        messages: [{role:'user', content:'この食事写真の全食品を特定し栄養素を推定。JSON配列のみ。[{"name":"食品名","amount":"量","kcal":数値,"protein":数値,"carb":数値,"fat":数値}]'}],
        image: {mimeType:'image/jpeg', data:base64}
      })
    });
    if(response.ok) {
      var bData = await response.json();
      var bText = bData.text || (bData.candidates?.[0]?.content?.parts?.map(function(p){return p.text||'';}).join('')) || '';
      var bJsonStr = bText.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
      var bFoods = null;
      try { bFoods = JSON.parse(bJsonStr); } catch(e1) {
        var bm = bJsonStr.match(/\[[\s\S]*\]/);
        if(bm) { try { bFoods = JSON.parse(bm[0]); } catch(e2) {} }
      }
      if(bFoods && !Array.isArray(bFoods)) bFoods = [bFoods];
      if(bFoods) bFoods = bFoods.filter(function(f){return f && f.name;});
      if(bFoods && bFoods.length > 0) {
        return bFoods.map(function(f) {
          return _enhanceAIResultWithKnowledge({
            name:String(f.name||'不明'), amount:String(f.amount||'1人前'),
            kcal:Math.round(Number(f.kcal)||0), protein:Math.round((Number(f.protein)||0)*10)/10,
            carb:Math.round((Number(f.carb)||0)*10)/10, fat:Math.round((Number(f.fat)||0)*10)/10,
            fiber:Math.round((Number(f.fiber)||0)*10)/10, vitC:Math.round(Number(f.vitC)||0),
            calcium:Math.round(Number(f.calcium)||0), iron:Math.round((Number(f.iron)||0)*10)/10 });
        });
      }
    }
  }

  // ── 3. 両方失敗 ──
  if(!apiKey) {
  }
  throw new Error('AI analysis unavailable');
}

function showPhotoMealUI(imgSrc, aiFoods, mode) {
  var statusEl = document.getElementById('photo-analysis-status');
  if (!statusEl) return;
  statusEl.style.display = 'block';

  var h = '<div style="background:var(--surf2);border:1px solid var(--b1);border-radius:16px;padding:14px">';

  // 写真プレビュー
  h += '<div style="position:relative;margin-bottom:12px">' +
    '<img src="' + imgSrc + '" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;border:1px solid var(--b1)">' +
    '<button onclick="clearPhotoAnalysis()" style="position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center">&times;</button></div>';

  if (mode === 'analyzing') {
    h += '<div style="display:flex;align-items:center;gap:8px;padding:10px;background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.15);border-radius:10px;margin-bottom:12px">' +
      '<div style="width:16px;height:16px;border:2px solid var(--b2);border-top-color:var(--org);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0"></div>' +
      '<div style="font-size:11px;color:var(--org);font-weight:600">AI解析中... 待てない場合は下から手動追加</div></div>';
    h += buildQuickSelectUI();

  } else if (mode === 'done' && aiFoods) {
    var tk=0,tp=0,tc=0,tf=0;
    for (var i=0;i<aiFoods.length;i++){tk+=aiFoods[i].kcal;tp+=aiFoods[i].protein;tc+=aiFoods[i].carb;tf+=aiFoods[i].fat;}
    var pR=tk>0?Math.round(tp*4/tk*100):0, cR=tk>0?Math.round(tc*4/tk*100):0, fR=tk>0?Math.round(tf*9/tk*100):0;

    h += '<div style="margin-bottom:10px"><div style="font-size:14px;font-weight:800;color:var(--teal);margin-bottom:4px">✅ AI検出: '+aiFoods.length+'品目 · '+tk+'kcal</div>';
    h += '<div style="display:flex;gap:2px;height:6px;border-radius:3px;overflow:hidden;margin-bottom:3px">' +
      '<div style="flex:'+(pR||1)+';background:var(--teal)"></div><div style="flex:'+(cR||1)+';background:var(--blue)"></div><div style="flex:'+(fR||1)+';background:#eab308"></div></div>';
    h += '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--txt3)">' +
      '<span style="color:var(--teal)">P'+fmtN(tp)+'g('+pR+'%)</span><span style="color:var(--blue)">C'+fmtN(tc)+'g('+cR+'%)</span><span style="color:#eab308">F'+fmtN(tf)+'g('+fR+'%)</span></div></div>';

    h += '<div style="max-height:180px;overflow-y:auto;margin-bottom:10px">';
    for (var j=0;j<aiFoods.length;j++) {
      var af=aiFoods[j];
      h += '<label style="display:flex;align-items:center;gap:8px;padding:9px;background:var(--surf);border-radius:10px;margin-bottom:3px;border:1px solid var(--b1);cursor:pointer">' +
        '<input type="checkbox" id="pf-chk-'+j+'" checked style="accent-color:var(--org);width:17px;height:17px;flex-shrink:0">' +
        '<div style="flex:1"><div style="font-size:12px;font-weight:600">'+af.name+' <span style="font-size:9px;color:var(--txt3)">'+af.amount+'</span></div>' +
        '<div style="font-size:9px;color:var(--txt3)">'+af.kcal+'kcal · P'+fmtN(af.protein)+'g C'+fmtN(af.carb)+'g F'+fmtN(af.fat)+'g</div></div></label>';
    }
    h += '</div>';
    h += '<button class="btn btn-primary w-full" style="padding:12px;font-size:14px;border-radius:12px;font-weight:700" onclick="addPhotoAIFoods()">🍽️ AI結果を追加</button>';
    h += '<details style="margin-top:10px"><summary style="font-size:11px;color:var(--org);cursor:pointer;font-weight:600">＋ 品目を手動で追加</summary><div style="margin-top:8px">' + buildQuickSelectUI() + '</div></details>';

  } else {
    var _hasGeminiKey = !!_getGeminiKey();
    if(!_hasGeminiKey) {
      h += '<div style="padding:12px;background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.2);border-radius:10px;margin-bottom:12px">' +
        '<div style="font-size:12px;font-weight:700;color:var(--org);margin-bottom:4px">🤖 AI写真解析を有効にするには</div>' +
        '<div style="font-size:11px;color:var(--txt2);line-height:1.6;margin-bottom:8px">' +
        'Gemini APIキーを設定すると、撮った写真からAIが自動で食品を検出しPFCを計算します。</div>' +
        '<button class="btn btn-sm" style="background:var(--org);color:#fff;font-size:11px;padding:6px 14px" ' +
        'onclick="clearPhotoAnalysis();openNutritionGoals()">⚙️ APIキーを設定する</button></div>';
    } else {
      h += '<div style="padding:10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;margin-bottom:12px">' +
        '<div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:2px">⚠️ AI解析に失敗しました</div>' +
        '<div style="font-size:11px;color:var(--txt3)">写真が不鮮明か食品を検出できませんでした。下から手動で選択してください。</div></div>';
    }
    h += '<div style="font-size:12px;font-weight:700;margin-bottom:6px">📋 手動で食品を選択</div>';
    h += buildQuickSelectUI();
  }

  h += '</div>';
  statusEl.innerHTML = h;
}

function buildQuickSelectUI() {
  var catEmoji = {'主食':'🍚','肉':'🍖','魚':'🐟','卵・大豆':'🥚','乳製品':'🥛','野菜':'🥦','果物':'🍎','外食':'🍱','補食':'🍫','飲料':'🥤'};

  var h = '';

  // 🧠 学習済み: よく食べるもの（最優先表示）
  var freq = getFrequentFoods(8);
  if (freq.length > 0) {
    h += '<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--org);margin-bottom:5px">🧠 よく食べるもの（学習済み）</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px">';
    for (var fi=0; fi<freq.length; fi++) {
      var ff = freq[fi];
      var dbIdx = -1;
      for (var di=0; di<FOOD_DB.length; di++) { if (FOOD_DB[di].name === ff.name) { dbIdx = di; break; } }
      if (dbIdx >= 0) {
        h += '<button onclick="addSingleFoodFromPhoto('+dbIdx+')" style="padding:5px 9px;border-radius:18px;border:1px solid rgba(249,115,22,.25);background:rgba(249,115,22,.06);font-size:10px;cursor:pointer;white-space:nowrap;color:var(--org)">' +
          '⭐ '+ff.name.split('（')[0]+' <span style="font-size:8px;opacity:.6">'+ff.count+'回</span></button>';
      }
    }
    h += '</div></div>';
  }

  // セットメニュー
  h += '<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--txt3);margin-bottom:5px">🍱 セットで追加</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:4px">';
  for (var si=0; si<MEAL_SETS.length; si++) {
    h += '<button onclick="addMealSet('+si+')" style="padding:5px 9px;border-radius:18px;border:1px solid var(--b1);background:var(--surf);font-size:10px;cursor:pointer;white-space:nowrap;color:var(--txt2)">' +
      MEAL_SETS[si].emoji+' '+MEAL_SETS[si].name.split('（')[0]+'</button>';
  }
  h += '</div></div>';

  // カテゴリボタン
  var catKeys = [];
  var seen = {};
  for (var i=0; i<FOOD_DB.length; i++) {
    if (!seen[FOOD_DB[i].cat]) { seen[FOOD_DB[i].cat] = true; catKeys.push(FOOD_DB[i].cat); }
  }

  h += '<div><div style="font-size:11px;font-weight:700;color:var(--txt3);margin-bottom:5px">📂 カテゴリから追加</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px" id="photo-cat-btns">';
  for (var ci=0; ci<catKeys.length; ci++) {
    var ck = catKeys[ci];
    h += '<button onclick="showPhotoCatItems(\''+ck.replace(/'/g,"\\'")+'\')" style="padding:4px 9px;border-radius:14px;border:1px solid var(--b1);background:var(--surf);font-size:10px;cursor:pointer;color:var(--txt2)">' +
      (catEmoji[ck]||'📦')+' '+ck+'</button>';
  }
  h += '</div><div id="photo-cat-items"></div></div>';

  return h;
}

function showPhotoCatItems(cat) {
  var container = document.getElementById('photo-cat-items');
  if (!container) return;
  var btns = document.querySelectorAll('#photo-cat-btns button');
  for (var b=0; b<btns.length; b++) {
    var isActive = btns[b].textContent.indexOf(cat) >= 0;
    btns[b].style.background = isActive ? 'rgba(249,115,22,.12)' : 'var(--surf)';
    btns[b].style.borderColor = isActive ? 'var(--org)' : 'var(--b1)';
    btns[b].style.color = isActive ? 'var(--org)' : 'var(--txt2)';
  }
  var html = '';
  for (var i=0; i<FOOD_DB.length; i++) {
    if (FOOD_DB[i].cat !== cat) continue;
    var f = FOOD_DB[i];
    html += '<div onclick="addSingleFoodFromPhoto('+i+')" style="display:flex;align-items:center;gap:8px;padding:9px;border-radius:10px;margin-bottom:2px;background:var(--surf);border:1px solid var(--b1);cursor:pointer" onmouseover="this.style.borderColor=\'var(--org)\'" onmouseout="this.style.borderColor=\'var(--b1)\'">' +
      '<div style="flex:1"><div style="font-size:11px;font-weight:600">'+f.name+'</div>' +
      '<div style="font-size:9px;color:var(--txt3)">'+f.kcal+'kcal · P'+fmtN(f.protein)+'g C'+fmtN(f.carb)+'g F'+fmtN(f.fat)+'g</div></div>' +
      '<span style="font-size:16px;color:var(--org);font-weight:700">+</span></div>';
  }
  container.innerHTML = html;
}

function addSingleFoodFromPhoto(idx) {
  var f = FOOD_DB[idx];
  if (!f) return;
  var type = document.getElementById('meal-type') ? document.getElementById('meal-type').value : 'lunch';
  var now = new Date();
  var time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  DB.meals.today.push({
    id:'m'+Date.now(), name:f.name, kcal:f.kcal, protein:f.protein, carb:f.carb, fat:f.fat,
    fiber:f.fiber, vitB1:f.vitB1, vitC:f.vitC, calcium:f.calcium, iron:f.iron,
    time:time, type:type, source:'photo-select'
  });
  learnFromMeal(f, type);
  saveDB();
  toast('✅ '+f.name+' を追加','s');
  var badge = document.getElementById('photo-added-count');
  if (!badge) {
    var st = document.getElementById('photo-analysis-status');
    if (st) {
      var d = document.createElement('div');
      d.id = 'photo-added-count'; d.className = 'photo-added-badge';
      d.style.cssText = 'position:sticky;bottom:0;text-align:center;padding:8px;font-size:12px;font-weight:700;color:var(--teal);background:var(--surf2);border-top:1px solid var(--b1);margin-top:6px;border-radius:0 0 16px 16px';
      d.innerHTML = '✅ 1品目追加済み — <a href="javascript:void(0)" onclick="clearPhotoAnalysis();goTo(\'nutrition\')" style="color:var(--org);text-decoration:underline">完了</a>';
      st.appendChild(d);
    }
  } else {
    var cnt = parseInt(badge.textContent.match(/\d+/)) || 0;
    badge.innerHTML = '✅ '+(cnt+1)+'品目追加済み — <a href="javascript:void(0)" onclick="clearPhotoAnalysis();goTo(\'nutrition\')" style="color:var(--org);text-decoration:underline">完了</a>';
  }
}

function addMealSet(setIdx) {
  var set = MEAL_SETS[setIdx];
  if (!set) return;
  var type = document.getElementById('meal-type') ? document.getElementById('meal-type').value : 'lunch';
  var now = new Date();
  var time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  var added = 0;
  for (var i=0; i<set.items.length; i++) {
    var f = null;
    for (var j=0; j<FOOD_DB.length; j++) { if (FOOD_DB[j].name === set.items[i]) { f = FOOD_DB[j]; break; } }
    if (f) {
      DB.meals.today.push({ id:'m'+Date.now()+'_'+i, name:f.name, kcal:f.kcal, protein:f.protein, carb:f.carb, fat:f.fat,
        fiber:f.fiber, vitB1:f.vitB1, vitC:f.vitC, calcium:f.calcium, iron:f.iron, time:time, type:type, source:'photo-set' });
      learnFromMeal(f, type);
      added++;
    }
  }
  saveDB();
  toast('🍱 '+set.name.split('（')[0]+'（'+added+'品）を追加！','s');
  clearPhotoAnalysis();
  goTo('nutrition');
}

function addPhotoAIFoods() {
  var foods = window._photoState.foods;
  if (!foods || !foods.length) { toast('食品がありません','e'); return; }
  var type = document.getElementById('meal-type') ? document.getElementById('meal-type').value : 'lunch';
  var now = new Date();
  var time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  var added = 0;
  for (var i=0; i<foods.length; i++) {
    var chk = document.getElementById('pf-chk-'+i);
    if (chk && !chk.checked) continue;
    var f = foods[i];
    DB.meals.today.push({ id:'m'+Date.now()+'_'+i, name:f.name+(f.amount?' ('+f.amount+')':''),
      kcal:f.kcal, protein:f.protein, carb:f.carb, fat:f.fat,
      fiber:f.fiber, vitB1:0, vitC:f.vitC, calcium:f.calcium, iron:f.iron,
      time:time, type:type, source:'photo-ai' });
    learnFromMeal(f, type);
    added++;
  }
  if (!added) { toast('1つ以上チェックしてください','w'); return; }
  saveDB();
  window._photoState = { foods:null, imgDataUrl:null, analyzing:false, file:null };
  toast(added+'品目を追加！','s');
  goTo('nutrition');
}

function clearPhotoAnalysis() {
  window._photoState = { foods:null, imgDataUrl:null, analyzing:false, file:null };
  var el = document.getElementById('photo-analysis-status');
  if (el) { el.style.display = 'none'; el.innerHTML = ''; }
}

// ==================== TRAINING (REAL) ====================
// ==================== TRAINING SYSTEM (FIT PLACE inspired) ====================
const EXERCISE_DB = {
  chest: {name:'胸', emoji:'🫁', exercises:[
    {id:'bp',name:'ベンチプレス',kcalPerSet:8,type:'compound'},{id:'db-press',name:'ダンベルプレス',kcalPerSet:7,type:'compound'},
    {id:'incline-bp',name:'インクラインベンチプレス',kcalPerSet:8,type:'compound'},{id:'decline-bp',name:'デクラインベンチプレス',kcalPerSet:8,type:'compound'},
    {id:'chest-fly',name:'チェストフライ',kcalPerSet:6,type:'isolation'},{id:'cable-fly',name:'ケーブルフライ',kcalPerSet:6,type:'isolation'},
    {id:'incline-fly',name:'インクラインフライ',kcalPerSet:6,type:'isolation'},{id:'pushup',name:'腕立て伏せ',kcalPerSet:5,type:'bodyweight'},
    {id:'dips',name:'ディップス',kcalPerSet:7,type:'bodyweight'},{id:'pec-deck',name:'ペックデック',kcalPerSet:5,type:'machine'},
    {id:'smith-bp',name:'スミスベンチプレス',kcalPerSet:7,type:'machine'},{id:'closegrip-bp',name:'ナローベンチプレス',kcalPerSet:7,type:'compound'},
    {id:'floor-press',name:'フロアプレス',kcalPerSet:7,type:'compound'},{id:'landmine-press',name:'ランドマインプレス',kcalPerSet:6,type:'compound'},
  ]},
  back: {name:'背中', emoji:'🔙', exercises:[
    {id:'deadlift',name:'デッドリフト',kcalPerSet:12,type:'compound'},{id:'lat-pull',name:'ラットプルダウン',kcalPerSet:7,type:'compound'},
    {id:'row',name:'ベントオーバーロウ',kcalPerSet:8,type:'compound'},{id:'chinup',name:'懸垂（チンアップ）',kcalPerSet:8,type:'bodyweight'},
    {id:'pullup',name:'プルアップ（順手）',kcalPerSet:8,type:'bodyweight'},{id:'seated-row',name:'シーテッドロウ',kcalPerSet:7,type:'machine'},
    {id:'back-ext',name:'バックエクステンション',kcalPerSet:5,type:'isolation'},{id:'tbar-row',name:'Tバーロウ',kcalPerSet:8,type:'compound'},
    {id:'db-row',name:'ワンハンドダンベルロウ',kcalPerSet:7,type:'compound'},{id:'cable-row',name:'ケーブルロウ',kcalPerSet:6,type:'machine'},
    {id:'pendlay-row',name:'ペンドレーロウ',kcalPerSet:8,type:'compound'},{id:'straight-arm-pd',name:'ストレートアームプルダウン',kcalPerSet:5,type:'isolation'},
    {id:'rack-pull',name:'ラックプル',kcalPerSet:10,type:'compound'},{id:'good-morning',name:'グッドモーニング',kcalPerSet:7,type:'compound'},
    {id:'meadows-row',name:'メドウズロウ',kcalPerSet:7,type:'compound'},
  ]},
  legs: {name:'脚', emoji:'🦵', exercises:[
    {id:'squat',name:'スクワット',kcalPerSet:12,type:'compound'},{id:'front-squat',name:'フロントスクワット',kcalPerSet:11,type:'compound'},
    {id:'leg-press',name:'レッグプレス',kcalPerSet:9,type:'machine'},{id:'lunge',name:'ランジ',kcalPerSet:7,type:'compound'},
    {id:'bulgarian-split',name:'ブルガリアンスクワット',kcalPerSet:8,type:'compound'},{id:'leg-curl',name:'レッグカール',kcalPerSet:6,type:'isolation'},
    {id:'leg-ext',name:'レッグエクステンション',kcalPerSet:6,type:'isolation'},{id:'calf-raise',name:'カーフレイズ',kcalPerSet:5,type:'isolation'},
    {id:'rdl',name:'ルーマニアンデッドリフト',kcalPerSet:9,type:'compound'},{id:'hack-squat',name:'ハックスクワット',kcalPerSet:9,type:'machine'},
    {id:'hip-thrust',name:'ヒップスラスト',kcalPerSet:8,type:'compound'},{id:'goblet-squat',name:'ゴブレットスクワット',kcalPerSet:8,type:'compound'},
    {id:'box-squat',name:'ボックススクワット',kcalPerSet:10,type:'compound'},{id:'step-up',name:'ステップアップ',kcalPerSet:7,type:'compound'},
    {id:'sissy-squat',name:'シシースクワット',kcalPerSet:6,type:'isolation'},{id:'adductor',name:'アダクター',kcalPerSet:5,type:'machine'},
    {id:'abductor',name:'アブダクター',kcalPerSet:5,type:'machine'},{id:'seated-calf',name:'シーテッドカーフレイズ',kcalPerSet:5,type:'isolation'},
    {id:'walking-lunge',name:'ウォーキングランジ',kcalPerSet:8,type:'compound'},
  ]},
  shoulder: {name:'肩', emoji:'🏔️', exercises:[
    {id:'ohp',name:'オーバーヘッドプレス',kcalPerSet:8,type:'compound'},{id:'db-ohp',name:'ダンベルショルダープレス',kcalPerSet:7,type:'compound'},
    {id:'side-raise',name:'サイドレイズ',kcalPerSet:5,type:'isolation'},{id:'front-raise',name:'フロントレイズ',kcalPerSet:5,type:'isolation'},
    {id:'face-pull',name:'フェイスプル',kcalPerSet:5,type:'isolation'},{id:'shrug',name:'シュラッグ',kcalPerSet:6,type:'isolation'},
    {id:'arnold-press',name:'アーノルドプレス',kcalPerSet:7,type:'compound'},{id:'upright-row',name:'アップライトロウ',kcalPerSet:6,type:'compound'},
    {id:'rear-delt-fly',name:'リアデルトフライ',kcalPerSet:5,type:'isolation'},{id:'cable-lateral',name:'ケーブルサイドレイズ',kcalPerSet:5,type:'isolation'},
    {id:'push-press',name:'プッシュプレス',kcalPerSet:9,type:'compound'},{id:'lu-raise',name:'Luレイズ',kcalPerSet:5,type:'isolation'},
    {id:'landmine-lat',name:'ランドマインラテラル',kcalPerSet:6,type:'compound'},
  ]},
  arms: {name:'腕', emoji:'💪', exercises:[
    {id:'bicep-curl',name:'バイセップカール',kcalPerSet:5,type:'isolation'},{id:'hammer-curl',name:'ハンマーカール',kcalPerSet:5,type:'isolation'},
    {id:'tricep-ext',name:'トライセップエクステンション',kcalPerSet:5,type:'isolation'},{id:'tricep-push',name:'トライセッププッシュダウン',kcalPerSet:5,type:'isolation'},
    {id:'preacher-curl',name:'プリーチャーカール',kcalPerSet:5,type:'isolation'},{id:'incline-curl',name:'インクラインカール',kcalPerSet:5,type:'isolation'},
    {id:'concentration-curl',name:'コンセントレーションカール',kcalPerSet:4,type:'isolation'},{id:'ez-curl',name:'EZバーカール',kcalPerSet:5,type:'isolation'},
    {id:'skull-crusher',name:'スカルクラッシャー',kcalPerSet:5,type:'isolation'},{id:'overhead-tri',name:'オーバーヘッドトライセップ',kcalPerSet:5,type:'isolation'},
    {id:'kickback',name:'キックバック',kcalPerSet:4,type:'isolation'},{id:'cable-curl',name:'ケーブルカール',kcalPerSet:5,type:'isolation'},
    {id:'reverse-curl',name:'リバースカール',kcalPerSet:4,type:'isolation'},{id:'wrist-curl',name:'リストカール',kcalPerSet:3,type:'isolation'},
  ]},
  core: {name:'体幹', emoji:'🧘', exercises:[
    {id:'plank',name:'プランク',kcalPerSet:4,type:'bodyweight'},{id:'crunch',name:'クランチ',kcalPerSet:4,type:'bodyweight'},
    {id:'leg-raise',name:'レッグレイズ',kcalPerSet:5,type:'bodyweight'},{id:'russian-twist',name:'ロシアンツイスト',kcalPerSet:5,type:'bodyweight'},
    {id:'ab-wheel',name:'腹筋ローラー',kcalPerSet:6,type:'bodyweight'},{id:'dead-bug',name:'デッドバグ',kcalPerSet:4,type:'bodyweight'},
    {id:'pallof-press',name:'パロフプレス',kcalPerSet:4,type:'cable'},{id:'hanging-raise',name:'ハンギングレッグレイズ',kcalPerSet:6,type:'bodyweight'},
    {id:'cable-crunch',name:'ケーブルクランチ',kcalPerSet:5,type:'cable'},{id:'side-plank',name:'サイドプランク',kcalPerSet:4,type:'bodyweight'},
    {id:'woodchop',name:'ウッドチョップ',kcalPerSet:5,type:'cable'},{id:'dragon-flag',name:'ドラゴンフラッグ',kcalPerSet:7,type:'bodyweight'},
    {id:'l-sit',name:'Lシット',kcalPerSet:5,type:'bodyweight'},{id:'bird-dog',name:'バードドッグ',kcalPerSet:3,type:'bodyweight'},
  ]},
  glutes: {name:'臀部', emoji:'🍑', exercises:[
    {id:'hip-thrust2',name:'バーベルヒップスラスト',kcalPerSet:8,type:'compound'},{id:'glute-bridge',name:'グルートブリッジ',kcalPerSet:5,type:'bodyweight'},
    {id:'cable-kickback',name:'ケーブルキックバック',kcalPerSet:5,type:'isolation'},{id:'sumo-dl',name:'スモウデッドリフト',kcalPerSet:10,type:'compound'},
    {id:'fire-hydrant',name:'ファイヤーハイドラント',kcalPerSet:4,type:'bodyweight'},{id:'frog-pump',name:'フロッグパンプ',kcalPerSet:4,type:'bodyweight'},
    {id:'donkey-kick',name:'ドンキーキック',kcalPerSet:4,type:'bodyweight'},{id:'single-leg-rdl',name:'片足RDL',kcalPerSet:7,type:'compound'},
  ]},
  plyometric: {name:'プライオ', emoji:'⚡', exercises:[
    {id:'box-jump',name:'ボックスジャンプ',kcalPerSet:8,type:'explosive'},{id:'depth-jump',name:'デプスジャンプ',kcalPerSet:9,type:'explosive'},
    {id:'broad-jump',name:'立ち幅跳び',kcalPerSet:7,type:'explosive'},{id:'squat-jump',name:'ジャンプスクワット',kcalPerSet:8,type:'explosive'},
    {id:'split-jump',name:'スプリットジャンプ',kcalPerSet:7,type:'explosive'},{id:'tuck-jump',name:'タックジャンプ',kcalPerSet:8,type:'explosive'},
    {id:'lateral-bound',name:'ラテラルバウンド',kcalPerSet:7,type:'explosive'},{id:'single-hop',name:'シングルレッグホップ',kcalPerSet:6,type:'explosive'},
    {id:'clap-pushup',name:'クラッピングプッシュアップ',kcalPerSet:7,type:'explosive'},
  ]},
  olympic: {name:'オリンピック', emoji:'🏋️', exercises:[
    {id:'clean',name:'クリーン',kcalPerSet:12,type:'olympic'},{id:'snatch',name:'スナッチ',kcalPerSet:12,type:'olympic'},
    {id:'clean-jerk',name:'クリーン&ジャーク',kcalPerSet:14,type:'olympic'},{id:'power-clean',name:'パワークリーン',kcalPerSet:11,type:'olympic'},
    {id:'hang-clean',name:'ハングクリーン',kcalPerSet:10,type:'olympic'},{id:'push-jerk',name:'プッシュジャーク',kcalPerSet:10,type:'olympic'},
    {id:'clean-pull',name:'クリーンプル',kcalPerSet:9,type:'olympic'},{id:'snatch-pull',name:'スナッチプル',kcalPerSet:9,type:'olympic'},
    {id:'overhead-squat',name:'オーバーヘッドスクワット',kcalPerSet:10,type:'olympic'},
  ]},
  cardio: {name:'有酸素', emoji:'🏃', exercises:[
    {id:'run',name:'ランニング',kcalPerSet:12,type:'cardio'},{id:'bike',name:'エアロバイク',kcalPerSet:8,type:'cardio'},
    {id:'jump-rope',name:'縄跳び',kcalPerSet:10,type:'cardio'},{id:'burpee',name:'バーピー',kcalPerSet:9,type:'cardio'},
    {id:'rowing',name:'ローイングマシン',kcalPerSet:10,type:'cardio'},{id:'sprint',name:'スプリント（全力疾走）',kcalPerSet:14,type:'cardio'},
    {id:'swim',name:'水泳',kcalPerSet:10,type:'cardio'},{id:'stairmaster',name:'ステアマスター',kcalPerSet:9,type:'cardio'},
    {id:'assault-bike',name:'アサルトバイク',kcalPerSet:12,type:'cardio'},{id:'sled-push',name:'スレッドプッシュ',kcalPerSet:11,type:'cardio'},
    {id:'battle-rope',name:'バトルロープ',kcalPerSet:10,type:'cardio'},{id:'mountain-climber',name:'マウンテンクライマー',kcalPerSet:8,type:'cardio'},
    {id:'hiit-interval',name:'HIITインターバル',kcalPerSet:13,type:'cardio'},
  ]},
  mobility: {name:'モビリティ', emoji:'🧘‍♂️', exercises:[
    {id:'foam-roll',name:'フォームローラー',kcalPerSet:2,type:'recovery'},{id:'hip-opener',name:'ヒップオープナー',kcalPerSet:2,type:'mobility'},
    {id:'ankle-mob',name:'アンクルモビリティ',kcalPerSet:2,type:'mobility'},{id:'shoulder-mob',name:'ショルダーモビリティ',kcalPerSet:2,type:'mobility'},
    {id:'thoracic-ext',name:'胸椎伸展',kcalPerSet:2,type:'mobility'},{id:'pigeon-stretch',name:'ピジョンストレッチ',kcalPerSet:2,type:'mobility'},
    {id:'90-90-stretch',name:'90/90ストレッチ',kcalPerSet:2,type:'mobility'},{id:'couch-stretch',name:'カウチストレッチ',kcalPerSet:2,type:'mobility'},
    {id:'cat-cow',name:'キャットカウ',kcalPerSet:2,type:'mobility'},{id:'world-greatest',name:'ワールドグレイテスト',kcalPerSet:3,type:'mobility'},
    {id:'band-pull-apart',name:'バンドプルアパート',kcalPerSet:3,type:'mobility'},
  ]},
  sport: {name:'スポーツ', emoji:'⚽', exercises:[
    {id:'dribble',name:'ドリブル練習',kcalPerSet:6,type:'skill'},{id:'shoot',name:'シュート練習',kcalPerSet:5,type:'skill'},
    {id:'pass',name:'パス練習',kcalPerSet:5,type:'skill'},{id:'mini-game',name:'ミニゲーム',kcalPerSet:12,type:'skill'},
    {id:'warmup',name:'ウォームアップ',kcalPerSet:4,type:'warmup'},{id:'cooldown',name:'クールダウン',kcalPerSet:3,type:'recovery'},
    {id:'agility-ladder',name:'アジリティラダー',kcalPerSet:7,type:'skill'},{id:'cone-drill',name:'コーンドリル',kcalPerSet:7,type:'skill'},
    {id:'sprint-drill',name:'スプリントドリル',kcalPerSet:9,type:'skill'},{id:'defensive-drill',name:'ディフェンス練習',kcalPerSet:6,type:'skill'},
    {id:'heading',name:'ヘディング練習',kcalPerSet:4,type:'skill'},{id:'crossing',name:'クロス練習',kcalPerSet:5,type:'skill'},
    {id:'throw-in',name:'スローイン練習',kcalPerSet:4,type:'skill'},{id:'penalty',name:'PK練習',kcalPerSet:4,type:'skill'},
    {id:'set-piece',name:'セットプレー練習',kcalPerSet:5,type:'skill'},{id:'tactical-drill',name:'戦術練習',kcalPerSet:6,type:'skill'},
  ]},
};

// ===== PROGRAM TEMPLATES (エリートプログラム) =====
const PROGRAM_TEMPLATES = [
  {id:'ppl',name:'Push / Pull / Legs',desc:'上級者向け6日分割',color:'#ff6b2b',days:[
    {day:'Day1 Push',exercises:[{exId:'bp',sets:4,reps:'6-8'},{exId:'incline-bp',sets:3,reps:'8-10'},{exId:'db-ohp',sets:3,reps:'8-10'},{exId:'cable-fly',sets:3,reps:'12-15'},{exId:'side-raise',sets:4,reps:'12-15'},{exId:'tricep-push',sets:3,reps:'10-12'}]},
    {day:'Day2 Pull',exercises:[{exId:'deadlift',sets:3,reps:'5'},{exId:'pullup',sets:4,reps:'6-10'},{exId:'db-row',sets:3,reps:'8-10'},{exId:'face-pull',sets:3,reps:'15-20'},{exId:'ez-curl',sets:3,reps:'10-12'},{exId:'hammer-curl',sets:3,reps:'10-12'}]},
    {day:'Day3 Legs',exercises:[{exId:'squat',sets:4,reps:'6-8'},{exId:'rdl',sets:3,reps:'8-10'},{exId:'leg-press',sets:3,reps:'10-12'},{exId:'leg-curl',sets:3,reps:'10-12'},{exId:'calf-raise',sets:4,reps:'12-15'},{exId:'hanging-raise',sets:3,reps:'10-15'}]},
  ]},
  {id:'ul',name:'Upper / Lower',desc:'中級者向け4日分割',color:'#3b82f6',days:[
    {day:'Day1 Upper',exercises:[{exId:'bp',sets:4,reps:'6-8'},{exId:'row',sets:4,reps:'6-8'},{exId:'ohp',sets:3,reps:'8-10'},{exId:'lat-pull',sets:3,reps:'8-10'},{exId:'bicep-curl',sets:2,reps:'10-12'},{exId:'skull-crusher',sets:2,reps:'10-12'}]},
    {day:'Day2 Lower',exercises:[{exId:'squat',sets:4,reps:'6-8'},{exId:'rdl',sets:3,reps:'8-10'},{exId:'bulgarian-split',sets:3,reps:'10-12'},{exId:'leg-curl',sets:3,reps:'10-12'},{exId:'calf-raise',sets:3,reps:'12-15'},{exId:'plank',sets:3,reps:'60秒'}]},
  ]},
  {id:'ss5x5',name:'StrongLifts 5×5',desc:'筋力特化・初中級者向け',color:'#00cfaa',days:[
    {day:'Day A',exercises:[{exId:'squat',sets:5,reps:'5'},{exId:'bp',sets:5,reps:'5'},{exId:'row',sets:5,reps:'5'}]},
    {day:'Day B',exercises:[{exId:'squat',sets:5,reps:'5'},{exId:'ohp',sets:5,reps:'5'},{exId:'deadlift',sets:1,reps:'5'}]},
  ]},
  {id:'athlete',name:'アスリートパフォーマンス',desc:'爆発力・敏捷性・持久力の総合',color:'#a855f7',days:[
    {day:'Day1 パワー',exercises:[{exId:'power-clean',sets:5,reps:'3'},{exId:'squat',sets:4,reps:'5'},{exId:'push-press',sets:4,reps:'5'},{exId:'box-jump',sets:4,reps:'5'},{exId:'plank',sets:3,reps:'45秒'}]},
    {day:'Day2 スピード&アジリティ',exercises:[{exId:'sprint',sets:8,reps:'30m'},{exId:'agility-ladder',sets:4,reps:'2往復'},{exId:'lateral-bound',sets:4,reps:'6'},{exId:'cone-drill',sets:4,reps:'3周'},{exId:'hip-opener',sets:2,reps:'60秒'}]},
    {day:'Day3 筋力',exercises:[{exId:'deadlift',sets:4,reps:'5'},{exId:'bp',sets:4,reps:'6'},{exId:'pullup',sets:4,reps:'MAX'},{exId:'bulgarian-split',sets:3,reps:'8'},{exId:'hanging-raise',sets:3,reps:'10'}]},
    {day:'Day4 持久力&回復',exercises:[{exId:'run',sets:1,reps:'30分'},{exId:'assault-bike',sets:5,reps:'30秒全力'},{exId:'battle-rope',sets:4,reps:'30秒'},{exId:'foam-roll',sets:1,reps:'10分'},{exId:'world-greatest',sets:2,reps:'5'}]},
  ]},
  {id:'hyper',name:'ハイパートロフィー',desc:'筋肥大特化・上級者向け',color:'#ef4444',days:[
    {day:'Day1 胸&三頭',exercises:[{exId:'bp',sets:4,reps:'8-10'},{exId:'incline-bp',sets:4,reps:'8-10'},{exId:'cable-fly',sets:3,reps:'12-15'},{exId:'pec-deck',sets:3,reps:'12-15'},{exId:'skull-crusher',sets:3,reps:'10-12'},{exId:'tricep-push',sets:3,reps:'12-15'}]},
    {day:'Day2 背中&二頭',exercises:[{exId:'pullup',sets:4,reps:'8-10'},{exId:'db-row',sets:4,reps:'8-10'},{exId:'seated-row',sets:3,reps:'10-12'},{exId:'straight-arm-pd',sets:3,reps:'12-15'},{exId:'ez-curl',sets:3,reps:'10-12'},{exId:'incline-curl',sets:3,reps:'12-15'}]},
    {day:'Day3 脚&臀部',exercises:[{exId:'squat',sets:4,reps:'8-10'},{exId:'hack-squat',sets:3,reps:'10-12'},{exId:'rdl',sets:3,reps:'10-12'},{exId:'leg-ext',sets:3,reps:'12-15'},{exId:'leg-curl',sets:3,reps:'12-15'},{exId:'hip-thrust2',sets:3,reps:'10-12'}]},
    {day:'Day4 肩&腕&体幹',exercises:[{exId:'db-ohp',sets:4,reps:'8-10'},{exId:'side-raise',sets:4,reps:'12-15'},{exId:'rear-delt-fly',sets:3,reps:'12-15'},{exId:'bicep-curl',sets:3,reps:'10-12'},{exId:'overhead-tri',sets:3,reps:'10-12'},{exId:'cable-crunch',sets:3,reps:'15-20'}]},
  ]},
  {id:'oly',name:'オリンピックリフティング',desc:'ウェイトリフティング競技者向け',color:'#eab308',days:[
    {day:'Day1 スナッチ日',exercises:[{exId:'snatch',sets:6,reps:'2'},{exId:'snatch-pull',sets:3,reps:'3'},{exId:'overhead-squat',sets:3,reps:'3'},{exId:'front-squat',sets:3,reps:'5'}]},
    {day:'Day2 C&J日',exercises:[{exId:'clean-jerk',sets:6,reps:'1+1'},{exId:'clean-pull',sets:3,reps:'3'},{exId:'push-jerk',sets:3,reps:'3'},{exId:'squat',sets:3,reps:'5'}]},
  ]},
];

// Legacy compatibility
// ── プロ向けトレーニングテンプレート ──
const WORKOUTS=[
  {id:'w1',day:'Day A：Push',type:'プッシュ（胸/肩/三頭）',intensity:85,color:'#ff6b2b',split:'PPL',exercises:[
    {name:'ベンチプレス',sets:4,reps:6,unit:'回',rest:180,note:'メイン種目 RPE8'},
    {name:'インクラインダンベルプレス',sets:3,reps:10,unit:'回',rest:90},
    {name:'オーバーヘッドプレス',sets:3,reps:8,unit:'回',rest:120},
    {name:'サイドレイズ',sets:4,reps:15,unit:'回',rest:60},
    {name:'トライセッププッシュダウン',sets:3,reps:12,unit:'回',rest:60},
    {name:'ディップス',sets:2,reps:'限界',unit:'回',rest:90},
  ]},
  {id:'w2',day:'Day B：Pull',type:'プル（背中/二頭）',intensity:85,color:'#3b82f6',split:'PPL',exercises:[
    {name:'デッドリフト',sets:3,reps:5,unit:'回',rest:240,note:'メイン種目 RPE8'},
    {name:'懸垂（チンアップ）',sets:4,reps:8,unit:'回',rest:120},
    {name:'ベントオーバーロウ',sets:3,reps:10,unit:'回',rest:90},
    {name:'フェイスプル',sets:3,reps:15,unit:'回',rest:60},
    {name:'バイセップカール',sets:3,reps:12,unit:'回',rest:60},
    {name:'ハンマーカール',sets:2,reps:12,unit:'回',rest:60},
  ]},
  {id:'w3',day:'Day C：Legs',type:'レッグ（脚/臀部）',intensity:90,color:'#00cfaa',split:'PPL',exercises:[
    {name:'スクワット',sets:4,reps:6,unit:'回',rest:240,note:'メイン種目 RPE8'},
    {name:'ルーマニアンデッドリフト',sets:3,reps:10,unit:'回',rest:120},
    {name:'ブルガリアンスクワット',sets:3,reps:10,unit:'回',rest:90},
    {name:'レッグカール',sets:3,reps:12,unit:'回',rest:60},
    {name:'カーフレイズ',sets:4,reps:15,unit:'回',rest:60},
    {name:'ヒップスラスト',sets:3,reps:10,unit:'回',rest:90},
  ]},
  {id:'w4',day:'Day 1：Upper',type:'上半身（コンパウンド重視）',intensity:80,color:'#a855f7',split:'UL',exercises:[
    {name:'ベンチプレス',sets:4,reps:6,unit:'回',rest:180},
    {name:'ベントオーバーロウ',sets:4,reps:8,unit:'回',rest:120},
    {name:'ダンベルショルダープレス',sets:3,reps:10,unit:'回',rest:90},
    {name:'ラットプルダウン',sets:3,reps:10,unit:'回',rest:90},
    {name:'サイドレイズ',sets:3,reps:15,unit:'回',rest:60},
    {name:'トライセップエクステンション',sets:2,reps:12,unit:'回',rest:60},
    {name:'バイセップカール',sets:2,reps:12,unit:'回',rest:60},
  ]},
  {id:'w5',day:'Day 2：Lower',type:'下半身（パワー＋ハム）',intensity:85,color:'#ec4899',split:'UL',exercises:[
    {name:'スクワット',sets:4,reps:5,unit:'回',rest:240},
    {name:'ルーマニアンデッドリフト',sets:3,reps:8,unit:'回',rest:120},
    {name:'レッグプレス',sets:3,reps:12,unit:'回',rest:90},
    {name:'レッグカール',sets:3,reps:12,unit:'回',rest:60},
    {name:'カーフレイズ',sets:4,reps:15,unit:'回',rest:60},
    {name:'プランク',sets:3,reps:60,unit:'秒',rest:45},
  ]},
  {id:'w6',day:'スポーツ特化',type:'SAQ＋フィジカル',intensity:90,color:'#f59e0b',split:'Sport',exercises:[
    {name:'ウォームアップ',sets:1,reps:10,unit:'分',rest:0},
    {name:'アジリティラダー',sets:4,reps:2,unit:'セット',rest:60,note:'3パターン'},
    {name:'ボックスジャンプ',sets:4,reps:5,unit:'回',rest:90},
    {name:'スプリント（全力疾走）',sets:6,reps:30,unit:'m',rest:120},
    {name:'ラテラルバウンド',sets:3,reps:8,unit:'回',rest:60},
    {name:'コーンドリル',sets:4,reps:1,unit:'セット',rest:90},
    {name:'クールダウン',sets:1,reps:10,unit:'分',rest:0},
  ]},
  {id:'w7',day:'リカバリー',type:'モビリティ＋有酸素',intensity:40,color:'#06b6d4',split:'Recovery',exercises:[
    {name:'フォームローラー',sets:1,reps:10,unit:'分',rest:0},
    {name:'ヒップオープナー',sets:2,reps:30,unit:'秒',rest:0},
    {name:'ショルダーモビリティ',sets:2,reps:30,unit:'秒',rest:0},
    {name:'ワールドグレイテスト',sets:2,reps:5,unit:'回',rest:0},
    {name:'エアロバイク（低強度）',sets:1,reps:20,unit:'分',rest:0,note:'心拍120-140'},
    {name:'ピジョンストレッチ',sets:2,reps:30,unit:'秒',rest:0},
  ]},
];

let timerInterval=null,timerSec=0,timerRunning=false,activeRestSec=0;
// Session state
window._trSession = window._trSession || {active:false,exercises:[],startTime:null,elapsed:0};

