import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import blogHeader from "@/assets/Architect workshop header croped.jpg";
import blogKafkaHeader from "@/assets/kafka-header.jpg";
import blogSqsHeader from "@/assets/sqs-header.jpg";
import mindLogHeader from "@/assets/mindlog header.jpg";


import { useState } from "react";

const blogPosts = [
  {
    title: "MindLog: Vectors in the Vault - From Markdown to Meaning",
    description: "The journey from raw Markdown notes to being able to chat with my notes begins with a parser. In the MindLog pipeline, the parser is the gatekeeper: it ensures that notes from the knowledge base are consistently extracted, segmented, and enriched before they ever reach the embedding stage.",
    image: mindLogHeader,
    readTime: "8 min read",
    date: "2025-09-02",
    tags: ["Generative AI Tools", "Vector Databases", "MCP Servers", "Dotnet", "LLM's", "Weaviate"],
    slug: "mindlog-vectors-in-the-vault"
  },
  {
    title: "Mindlog: Laying the Foundations — Introduction & Architecture",
    description: "Every system starts with a problem to solve. For Mindlog, that problem is clear: while tools like Obsidian are excellent for capturing and organizing notes, they don’t easily support AI-driven search, aggregation, or deeper insights. This opening article introduces The Architect’s Workshop approach — learning architecture by building — and sets out the vision for Mindlog, an AI-augmented knowledge base. It covers the challenges of moving beyond static note-taking, the guiding principles behind the solution, and the high-level architecture that ties Obsidian, embeddings, vector databases, MCP, and Claude into a cohesive system.",
    image: mindLogHeader,
    readTime: "4 min read",
    date: "2025-08-21",
    tags: ["Generative AI Tools", "Vector Databases", "MCP Servers", "Dotnet", "LLM's"],
    slug: "mindlog-architecting-ai-powered-knowledge-base"
  },
  {
    title: "The Architect’s Workshop: Navora — Reflections on Architecture, Trade-offs, and What I’d Do Differently",
    description: "As I wrap up this blog series on Navora, I want to take a step back and reflect on the journey — what I set out to do, the architectural decisions I made, the trade-offs I accepted, and what I’d approach differently if I were to do it all over again",
    image: blogHeader,
    readTime: "6 min read",
    date: "2025-07-28",
    tags: ["Software Architecture", "Dotnet", "Serverless Architecture", "AWS", "CSharp Programming"],
    slug: "reflections-on-navora-architecture"
  },
  {
    title: "The Architect’s Workshop: Navora — Control Center - Designing the Admin Service for Telemetry Management",
    description: "In Navora’s architecture, the Admin Service acts as the control center — a secure interface where administrators can monitor vehicle activity, review historical telemetry, and respond to alerts as they happen.",
    image: blogHeader,
    readTime: "9 min read",
    date: "2025-07-17",
    tags: ["Software Architecture", "Dotnet", "Serverless Architecture", "AWS", "CSharp Programming"],
    slug: "admin-service-for-telemetry"
  },
  {
    title: "The Architect’s Workshop: Navora — Detect and Respond — Architecting the Alerts Processing Service",
    description: "In any telemetry-driven system, detecting anomalies is only half the work — responding to them quickly and reliably is just as critical. In Navora, the alerting pipeline is designed to be scalable, loosely coupled, and extensible, using Amazon SNS, Lambda, and a purpose-built DynamoDB Alerts table.",
    image: blogHeader,
    readTime: "4 min read",
    date: "2025-07-08",
    tags: ["Software Architecture", "Dotnet", "Serverless Architecture", "AWS", "CSharp Programming"],
    slug: "architecting-the-alerts-processing-service"
  },
  {
    title: "The Architect’s Workshop: Navora — Streaming the Signal: Designing the IoT Telemetry Ingestion Pipeline",
    description: "Breakdown of how we’ve designed and implemented the IoT Telemetry ingestion pipeline",
    image: blogHeader,
    readTime: "7 min read",
    date: "2025-06-30",
    tags: ["Software Architecture", "Dotnet", "Serverless Architecture", "AWS", "CSharp Programming"],
    slug: "designing-the-iot-pipeline"
  },
  {
    title: "The Architect’s Workshop: Navora—Laying the Foundation",
    description: "Defining the functional and non-functional requirements for our fictional company - Navora",
    image: blogHeader,
    readTime: "6 min read",
    date: "2025-06-23",
    tags: ["Software Architecture", "Dotnet", "Serverless Architecture", "AWS", "CSharp Programming"],
    slug: "functional-and-non-functional-requirements"
  },
  {
    title: "Welcome to The Architect’s Workshop",
    description: "In the ever-evolving world of software and cloud architecture, theory is abundant and it’s easy to get caught up in it— but practical, real-world application is where true mastery is forged. The Architect’s Workshop is a space dedicated to that craft.",
    image: blogHeader,
    readTime: "2 min read",
    date: "2025-06-05",
    tags: ["Software Architecture", "Dotnet", "Serverless Architecture", "AWS", "CSharp Programming"],
    slug: "welcome-to-navora"
  },
  {
    title: "Kafka .NET Demo",
    description: "This will be the fifth and last article in our Kafka Learning Series, and the culmination of our theoretical learning with a real demo!",
    image: blogKafkaHeader,
    readTime: "3 min read",
    date: "2021-11-14",
    tags: ["Dotnet Core", "Dotnet", "Kafka", "Distributed Systems", "CSharp Programming"],
    slug: "kafka-dotnet-demo"
  },
  {
    title: "Inside Kafka’s CLI",
    description: "In this article we’ll spin up Kafka (and Zookeeper) using Docker (usage of Docker is not in the scope of this post) and we’ll use some of the most common and important Kafka’s CLI commands.",
    image: blogKafkaHeader,
    readTime: "5 min read",
    date: "2021-01-14",
    tags: ["Dotnet Core", "Dotnet", "Kafka", "Distributed Systems", "CSharp Programming"],
    slug: "inside-kafka-cli"
  },
  {
    title: "Kafka Consumers",
    description: "In this article we’ll explore how Kafka consumers work",
    image: blogKafkaHeader,
    readTime: "4 min read",
    date: "2021-01-14",
    tags: ["Dotnet Core", "Dotnet", "Kafka", "Distributed Systems", "CSharp Programming"],
    slug: "kafka-consumers"
  },
  {
    title: "Kafka Producers",
    description: "In this article we’ll explore how Kafka producers work",
    image: blogKafkaHeader,
    readTime: "6 min read",
    date: "2021-01-14",
    tags: ["Dotnet Core", "Dotnet", "Kafka", "Distributed Systems", "CSharp Programming"],
    slug: "kafka-producers"
  },
  {
    title: "Intro to Kafka",
    description: "This is the first article of a series of 5 where we will learn and discuss about some of Kafka features, its usage and in the end we’ll implement a small .NET demo application.",
    image: blogKafkaHeader,
    readTime: "4 min read",
    date: "2021-01-14",
    tags: ["Dotnet Core", "Dotnet", "Kafka", "Distributed Systems", "CSharp Programming"],
    slug: "intro-to-kafka"
  },
  {
    title: "How to Configure and Use SQS Message Dispatcher",
    description: "Library to dispatch SQS Messages",
    image: blogSqsHeader,
    readTime: "3 min read",
    date: "2021-10-25",
    tags: ["Dotnet Core", "AWS", "AWS SQS", "Cloud Computing", "Cloud"],
    slug: "sqs-dispatcher"
  }
];

const Blog = () => {
  const [showAll, setShowAll] = useState(false);

  const visiblePosts = showAll ? blogPosts : blogPosts.slice(0, 3);

  return (
    <section id="blog" className="section-spacing bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Technical <span className="text-gradient">Blog</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visiblePosts.map((post, index) => (
            <article key={index} className="card-professional p-0 overflow-hidden hover:glow-effect transition-smooth group">
              <div className="relative overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="bg-primary/10 text-primary text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-xl font-semibold text-primary mb-3 line-clamp-2 group-hover:text-primary-glow transition-smooth">
                  {post.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>

                  <Link to={`/article/${post.slug}`}>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary-glow">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : "View All Articles"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};


export default Blog;