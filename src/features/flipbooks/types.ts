export type FlipbookManifest = {
  docKey: string;
  title: string;
  pageCount: number;
  pageDigits: number;
  pageExtension: 'jpg' | 'jpeg' | 'png' | 'webp';
  pagesPath: string;
  thumbsPath?: string | null;
  sourcePdf: string;
  updatedAt?: string;
};
