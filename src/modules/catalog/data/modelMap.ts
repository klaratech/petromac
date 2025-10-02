export type ProductKey = 'focus' | 'wirelineexpress' | 'thor';

export const MODEL_MAP: Record<ProductKey, { name: string; file: string }[]> = {
  focus: [
    { name: 'CP-12', file: '/models/cp12.glb?v=20240509' },
    { name: 'CP-8', file: '/models/cp8.glb?v=20240509' },
    { name: 'Helix', file: '/models/helix.glb?v=20240509' },
  ],
  wirelineexpress: [
    { name: 'TTB-S75', file: '/models/ttbs75.glb?v=20240509' },
    { name: 'Pathfinder', file: '/models/pathfinderht.glb?v=20240509' },
  ],
  thor: [
    { name: 'Thor', file: '/models/thor.glb?v=20240509' },
  ],
};