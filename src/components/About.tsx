const About = () => {
  return (
    <section id="about" className="section-spacing bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          About <span className="text-gradient">Me</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-primary">Hi - I'm Marcio</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A software engineer with over 15 years of experience and a genuine love for solving hard problems with clean, scalable code. I’ve spent much of my career leading engineering teams, architecting cloud-based systems, and mentoring developers across industries like finance, telecom, and advertising.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              I’m passionate about building software that actually matters — systems that perform under pressure, scale with demand, and are a joy to maintain. I'm also a strong believer in continuous learning (and teaching), and I enjoy sharing my thoughts through writing and side projects when I can find the time.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Outside of code, you’ll probably find me exploring new places by running, cycling or swimming. I love to read nerdy stuff and hack things together.
            </p>
          </div>
          
          <div className="card-professional p-8 space-y-6">
            <h4 className="text-xl font-semibold text-primary mb-4">Core Expertise</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-accent">Languages & Framworks</div>
                <div className="text-sm text-muted-foreground">C#, .NET, Web API, REST, WCF, T-SQL, JavaScript</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-accent">Architecture</div>
                <div className="text-sm text-muted-foreground">Microservices, Distributed Systems, Event-Driven Architecture, DDD, TDD</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-accent">Data & Messaging</div>
                <div className="text-sm text-muted-foreground">SQL Server, PostgreSQL, MongoDB, Kafka, ElasticSearch, NServiceBus</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-accent">Cloud & DevOps</div>
                <div className="text-sm text-muted-foreground">AWS, Azure, Docker, Kubernetes, Jenkins, TeamCity, GitHub Actions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;