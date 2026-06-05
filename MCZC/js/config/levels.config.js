/** 差异仅在右图（镜像侧）渲染，左图为原图 */
const LEVELS = [
  {
    id: 1,
    name: '午后茶歇',
    desc: '阳光露台上的悠闲时光',
    image: 'images/scene_cafe.png',
    accent: '#FF8A65',
    accentDark: '#E64A19',
    differences: [
      { id: 1, x: 0.73, y: 0.32, r: 0.05, kind: 'icon', emoji: '🦋', size: 22 },
      { id: 2, x: 0.48, y: 0.58, r: 0.045, kind: 'patch', color: '#C8A882', w: 0.08, h: 0.06 },
      { id: 3, x: 0.22, y: 0.28, r: 0.04, kind: 'icon', emoji: '🎈', size: 26 },
      { id: 4, x: 0.58, y: 0.52, r: 0.042, kind: 'tint', color: 'rgba(66,133,244,0.55)', w: 0.09, h: 0.08 },
      { id: 5, x: 0.14, y: 0.46, r: 0.038, kind: 'icon', emoji: '🌼', size: 20 },
    ],
  },
  {
    id: 2,
    name: '星空露营',
    desc: '篝火与萤火虫的夜晚',
    image: 'images/scene_camp.png',
    accent: '#7E57C2',
    accentDark: '#4527A0',
    differences: [
      { id: 1, x: 0.18, y: 0.14, r: 0.04, kind: 'icon', emoji: '🌙', size: 24 },
      { id: 2, x: 0.52, y: 0.1, r: 0.045, kind: 'patch', color: '#1A237E', w: 0.1, h: 0.07 },
      { id: 3, x: 0.78, y: 0.68, r: 0.042, kind: 'icon', emoji: '🐰', size: 22 },
      { id: 4, x: 0.42, y: 0.62, r: 0.05, kind: 'tint', color: 'rgba(255,112,67,0.65)', w: 0.1, h: 0.09 },
      { id: 5, x: 0.34, y: 0.38, r: 0.038, kind: 'icon', emoji: '🚩', size: 20 },
    ],
  },
  {
    id: 3,
    name: '古巷记忆',
    desc: '灯笼照亮的旧时光',
    image: 'images/scene_alley.png',
    accent: '#EF5350',
    accentDark: '#C62828',
    differences: [
      { id: 1, x: 0.26, y: 0.28, r: 0.042, kind: 'patch', color: '#4E342E', w: 0.07, h: 0.09 },
      { id: 2, x: 0.62, y: 0.52, r: 0.04, kind: 'icon', emoji: '🐱', size: 22 },
      { id: 3, x: 0.44, y: 0.42, r: 0.045, kind: 'tint', color: 'rgba(229,57,53,0.5)', w: 0.08, h: 0.12 },
      { id: 4, x: 0.82, y: 0.62, r: 0.038, kind: 'icon', emoji: '🪴', size: 24 },
      { id: 5, x: 0.5, y: 0.72, r: 0.04, kind: 'patch', color: '#9E9E9E', w: 0.09, h: 0.05 },
    ],
  },
];

export default LEVELS;

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}
