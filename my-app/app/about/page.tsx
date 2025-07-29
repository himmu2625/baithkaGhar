export const dynamic = 'force-dynamic';

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Users, Building, Clock, MapPin, Linkedin, Twitter, Github, Globe, Mail } from "lucide-react"
import { getPlaceholderImage } from "@/lib/placeholder"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { connectMongo } from "@/lib/db/mongodb"
import Team from "@/models/Team"

interface TeamMemberSocial {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  email?: string;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  image: {
    url: string;
    public_id: string;
  };
  social?: TeamMemberSocial;
  location?: string;
  skills?: string[];
  achievements?: string[];
  education?: string;
  experience?: string;
  joinedDate?: string;
  order: number;
}

async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    await connectMongo();
    
    const teamMembers = await Team.find({ 
      isActive: true, 
      showOnAboutPage: true 
    })
      .sort({ order: 1 })
      .select('name role department bio image social location skills achievements education experience joinedDate order')
      .lean();
      
    // Manually convert ObjectId and other non-serializable fields
    return JSON.parse(JSON.stringify(teamMembers));
  } catch (error) {
    console.error('Error fetching team members directly:', error);
    return [];
  }
}

export default async function AboutPage() {
  const teamMembers = await getTeamMembers();
  return (
    <main className="pt-24 pb-16">
      <section className="bg-lightBeige py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton 
              className="text-darkGreen hover:text-mediumGreen" 
              variant="ghost"
            />
          </div>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold text-darkGreen mb-4">About Baithaka Ghar</h1>
            <p className="text-mediumGreen text-lg">
              Your trusted partner for finding the perfect accommodation across India
            </p>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-bold text-darkGreen text-center mb-12">Our Story</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/Hero-section/varanasi ghat.webp"
                  alt="A scenic view of Varanasi ghats representing our journey"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
              <div className="text-lg text-mediumGreen space-y-6">
                <p>
                  Founded in April 2025, Baithka Ghar was born out of a simple idea: to make finding and booking accommodation in India as easy and enjoyable as possible.
                </p>
                <p>
                  Our founder experienced first-hand the challenges of finding reliable, quality accommodation while traveling across India’s diverse landscapes. He envisioned a platform that could bridge the gap between travelers and property owners, ensuring a seamless experience for both.
                </p>
                <p>
                  Today, Baithka Ghar is becoming a trusted platform that connects thousands of travelers in every corner of India with their ideal stay, be it a luxury resort or a cozy homestay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-darkGreen text-center mb-12">Our Mission & Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-lightBeige border-brownTan">
              <CardContent className="pt-6">
                <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Award className="text-lightBeige h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-darkGreen text-center mb-2">Quality Assurance</h3>
                <p className="text-mediumGreen text-center">
                  We personally verify all properties on our platform to ensure they meet our high standards of quality,
                  cleanliness, and service.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-lightBeige border-brownTan">
              <CardContent className="pt-6">
                <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Users className="text-lightBeige h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-darkGreen text-center mb-2">Customer First</h3>
                <p className="text-mediumGreen text-center">
                  Our decisions are guided by what's best for our customers. We strive to provide exceptional service
                  and support at every step.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-lightBeige border-brownTan">
              <CardContent className="pt-6">
                <div className="bg-brownTan w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Building className="text-lightBeige h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-darkGreen text-center mb-2">Community Support</h3>
                <p className="text-mediumGreen text-center">
                  We empower local property owners and contribute to local economies by connecting them with travelers
                  from around the world.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-darkGreen py-16 text-lightBeige">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Achievements</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">10,000+</p>
              <p className="text-lg">Properties Listed</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">500+</p>
              <p className="text-lg">Cities Covered</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">1M+</p>
              <p className="text-lg">Happy Customers</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-brownTan mb-2">4.8/5</p>
              <p className="text-lg">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-darkGreen text-center mb-12">Our Team</h2>

          {teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member._id} className="text-center group">
                  <div className="relative w-48 h-48 rounded-full overflow-hidden mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Image
                      src={member.image.url}
                      alt={member.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-darkGreen">{member.name}</h3>
                  <p className="text-brownTan mb-2">{member.role}</p>
                  {member.location && (
                    <p className="text-mediumGreen text-sm flex items-center justify-center gap-1 mb-2">
                      <MapPin className="h-3 w-3" />
                      {member.location}
                    </p>
                  )}
                  <p className="text-mediumGreen mb-4">
                    {member.bio}
                  </p>
                  
                  {/* Skills */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mb-4">
                      {member.skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-lightGreen/10 text-darkGreen border-lightGreen">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-lightGreen/10 text-darkGreen border-lightGreen">
                          +{member.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Social Links */}
                  {member.social && Object.values(member.social).some(link => link) && (
                    <div className="flex justify-center gap-3">
                      {member.social.linkedin && (
                        <a 
                          href={member.social.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          aria-label={`${member.name}'s LinkedIn`}
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {member.social.twitter && (
                        <a 
                          href={member.social.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                          aria-label={`${member.name}'s Twitter`}
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                      {member.social.github && (
                        <a 
                          href={member.social.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:text-gray-900 transition-colors"
                          aria-label={`${member.name}'s GitHub`}
                        >
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {member.social.website && (
                        <a 
                          href={member.social.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          aria-label={`${member.name}'s Website`}
                        >
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                      {member.social.email && (
                        <a 
                          href={`mailto:${member.social.email}`}
                          className="text-brownTan hover:text-darkGreen transition-colors"
                          aria-label={`Email ${member.name}`}
                        >
                          <Mail className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((member) => (
                  <div key={member} className="text-center">
                    <div className="relative w-48 h-48 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src={getPlaceholderImage(200, 200, `Team Member ${member}`) || "/placeholder.svg"}
                        alt={`Team Member ${member}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-darkGreen">Team Member {member}</h3>
                    <p className="text-brownTan mb-2">Co-Founder & CEO</p>
                    <p className="text-mediumGreen">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed euismod, nisl vel
                      ultricies lacinia.
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-mediumGreen mt-8 italic">
                Team information will be available soon. Please check back later!
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-lightBeige py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-darkGreen mb-6">Visit Our Office</h2>
          <div className="flex flex-col items-center justify-center space-y-2 mb-8">
            <MapPin className="h-6 w-6 text-brownTan" /> Goa

            <p className="text-mediumGreen">Ground Floor, Silver Palm Resort (New Jolly Panda Resort), Near Novotel Hotel, Behind Solitude Villa Calangute- Aguda Road, Anna Waddo, Candolim -GOA 403515</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-2">
            <Clock className="h-6 w-6 text-brownTan" />
            <p className="text-mediumGreen">Monday - Friday: 9:00 AM - 6:00 PM</p>
            <p className="text-mediumGreen">Saturday: 10:00 AM - 4:00 PM</p>
            <p className="text-mediumGreen">Sunday: Closed</p>
          </div>
        </div>
      </section>
    </main>
  )
}
