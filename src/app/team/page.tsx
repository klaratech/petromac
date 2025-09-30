import TeamCard from "@/components/public/TeamCard";

// Sample team member data
const teamMembers = [
  {
    name: "John Anderson",
    title: "Chief Executive Officer",
    email: "j.anderson@petromac.com",
    phone: "+1 (555) 123-4567",
    bio: "John brings over 25 years of experience in the oil and gas industry. He has led Petromac's strategic growth initiatives and oversees all major operations. His expertise in wellbore intervention technologies has been instrumental in developing innovative solutions for complex drilling challenges.",
    image: "/images/team/john-anderson.jpg"
  },
  {
    name: "Sarah Mitchell",
    title: "Chief Technology Officer",
    email: "s.mitchell@petromac.com",
    phone: "+1 (555) 123-4568",
    bio: "Sarah leads our technology development and innovation initiatives. With a PhD in Mechanical Engineering and 15 years of R&D experience, she has been the driving force behind several of Petromac's patented technologies. Her work focuses on advancing conveyance systems and wellbore navigation tools.",
    image: "/images/team/sarah-mitchell.jpg"
  },
  {
    name: "Michael Chen",
    title: "VP of Operations",
    email: "m.chen@petromac.com",
    phone: "+1 (555) 123-4569",
    bio: "Michael oversees global operations and ensures seamless execution of projects across multiple continents. His background in petroleum engineering and project management has helped optimize field operations and improve service delivery timelines. He has successfully managed operations in over 30 countries.",
    image: "/images/team/michael-chen.jpg"
  },
  {
    name: "Emily Rodriguez",
    title: "Director of Engineering",
    email: "e.rodriguez@petromac.com",
    phone: "+1 (555) 123-4570",
    bio: "Emily leads our engineering team in designing and testing cutting-edge wellbore tools. Her specialization in materials science and mechanical systems has resulted in more durable and reliable equipment. She holds 12 patents in drilling technology and has published numerous technical papers.",
    image: "/images/team/emily-rodriguez.jpg"
  },
  {
    name: "David Thompson",
    title: "VP of Sales & Marketing",
    email: "d.thompson@petromac.com",
    phone: "+1 (555) 123-4571",
    bio: "David drives our global sales strategy and customer relationships. With extensive experience in technical sales and client management, he has expanded Petromac's market presence across North America, Europe, and Asia. His approach combines technical expertise with strong business acumen.",
    image: "/images/team/david-thompson.jpg"
  },
  {
    name: "Lisa Patel",
    title: "Chief Financial Officer",
    email: "l.patel@petromac.com",
    phone: "+1 (555) 123-4572",
    bio: "Lisa oversees all financial operations and strategic planning. Her expertise in financial modeling and investment analysis has been crucial in supporting Petromac's growth and expansion plans. She brings 18 years of experience from both industry and investment banking backgrounds.",
    image: "/images/team/lisa-patel.jpg"
  },
  {
    name: "Robert Johnson",
    title: "Director of Field Services",
    email: "r.johnson@petromac.com",
    phone: "+1 (555) 123-4573",
    bio: "Robert manages our global field service teams and ensures optimal equipment performance on-site. His hands-on experience with wellbore operations and troubleshooting has made him an invaluable resource for both clients and internal teams. He has trained hundreds of field engineers worldwide.",
    image: "/images/team/robert-johnson.jpg"
  },
  {
    name: "Amanda Williams",
    title: "VP of Quality & Safety",
    email: "a.williams@petromac.com",
    phone: "+1 (555) 123-4574",
    bio: "Amanda leads our quality assurance and safety programs, ensuring all operations meet the highest industry standards. Her background in industrial safety and quality management systems has helped Petromac maintain an exemplary safety record. She is certified in multiple international safety standards.",
    image: "/images/team/amanda-williams.jpg"
  }
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meet Our Team
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our experienced leadership team brings decades of expertise in wellbore 
            intervention technologies and oilfield services.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <TeamCard key={index} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}
