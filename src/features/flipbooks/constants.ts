export const FLIPBOOK_KEYS = {
  successStories: 'success-stories',
  catalog: 'catalog',
} as const;

export type FlipbookKey = typeof FLIPBOOK_KEYS[keyof typeof FLIPBOOK_KEYS];

export function getFlipbookBasePath(docKey: FlipbookKey): string {
  return `/flipbooks/${docKey}`;
}
