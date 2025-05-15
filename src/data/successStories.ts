export interface SuccessStory {
  title: string;
  system: string;
  region: string;
  country: string;
  countryLat: number;
  countryLon: number;
  link: string;
}

export const successStories: SuccessStory[] = [
  {
    title: "CP-12 Deployed in Oman",
    system: "Focus-OH",
    region: "MENA",
    country: "Oman",
    countryLat: 21.0,
    countryLon: 57.0,
    link: "/data/successstories/cp12-oman.pdf"
  },
  {
    title: "Thor Used in Saudi Arabia",
    system: "Thor",
    region: "MENA",
    country: "Saudi Arabia",
    countryLat: 24.0,
    countryLon: 45.0,
    link: "/data/successstories/thor-saudi.pdf"
  },
  {
    title: "TTB-S75 in Argentina",
    system: "Wireline Express",
    region: "LAM",
    country: "Argentina",
    countryLat: -38.4,
    countryLon: -63.6,
    link: "/data/successstories/ttbs75-argentina.pdf"
  }
];