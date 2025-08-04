import { Badge } from "@/components/ui/badge";

const experiences = [
  {
    title: "Lead Engineer / Architect",
    company: "Freewheel - Comcast, London, UK",
    period: "2018 - Present",
    details: ["I lead the design and delivery of high-scale services in the digital advertising space. I’ve architected a media storefront platform projected to drive multi-million pound revenue, built core services like the Master Data and UserStore platforms, and led integrations with third-party systems across global teams.", "Beyond architecture, I champion engineering practices — from building a YAML-based test automation framework to leading a cross-functional team of multiple engineers. My focus is always on building systems that scale, teams that grow, and software that delivers measurable impact."],
    recognitions: ["Awarded “Engineer of the Year” for technical excellence (2019–2020).", "Received distinction for engineering contributions (2025)."],
    technologies: [".NET Core", "C#", "AWS", "SQL Server", "NServiceBus", "IdentityServer", "Jenkins", "Mediatr", "Docker", "Kubernetes"]
  },
  {
    title: "Senior / Lead Sitecore Engineer",
    company: "HealthWallace / HSBC",
    period: "2015 - 2018",
    details: ["Led the development of a content platform using Sitecore CMS, providing technical direction across multiple teams. Focused on scalable architecture, high test coverage, and continuous delivery. Mentored developers and trained QA teams, ensuring the platform remained performant and maintainable as it evolved."],
    recognitions: [],
    technologies: ["Sitecore 8.1", "ASP.NET MVC", "SQL Server", "Glass,", "Lucene", "HangFire"]
  },
  {
    title: "Senior Software Engineer (Contract)",
    company: "The Knowledge Academy",
    period: "2015",
    details: ["Designed and built web applications using Umbraco CMS, with a strong focus on performance and scalability in Azure. Delivered architecture improvements that significantly enhanced asset delivery and maintainability."],
    recognitions: [],
    technologies: ["ASP.NET MVC 5", "Umbraco", "Azure", "ElasticSearch"]
  },
  {
    title: "Software Engineer (Contract)",
    company: "Fenergo",
    period: "2014 - 2015",
    details: ["Contributed to a regulatory web platform, including a major refactor of a custom JavaScript rendering engine. Led a small frontend team and built admin tools to streamline content management workflows."],
    recognitions: [],
    technologies: ["ASP.NET MVC", "WCF", "Web API", "JavaScript", "SQL Server"]
  },
  {
    title: "Software Engineer",
    company: "Altice,",
    period: "2012 - 2014",
    details: ["Developed e-commerce features such as checkout and payment integration, and led UI and performance improvements. Worked on social media integrations and legacy system migrations within a fast-paced retail environment."],
    recognitions: [],
    technologies: ["ASP.NET MVC", "KnockoutJS", "SQL Server", "Dynamics AX", "Facebook API"]
  }
];

const Experience = () => {
  return (
    <section id="experience" className="section-spacing bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Professional <span className="text-gradient">Experience</span>
        </h2>
        
        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <div key={index} className="card-professional p-8 hover:glow-effect transition-smooth">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-2xl font-semibold text-primary mb-1">{exp.title}</h3>
                  <h4 className="text-xl text-accent font-medium">{exp.company}</h4>
                </div>
                <Badge variant="outline" className="text-primary border-primary/40 w-fit">
                  {exp.period}
                </Badge>
              </div>
              
              {exp.details.map((detail, techIndex) => (
                <p className="text-muted-foreground leading-relaxed mb-6">{detail}</p>                
              ))}
              
              {exp.recognitions.map((recognition, techIndex) => (
                <p className="text-sm text-success font-medium mb-3">{recognition}</p>
                ))}
              
              <div className="flex flex-wrap gap-2">
                {exp.technologies.map((tech, techIndex) => (
                  <Badge key={techIndex} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;