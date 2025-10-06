import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import articles from "@/data/articles.json";

// Dynamically import all article header images from assets
const articleImages = import.meta.glob("@/assets/*.{jpg,png,jpeg,webp}", { eager: true, import: "default" });

const Blog = () => {
  const [showAll, setShowAll] = useState(false);

  const visiblePosts = showAll ? articles : articles.slice(0, 3);

  return (
    <section id="blog" className="section-spacing bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Technical <span className="text-gradient">Blog</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visiblePosts.map((post, index) => {
            const imageSrc = articleImages[`/src/assets/${post.image}`];

            return (
              <article key={index} className="card-professional p-0 overflow-hidden hover:glow-effect transition-smooth group">
                <div className="relative overflow-hidden">
                  <img 
                    src={imageSrc}
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
            );
          })}
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