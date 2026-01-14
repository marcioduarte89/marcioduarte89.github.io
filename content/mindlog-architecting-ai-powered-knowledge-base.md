![header](https://cdn.hashnode.com/res/hashnode/image/upload/v1755776465513/1a2356c4-a30a-4faf-a266-e349add16d55.jpeg)

---

Welcome back to *The Architect’s Workshop*, where we learn about software development and architecture by building. Instead of working only with theory or abstract diagrams, each post series attempts to take on a practical problems and explores how to design, implement, and evolve a solution.

The focus isn’t on creating the “perfect” architecture, but on making decisions, understanding trade-offs, and seeing how different components fit together in practice. 

---

### Mindlog: Architecting an AI-Powered Knowledge Base

Like many people in tech, I take a lot of (technical) notes and do my own journaling using Obsidian. It’s literally my second brain. 

![Obsidian Knowledge graph](https://cdn-images-1.medium.com/max/1320/1*7RJowAaYZik7_Go61AmyTA.png)

It’s great for capturing notes, linking ideas, and keeping knowledge portable. But… it’s static. Search and indexing works, but it’s “literal”. If I want to ask deeper questions, spot patterns, or get AI-assisted summaries, I quickly hit a wall.

In short:

* **I don’t just want to *store* knowledge -** I want to be able to *query* it in smarter ways.
    
* I want AI to help me surface connections across hundreds of markdown files.
    
* I’d love to use tools like Claude to converse with my knowledge base, not just browse it.

* I usually revisit notes I've written recently as I find its easier for me to retain information.

### Enter Mindlog

*Mindlog* is my attempt to build an **AI-augmented personal knowledge system**. At its heart, it’s about bridging the gap between traditional note-taking and modern GenAI workflows.

Instead of leaving my notes locked in folders, I want to:

* **Parse and embed markdown notes** into vector space.
    
* **Store them in a vector database** (Weaviate in my case) for semantic search.
    
* **Expose them via an MCP server** so other tools (like Claude desktop) can query them.
    
* **Add an AI layer** on top, so I can actually “talk to” my knowledge base.
    

### High-Level Architecture

![High level architecture](https://cdn-images-1.medium.com/max/1320/1*895wmE9BDscgqQsdgZfGNg.png)

Let’s look at the moving parts (without diving too deep yet — that’s what later posts are for).

* **Obsidian (Notes Source):** Where all my markdown notes live. Nothing changes here; it stays my central writing environment.
    
* **Embedding Service:** A lightweight Python microservice that parses notes, generates embeddings with `sentence-transformers`, using all-MiniLM-L6-v2. 
    
* **Markdown Parser:** Parses all the markdown files, uses the **Embeddings Service** to generate the embeddings, then ships them to Weaviate.
    
* **Weaviate (Vector Database):** The brain of the system, where semantic search happens.
    
* **MCP Server:** A bridge that lets external apps (like Claude) query my notes.
    
* **Claude Desktop:** The “front-end intelligence” — letting me chat with my knowledge base, ask for summaries, or explore connections across notes, etc.
    

This layered approach keeps each component focused: parsing and embedding is one job, search and retrieval is another, and the AI interface is yet another. That separation makes the system easier to evolve — if I swap out Weaviate later, or switch embedding models, the rest can stay intact.

#### Why This Architecture?

A few guiding principles shaped the design:

* **Keep notes portable.** My Obsidian vault remains the single source of truth. No lock-in.
    
* **Small, focused services.** The embedding logic lives in a tiny Python service (for easier access to the `SentenceTransformer` model), not buried in the database or a massive app.
    
* **Composable layers.** Each part can be swapped: Claude could be replaced by another LLM, Weaviate by another vector DB, etc.
    
* **Learn by doing.** Each stage is an opportunity to deepen understanding: embeddings, vector search, AI interfaces — but grounded in a real project.
    

### What’s Next?

This post lays the foundation. In the next ones, I’ll dive into each part of the stack:

* *Vectors in the Vault: From Markdown to Meaning* - turning notes into embeddings and introducing Weaviate.
    
* *Searching Smarter: Building an AI-Ready Knowledge Base* - wiring up the MCP server for semantic queries.
    
* *Conversations with MindLog* — plugging it all into Claude and exploring what it feels like to chat with your own second brain.
    

Stay tuned—keep building, keep learning.