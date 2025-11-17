// src/data/team.ts

export interface TeamContact {
  name: string;
  role: string;         // e.g. "Regional Manager" or "Founder"
  region?: string;      // for regional managers
  location?: string;
  imageSrc?: string;    // "/images/team/..."
  bio?: string;         // optional short bio for flip card
  linkedin?: string;    // LinkedIn profile URL

  // obfuscated contact parts (assembled only when revealed)
  emailUser?: string;   // e.g. "gabriel"
  emailDomain?: string; // e.g. "petromac.co.nz"
}

// === Regional Managers (6 total) ===
export const regionalManagers: TeamContact[] = [
  {
    name: "Gabriel Tschikof",
    role: "Regional Manager",
    region: "North America",
    location: "Houston, USA",
    imageSrc: "/images/team/gabriel-tschikof.png",
    emailUser: "gabriel",
    emailDomain: "petromac.co.nz",
    bio: "Gabriel began his career with Schlumberger in 2002, delivering wireline services across UAE, Oman, Yemen, and Thailand. He advanced through roles as Field Engineer, Support Center Engineer, and Instructor, building a solid foundation in wireline operations. Later management and sales roles broadened his client perspective. As North America Regional Manager, Gabriel helps clients solve challenges with Petromac's technology and proven results.",
    linkedin: "https://www.linkedin.com/in/gabriel-tschikof-8509811a5/",
  },
  {
    name: "Bernardo Espinola",
    role: "Regional Manager",
    region: "Latin America",
    location: "Mexico",
    imageSrc: "/images/team/bernardo-espinola.png",
    emailUser: "bernardo",
    emailDomain: "petromac.co.nz",
    bio: "Bernardo joined Schlumberger in 2001 and later held senior management roles across Latin America and the Middle East, leading Operations, Maintenance, Quality & Safety, and Resource Planning. Since 2018 he has led Petromac’s rapid growth in Latin America.",
    linkedin: "https://www.linkedin.com/in/bernardoespinola",
  },
  {
    name: "Solomon Kadiri",
    role: "Regional Manager",
    region: "Sub-Saharan Africa",
    location: "Nigeria",
    imageSrc: "/images/team/solomon-kadiri.png",
    emailUser: "solomon",
    emailDomain: "petromac.co.nz",
    bio: "Solomon began with Schlumberger in 2002, working in land, swamp, and deepwater wireline operations across Malaysia, Pakistan, and West Africa. With over 14 years of operations and management experience, he joined Petromac in 2020 to drive growth in Sub-Saharan Africa.",
    linkedin: "https://www.linkedin.com/in/solomonkadiri",
  },
  {
    name: "Galal Eldaw",
    role: "Regional Manager",
    region: "Middle East & North Africa",
    location: "Bahrain",
    imageSrc: "/images/team/galal-eldaw.png",
    emailUser: "galal",
    emailDomain: "petromac.co.nz",
    bio: "Galal brings over 15 years of wireline and slickline experience with Schlumberger across Africa, Asia, and the Middle East. After technical and operations leadership roles, he joined Petromac to continue building customer value and results in the MENA region.",
    linkedin: "https://www.linkedin.com/in/galaleldaw",
  },
  {
    name: "Jee Kwan Ng",
    role: "Regional Manager",
    region: "Asia Pacific",
    location: "",
    imageSrc: "/images/team/jee-kwan-ng.png",
    emailUser: "jeekwan",
    emailDomain: "petromac.co.nz",
    bio: "Jee Kwan began as a Wireline Engineer in Norway in 2007, later operating in Angola and the UK with a focus on Deepwater High-Tech Wireline. He also held technical coach and operations manager roles. At Petromac, he grows Asia Pacific by delivering the benefits of advanced conveyance systems.",
    linkedin: "https://www.linkedin.com/in/jeekwanng",
  },
  {
    name: "Javier Peyriere",
    role: "Regional Manager",
    region: "Europe & CIS",
    location: "",
    imageSrc: "/images/team/javier-peyriere.png",
    emailUser: "javier",
    emailDomain: "petromac.co.nz",
    bio: "Javier manages Petromac's activities across Europe and the CIS, supporting operators with tailored solutions and regional expertise.",
    linkedin: "https://www.linkedin.com/in/javier-peyriere",
  },
];

// === HQ / Global Team ===
export const hqTeam: TeamContact[] = [
  {
    name: "Stephen McCormick",
    role: "Founder",
    location: "New Zealand",
    imageSrc: "/images/team/stephen-mccormick.png",
    emailUser: "stephen",
    emailDomain: "petromac.co.nz",
    bio: "Steve brings over 40 years of wireline experience, starting with Schlumberger in 1978. After roles as field engineer, log analyst, and consultant, he founded Petromac in 2011 to tackle persistent wireline challenges. His engineering and petrophysics background drives the innovation behind Petromac’s solutions.",
    linkedin: "https://www.linkedin.com/in/stephenmccormicknz",
  },
  {
    name: "Martin Leonard",
    role: "General Manager",
    location: "United Kingdom",
    imageSrc: "/images/team/martin-leonard.png",
    emailUser: "martin",
    emailDomain: "petromac.co.nz",
    bio: "Martin spent 20+ years with Schlumberger, including as Wireline Conveyance Product Champion, where he advanced solutions for complex conveyance challenges. Now as Petromac’s General Manager, he combines technical leadership with strategy and operations.",
    linkedin: "https://www.linkedin.com/in/martin-leonard",
  },
  {
    name: "Rajesh Thatha",
    role: "Global Business Development Manager",
    location: "Italy",
    imageSrc: "/images/team/rajesh-thatha.png",
    emailUser: "rajesh",
    emailDomain: "petromac.co.nz",
    bio: "Rajesh began his career with Schlumberger in 2003, holding roles across India, West Africa, Norway, and the Middle East in operations, sales, and quality. Since joining Petromac in 2017, he has expanded its global reach with a focus on long-term client partnerships.",
    linkedin: "https://www.linkedin.com/in/rthatha",
  },
  {
    name: "Rolando Velasco",
    role: "Head of Operations",
    location: "New Zealand",
    imageSrc: "/images/team/rolando-velasco.png",
    emailUser: "rolando",
    emailDomain: "petromac.co.nz",
    bio: "Rolando brings 14+ years of Schlumberger experience, from field engineering across South America to deepwater projects in Trinidad and Tobago. At Petromac he leads operations with a focus on quality and process optimization.",
    linkedin: "https://www.linkedin.com/in/velascorolando",
  },
  {
    name: "Craig Rothwell",
    role: "Manager, Legal & IP",
    location: "New Zealand",
    imageSrc: "/images/team/craig-rothwell.png",
    emailUser: "craig",
    emailDomain: "petromac.co.nz",
    bio: "Craig combines 10 years of engineering experience with 12+ years as a patent attorney. At Petromac he manages global IP and legal matters, protecting and growing the company’s innovations.",
    linkedin: "https://www.linkedin.com/in/craig-rothwell-a880814/",
  },
  {
    name: "Bruce Forrest",
    role: "Field Deployment Specialist",
    location: "New Zealand",
    imageSrc: "/images/team/bruce-forrest.png",
    emailUser: "bruce",
    emailDomain: "petromac.co.nz",
    bio: "Bruce has nearly four decades of wireline experience in Australia and New Zealand, known for uncompromising standards and deep operational expertise. At Petromac he supports critical deployments with hands-on knowledge.",
    linkedin: "https://www.linkedin.com/in/bruce-forrest-25402b36/",
  },
  {
    name: "Michael Bird",
    role: "Head of Maintenance",
    location: "New Zealand",
    imageSrc: "/images/team/mike-bird.png",
    emailUser: "mike",
    emailDomain: "petromac.co.nz",
    bio: "With 20+ years of engineering experience, Mike joined Petromac in 2021. From equipment build to maintenance leadership, he now drives reliability, process efficiency, and training as Head of Maintenance.",
    linkedin: "https://www.linkedin.com/in/michael-bird-862274273/",
  },
];
