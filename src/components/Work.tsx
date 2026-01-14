import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github } from "lucide-react";
import navora from "@/assets/Architect workshop header croped.jpg";
import sqs from "@/assets/sqs-header.jpg";
import grpc from "@/assets/grpc.png";
import mindlog from "@/assets/mindlog header.jpg"

const projects = [
  {
    title: "The Architect’s Workshop - MindLog",
    description: "AI powered knowledge based backed by .NET Core, MCP Server, Weaviate, Python and Claude Desktop",
    image: mindlog,
    technologies: ["Generative AI Tools", "Vector Databases", "MCP Servers", "Dotnet", "LLM's", "Weaviate"],
    liveUrl: "",
    githubUrl: "https://github.com/marcioduarte89/MindLog",
    featured: true
  },
  {
    title: "The Architect’s Workshop - Navora",
    description: "A fictional logistics company with a fleet of delivery vehicles that has real time monitoring. This is a project to simulate the full lifecycle of a modern cloud-native system.",
    image: navora,
    technologies: ["Software Architecture", "Dotnet", "Serverless Architecture", "AWS", "CSharp Programming"],
    liveUrl: "",
    githubUrl: "https://github.com/marcioduarte89/Navora",
    featured: true
  },
  {
    title: "SQS Message Dispatcher",
    description: "Library to dispatch SQS Messages.",
    image: sqs,
    technologies: ["Dotnet Core", "AWS", "AWS SQS", "Cloud Computing", "Cloud"],
    liveUrl: "https://www.nuget.org/packages/SQSMessageDispatcher",
    githubUrl: "https://github.com/marcioduarte89/SQSMessageDispatcher",
    buttonLabel: "Nuget",
    featured: true
  },
  {
    title: "Discover.io",
    description: "Simple and lightweight Service Discovery using .NET for .NET.",
    image: grpc,
    technologies: ["Dotnet Core", "GRPC"],
    liveUrl: "https://www.nuget.org/packages/Discoverio.Client",
    githubUrl: "https://github.com/marcioduarte89/Discover.io",
    buttonLabel: "Nuget",
    featured: true
  }
];

const Work = () => {
  return (
    <section id="work" className="section-spacing bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Featured <span className="text-gradient">Projects</span>
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {projects.filter(p => p.featured).map((project, index) => (
            <div key={index} className="card-professional p-0 overflow-hidden hover:glow-effect transition-smooth group">
              <div className="relative overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-smooth"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              
              <div className="p-8">
                <h3 className="text-2xl font-semibold text-primary mb-3">{project.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.technologies.map((tech, techIndex) => (
                    <Badge key={techIndex} variant="secondary" className="bg-primary/10 text-primary">
                      {tech}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-4">
                
                {project.liveUrl && project.liveUrl.trim() !== "" && (
                  <Button variant="default" size="sm" asChild>
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {project.buttonLabel}
                    </a>
                  </Button>
                )}            
                  
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      Source Code
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {projects.filter(p => !p.featured).map((project, index) => (
            <div key={index} className="card-professional p-6 hover:glow-effect transition-smooth group">
              <div className="flex gap-4">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-24 h-24 object-cover rounded-lg group-hover:scale-105 transition-smooth"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-primary mb-2">{project.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.technologies.slice(0, 3).map((tech, techIndex) => (
                      <Badge key={techIndex} variant="secondary" className="bg-primary/10 text-primary text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                        +{project.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Work;