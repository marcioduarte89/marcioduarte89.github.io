import { Badge } from "@/components/ui/badge";
import { GraduationCap, Award, BookOpen } from "lucide-react";

const education = [
  {
    icon: GraduationCap,
    type: "Degree",
    title: "BSc in Computer Science",
    institution: "Faculdade de Ciências e Tecnologias da Universidade Nova de Lisboa",
    period: "2008 - 2012",
    description: "",
    grade: "Awarded Recommendation Letter for best project and top student in Software Engineering course (2010-2011)"
  }
];

const certifications = [
  {
    icon: Award,
    type: "Certification",
    title: "Kubernetes Essential Training: Application Development",
    institution: "LinkedIn",
    period: "2025",
    description: "Taking Kubernetes knowledge from theory to practice. Learn how to use Kubernetes to develop and run real-world applications",
    badge: "Professional Level"
  },
  {
    icon: BookOpen,
    type: "Course",
    title: "MongoDB Basics",
    institution: "MongoDb",
    period: "2019",
    description: "Get started with MongoDB, the database designed for building high-performance, modern applications. This course introduces you to its core strengths, ideal use cases, how to quickly get up and running with Atlas, and the wide range of features for storing, accessing (CRUD), and securing your data.",
    badge: "Completed"
  }
];

const Education = () => {
  return (
    <section id="education" className="section-spacing bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Education & <span className="text-gradient">Certifications</span>
        </h2>
        
        <div className="space-y-12">
          {/* Formal Education */}
          <div>
            <h3 className="text-2xl font-semibold text-primary mb-8 flex items-center gap-3">
              <GraduationCap className="h-6 w-6" />
              Formal Education
            </h3>
            <div className="grid md:grid-cols-1 gap-6">
              {education.map((item, index) => (
                <div key={index} className="card-professional p-6 hover:glow-effect transition-smooth">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="text-accent border-accent/40 mb-2">
                        {item.period}
                      </Badge>
                      <h4 className="text-lg font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-accent font-medium mb-2">{item.institution}</p>
                      <p className="text-sm text-success font-medium mb-3">{item.grade}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Certifications & Courses */}
          <div>
            <h3 className="text-2xl font-semibold text-primary mb-8 flex items-center gap-3">
              <Award className="h-6 w-6" />
              Certifications & Continued Learning
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {certifications.map((item, index) => (
                <div key={index} className="card-professional p-6 hover:glow-effect transition-smooth">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-accent/10 p-2 rounded-lg">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="secondary" className="bg-accent/10 text-accent mb-2 text-xs">
                        {item.badge}
                      </Badge>
                      <h4 className="text-base font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-primary text-sm font-medium mb-1">{item.institution}</p>
                      <p className="text-muted-foreground text-xs">{item.period}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Education;