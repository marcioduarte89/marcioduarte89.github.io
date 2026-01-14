![](https://cdn.hashnode.com/res/hashnode/image/upload/v1755776465513/1a2356c4-a30a-4faf-a266-e349add16d55.jpeg)

It’s time to put an AI interface on my personal knowledge base!

---

## **Closing the Loop**

In the previous two articles, I focused on laying the technical foundations for MindLog.

In **“**[**Vectors in the Vault: From Markdown to Meaning**](https://marcioduarte89.github.io/article/mindlog-vectors-in-the-vault)**”**, I walked through how raw Markdown notes from Obsidian are parsed, segmented, embedded, and stored in Weaviate. That step turned static text into something searchable at a semantic level.

In **“**[**Searching Smarter: Building an AI-Ready Knowledge Base**](https://marcioduarte89.github.io/article/mindlog-searching-smarter)**”**, I introduced the Model Context Protocol (MCP) and showed how a .NET-based MCP server can expose that knowledge base through a clean, standardized interface.

At that point, the system was technically complete — but still not particularly usable day to day. This final article is about the last step: putting a real interface on top of it, and and actually *use* it as a semantic knowledge base.

## **Claude Desktop as the Interface**

For the final layer, I chose **Claude Desktop**. The main reason is because it supports MCP natively and works well as a local, focused environment.

At a high level, the setup looks like this:

* Claude Desktop runs locally.
    
* A local MCP server exposes my MindLog tools (search, filtering, etc.).
    
* Claude connects to that server and can invoke those tools when needed.
    

For this I didn’t need any cloud orchestration, no extra backend services — just a local client talking to a local server.

## **Installing and Configuring Claude Desktop**

The installation itself is straightforward and [well-documented](https://support.claude.com/en/articles/10065433-installing-claude-desktop), so I won’t dwell on it here. The interesting part is the **MCP configuration**.

Claude Desktop allows you to register local MCP servers by pointing it to:

* The executable (or command) that starts the server.
    
* The transport type (stdio in my case).
    
* The tools exposed by the server.
    

You can read about how to setup an MCP [here](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

Once configured, Claude automatically discovers the available tools — including the `KnowledgeBaseEngine` tool from MindLog — without any additional wiring.

![Local MCP configuration](https://miro.medium.com/v2/resize:fit:700/1*LEmeBSCPmM5SS9V_wGsqPA.png)

This is one of the strengths of MCP: once the contract is defined, the client experience is largely automatic.

## **Seeing It in Action**

With everything wired up, the real test is simple: ask a question.

For example:

> *“How can I use async/await mechanism in .NET? What are the best practises”*

Behind the scenes, Claude:

1. Interprets the question.
    
2. Decides that it needs to call the `KnowledgeBaseEngine`tool.
    
3. Generates a structured query with:
    

* A cleaned semantic query string.
    
* Inferred keywords (CSharp, Dotnet, LanguageFeatures).
    
* Optional date filters, if relevant.
    

  
Press enter or click to view image in full size

![Claude adding specific keywords and query parameters](https://miro.medium.com/v2/resize:fit:700/1*1Ll8kqX4lD3bNJZY0_MqUQ.png)

As you can see above, my question has been interpreted and parsed by Claude and sent to my MCP server in the format it expects. Because I didn’t provide any timeframes it didn’t include any (this will search across all my notes regardless of the when they were created), but it did include all the specific keywords and the broken down query.

That query is then passed to the MCP server, which:

* Generates embeddings.
    
* Applies certainty thresholds.
    
* Combines semantic search with structured filters.
    
* Queries Weaviate.
    
* Returns a ranked set of notes.
    

Claude receives the results and presents them back in a readable, contextual way.

![Partial example of the reply and interpretation by Claude](https://miro.medium.com/v2/resize:fit:700/1*adPLNOGtM-blRxgjfeWIvw.png)

What’s important here is that **Claude isn’t replacing search logic,** but rather orchestrating it. The semantic search still lives in the architecture — Claude just provides a natural interface on top.

## **What I Learned**

A few takeaways from building and using Mindlog:

* **Semantic search needs constraints.** Embeddings alone aren’t enough; certainty thresholds and structured filters matter.
    
* **MCP is a powerful abstraction.** It keeps AI integration clean and decoupled from your core logic.
    
* **.NET fits naturally here.** With attributes, async APIs, and strong typing, building MCP tools feels like normal application development.
    
* **The UX matters.** The difference between “interesting project” and “daily tool” is the interface. I’ve started using Mindlog regularly to:  
    \- Find older notes I’d forgotten about.  
    \- Explore related ideas across topics.  
    \- Support learning by resurfacing my own prior thinking.
    

It’s become a quiet but reliable part of how I work nowadays.

## **Wrapping Up**

This series started as a project for me to learn about building AI systems, applying architectural thinking to a real problems, making trade-offs, and learning by doing — which is the spirit I want for *The Architect’s Workshop*.

If you’ve followed along, I hope you’ve picked up ideas you can adapt to your own projects, whether that’s personal knowledge management, AI integration, or just building and hacking things away!

**Stay tuned — keep building, keep learning.**