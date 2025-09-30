import TeamCard from "@/components/public/TeamCard";

// Global Leadership Team
const globalTeam = [
  {
    name: "Stephen McCormick",
    title: "Chief Executive Officer",
    email: "steve@petromac.co.nz",
    phone: "+64 (9) 555-0100",
    bio: "Stephen brings over 25 years of experience in the oil and gas industry. He has led Petromac's strategic growth initiatives and oversees all major operations. His expertise in wellbore intervention technologies has been instrumental in developing innovative solutions for complex drilling challenges.",
    image: "/images/team/stephen-mccormick.jpg"
  },
  {
    name: "Martin Leonard",
    title: "Chief Technology Officer",
    email: "martin@petromac.co.nz",
    phone: "+64 (9) 555-0200",
    bio: "Martin leads our technology development and innovation initiatives. With extensive R&D experience, he has been the driving force behind several of Petromac's patented technologies. His work focuses on advancing conveyance systems and wellbore navigation tools.",
    image: "/images/team/martin-leonard.jpg"
  },
  {
    name: "Rajesh Thatha",
    title: "Chief Financial Officer",
    email: "rajesh@petromac.co.nz",
    phone: "+64 (9) 555-0300",
    bio: "Rajesh oversees all financial operations and strategic planning. His expertise in financial modeling and investment analysis has been crucial in supporting Petromac's growth and expansion plans. He brings extensive experience from both industry and finance backgrounds.",
    image: "/images/team/rajesh-thatha.jpg"
  },
  {
    name: "Rolando Velasco",
    title: "VP of Operations",
    email: "rolando@petromac.co.nz",
    phone: "+64 (9) 555-0400",
    bio: "Rolando leads global operations and ensures seamless execution of projects across multiple continents. His background in petroleum engineering and project management has helped optimize field operations and improve service delivery timelines.",
    image: "/images/team/rolando-velasco.jpg"
  },
  {
    name: "Craig Rothwell",
    title: "VP of Engineering",
    email: "craig@petromac.co.nz",
    phone: "+64 (9) 555-0500",
    bio: "Craig leads our engineering team in designing and testing cutting-edge wellbore tools. His specialization in mechanical systems has resulted in more durable and reliable equipment. He has been instrumental in developing innovative solutions for complex drilling challenges.",
    image: "/images/team/craig-rothwell.jpg"
  },
  {
    name: "Mike Bird",
    title: "VP of Quality & Safety",
    email: "mike@petromac.co.nz",
    phone: "+64 (9) 555-0600",
    bio: "Mike leads our quality assurance and safety programs, ensuring all operations meet the highest industry standards. His background in industrial safety and quality management systems has helped Petromac maintain an exemplary safety record.",
    image: "/images/team/mike-bird.jpg"
  }
];

// Regional Managers
const regionalManagers = [
  {
    name: "Gabriel Tschikof",
    title: "Regional Manager - North America",
    email: "gabriel@petromac.co.nz",
    phone: "+1 (713) 555-0100",
    bio: "Gabriel leads operations across the United States and Canada, managing both conventional and unconventional oil and gas projects. His extensive experience in North American markets and deep knowledge of shale formations has been instrumental in establishing Petromac's strong presence in the region.",
    image: "/images/team/gabriel-tschikof.jpg"
  },
  {
    name: "Bernardo Espinola",
    title: "Regional Manager - Latin America",
    email: "bernardo@petromac.co.nz",
    phone: "+55 (21) 555-0200",
    bio: "Bernardo manages operations throughout Latin America, from Mexico to Argentina. His expertise in both offshore and onshore operations, combined with fluency in Spanish and Portuguese, has made him instrumental in expanding Petromac's presence across the continent and building strong relationships with major operators.",
    image: "/images/team/bernardo-espinola.jpg"
  },
  {
    name: "Javier Peyriere",
    title: "Regional Manager - Europe & CIS",
    email: "javier@petromac.co.nz",
    phone: "+44 (20) 555-0300",
    bio: "Javier oversees operations across Europe and the Commonwealth of Independent States. His extensive experience with North Sea operations and emerging CIS markets, combined with his multilingual capabilities, has been crucial for maintaining Petromac's excellent track record across these diverse regions.",
    image: "/images/team/javier-peyriere.jpg"
  },
  {
    name: "Solomon Kadiri",
    title: "Regional Manager - Sub-Saharan Africa",
    email: "solomon@petromac.co.nz",
    phone: "+234 (1) 555-0400",
    bio: "Solomon leads operations across Sub-Saharan Africa, managing projects from West Africa's offshore fields to East African developments. His deep understanding of the continent's diverse regulatory environments and his ability to build local partnerships have been key to Petromac's growing presence in Africa.",
    image: "/images/team/solomon-kadiri.jpg"
  },
  {
    name: "Galal Eldaw",
    title: "Regional Manager - MENA",
    email: "galal@petromac.co.nz",
    phone: "+971 (4) 555-0500",
    bio: "Galal manages operations across the Middle East and North Africa region, working closely with major oil producers throughout the Gulf and North Africa. With over 20 years of regional experience, he has built strong relationships with key clients and oversees some of our most complex wellbore intervention projects.",
    image: "/images/team/galal-eldaw.jpg"
  },
  {
    name: "Jee Kwan Ng",
    title: "Regional Manager - APAC",
    email: "jeekwan@petromac.co.nz",
    phone: "+65 (6) 555-0600",
    bio: "Jee Kwan oversees operations across the Asia Pacific region, managing major projects in Southeast Asia, Australia, and China. His background in petroleum engineering and deep understanding of regional market dynamics have been key to Petromac's expansion in this vital and rapidly growing region.",
    image: "/images/team/jee-kwan-ng.jpg"
  }
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meet Our Team
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our experienced leadership team brings decades of expertise in wellbore 
            intervention technologies and oilfield services.
          </p>
        </div>

        {/* Global Leadership Team Section */}
        <div className="mb-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Global Leadership Team</h2>
            <p className="text-gray-400 text-center">Leading innovation and strategic direction worldwide</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {globalTeam.map((member, index) => (
              <TeamCard key={index} member={member} />
            ))}
          </div>
        </div>

        {/* Regional Managers Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Regional Managers</h2>
            <p className="text-gray-400 text-center">Managing operations across key markets globally</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {regionalManagers.map((member, index) => (
              <TeamCard key={index} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
