import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    const loadArticle = async () => {
      const metadata = await import("@/data/articles.json");
      const found = metadata.default.find((a: any) => a.slug === slug);
      if (found) {
        setArticle(found);
        const response = await fetch(`/content/${found.contentFile}`);
        const text = await response.text();
        setContent(text);
      }
    };
    loadArticle();
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist.</p>
          <Link to="/#blog">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <p className="text-muted-foreground mb-6">{article.description}</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {article.author}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {article.readTime}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6 mb-8">
          {article.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-primary border-primary/40">
              {tag}
            </Badge>
          ))}
        </div>

        
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="prose prose-lg prose-invert max-w-none custom-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>


        <div className="mt-16 pt-8 border-t border-border">
          <Link to="/#blog">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Articles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Article;
