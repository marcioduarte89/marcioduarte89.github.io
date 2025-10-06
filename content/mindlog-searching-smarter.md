![](https://cdn.hashnode.com/res/hashnode/image/upload/v1755776465513/1a2356c4-a30a-4faf-a266-e349add16d55.jpeg)

---

In the last article, we parsed markdown notes, created embeddings, and stored them in Weaviate. That gave us a powerful way to run semantic queries across our knowledge base.

But embeddings on their own aren’t the end goal — I want to *use* them. That means giving external tools (like Claude Desktop) a way to query my knowledge base data through a common interface. This is where the **Model Context Protocol (MCP)** comes in.

---

# What is MCP?

The Model Context Protocol is a standard for connecting applications to external resources in a structured way. It lets AI models (or tools working with them) interact with backends as if they were first-class “extensions.”

MCP defines:

* **Servers**: components that expose capabilities (like search, file access, or database queries).
    
* **Clients**: applications that consume those capabilities (e.g., Claude Desktop, custom tools).
    
* **Transport**: how client and server communicate (HTTP or STDIO).
    
* **Schema/Contracts**: a JSON-RPC–based contract describing what the server offers.
    

In practice: An MCP server becomes a “plugin” that tools can connect to, query, and interact with — without having to embed application logic directly inside them.

## Why Use MCP in MindLog?

* **Standardized access.** Instead of building custom APIs for every integration, I expose my knowledge base once via MCP.
    
* **Client-agnostic.** Any MCP-compliant client can query my notes (Claude Desktop being the first).
    
* **Composable architecture.** MCP servers are small, focused services. It’s possible to run multiple servers for different backends and chain them together.
    

For MindLog, the MCP server is the interface between my vector database (Weaviate) and the tools I actually use in my day-to-day.

## Transport Options: HTTP vs stdio

MCP uses JSON-RPC to encode messages. JSON-RPC messages MUST be UTF-8 encoded.

Currently MCP supports two transport layers:

* HTTP
    
* STDIO
    

### HTTP

In Streamable HTTP transport, the server operates as an independent process that can handle multiple client connections. This transport uses HTTP POST and GET requests. The server MUST provide a single HTTP endpoint path (the MCP endpoint) that supports both POST and GET methods. For example, this could be a URL like [`https://example.com/mcp`.](https://example.com/mcp.)

Servers can optionally make use of [Server-Sent Events](https://en.wikipedia.org/wiki/Server-sent_events) (SSE) to stream multiple server messages. This permits basic MCP servers, as well as more feature-rich servers supporting streaming and server-to-client notifications and requests.

* **Pros:  
    -** Familiar to most developers.  
    - Easy to integrate with web frameworks, reverse proxies, and load balancers.  
    - Well-suited for multi-user or distributed deployments.
    
* **Cons:  
    -** Slightly more overhead (latency, headers, networking).  
    - Requires hosting infrastructure (container, server, etc.).
    

### STDIO

This transport communicates over standard in and standard out. Some considerations with regards to STDIO:

* The server reads JSON-RPC messages from its standard input (`stdin`) and sends messages to its standard output (`stdout`).
    
* Messages are delimited by newlines, and MUST NOT contain embedded newlines.
    
* The server MUST NOT write anything to its `stdin/stdout` that is not a valid MCP message.
    
* **Pros:  
    -** Very simple transport: client and server talk via standard input/output.  
    - Easy to run locally, especially in dev/test environments.  
    - Zero network setup required.
    
* **Cons:  
    -** Best for single-user or local use cases.  
    - Harder to scale or expose remotely.
    

For MindLog, and for now, I opted for **STDIO** because Claude Desktop supports it out of the box. But long-term, an HTTP-based server would allow me to run the service remotely and make it accessible across devices — It’s something I still need to think about.

### Authentication

As I'm running the server using STDIO transport and hosting it locally, I haven’t configured any authentication so far. I will include it if I move it to an HTTP base server and host it remotely.

If you want to learn more about the specification, you can read it [here](https://modelcontextprotocol.io/specification/2025-03-26).  

# Building an MCP Server in .NET

At its core, an MCP server is nothing more than a service that:

1. Defines a schema of tools/resources.
    
2. Implements a transport (STDIO or HTTP).
    
3. Wires those definitions to actual logic.
    

In .NET, we can use attributes to decorate tools that MCP should expose, and then let the server host them.

Here’s how I've defined the **MindLog MCP tool** that powers my knowledge base search:

#### **Program**:

```csharp
var builder = Host.CreateApplicationBuilder(args);
...
builder
    .Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
...
builder.Services.AddOptions();
builder.Services.AddScoped<WeaviateClient>();
builder.Services.AddSingleton<SentenceTransformer>();
```

The snippet above adds the MCP server, configures the STDIO transport and registers the tools that it finds in the assembly. I also register my `WeaviateClient` and the `SentenceTransformer` so that I can use them in my tool.

#### MCP Server Tool:

```csharp
[McpServerToolType]
public class KnowledgeBaseSearch
{
    [McpServerTool, Description("Searches my personal article knowledge base for any notes and articles i've written")]
    public static async Task<IEnumerable<Note>> Query(
        Helpers.WeaviateClient weaviateClient,
        SentenceTransformer sentenceTransformer,
        [Description("Query to be sent for article knowledge base search - this should be stripped of dates ranges or keywords")]
        string query,
        [Description("If a precise date time is provided, only this property should be populated, not the range - should be UTC format")]
        DateTime? specificDateTime,
        [Description("Start date time, if the original query includes date ranges - should be UTC format")]
        DateTime? startDateTime,
        [Description("End date time, if the original query includes date ranges - should be UTC format")]
        DateTime? endDateTime,
        [Description("Specific keywords used in the base query, ex: C#, dependency injection, and others. " +
        "These keywords should be translated to the available keywords Dotnet, Async, CSharp, LanguageFeatures, DependencyInjection, ASPNETCore, EFCore, Migrations" +
        "Inference should also be used, if the query relates to C#, CSharp and Dotnet should also be provided")]
        string[] keywords)
    {
...
```

My Knowledge Base Search class is decorated with `McpServerToolType`. This will be used by the server to discover all the existing tools within the assembly that are then decorate with `McpServerTool`.

The Description properties will be used to enhance any client connections to the server. This description helps the client determine which tool to call and will also provide guidance to our LLM on what and how to populate those values (which we will see in the next article).

It’s also worth noting that dependency injection also works by method injection convention, as here we are injecting `WeaviateClient` and `SentenceTransformer` in the tool method.

#### Knowledge base search:

```csharp
// We translate the simplified query and get the embeddings from the Sentence Transformer
var sentenceEmbeddings = await sentenceTransformer.GetEmbeddings(query);
var embedding = sentenceEmbeddings.Single().Embeddings.ToArray();

var weaviateClass = await weaviateClient.GetWeaviateClass();
var getQuery = weaviateClass.CreateGetQuery();

// Sets the graphql query to search for objects with similar embeddings
getQuery.Filter.NearVector(embedding);

var conditions = new List<ConditionalAtom<StorageModelWeaviate>>();

// Searches for any existing tags in the metadata
if (keywords is not null && keywords.Any())
{
    conditions.Add(When<StorageModelWeaviate, string[]>.ContainsAny("tags", keywords));
}

// Provides date ranges if provided
if (startDateTime is not null && endDateTime is not null)
{
    conditions.Add(When<StorageModelWeaviate, DateTime>.GreaterThanEqual("noteDate", startDateTime.Value));
    conditions.Add(When<StorageModelWeaviate, DateTime>.LessThanEqual("noteDate", endDateTime.Value));
}
else if (specificDateTime is not null)
{
    conditions.Add(When<StorageModelWeaviate, DateTime>.Equal("noteDate", specificDateTime.Value));
}

if (conditions.Any())
{
    getQuery.Filter.Where(Conditional<StorageModelWeaviate>.And(conditions.ToArray()));
}
else
{
    getQuery.Filter.Limit(10);
}

// Adds additional fields for the select
getQuery.Fields.Additional.Add(Additional.Id);
getQuery.Fields.Additional.Add(new Additional("certainty"));

//the package doesn't yet support this, so would only work with direct graphql query
//{
//    When<StorageModelWeaviate, float>.GreaterThan(["_additional", "certainty"], 0.7f)
//};

var graphQL = new GraphQLQuery
{
    Query = getQuery.ToString()
};

var queryResult = await weaviateClient.Db.Schema.RawQuery(graphQL);
var queryResultGet = queryResult.Data["Get"];
var queryResultGetData = queryResultGet["StorageModel"];
var weaviateModels = queryResultGetData.ToObject<StorageModelWeaviate[]>() ??
    throw new Exception("Weaviate model could not be deserialized");

return weaviateModel.Select(x => new Note()
{
    NoteDate = x.noteDate,
    NoteName = x.noteName,
    Section = x.section,
    Tags = x.tags,
    Text = x.text,
});
```

With the code for the service above I'm able to:

1. Translate the simplified query Claude will send me to vector embeddings.
    
2. Construct the GraphQL query from the embeddings and the filtering parameters.
    
3. Call Weaviate database and get the notes that are relevant for the query and filtering parameters.
    
4. Return them to the client (Claude).
    

# When “Near Enough” Isn’t Enough

One thing I noticed during testing (and became quickly frustrating) is that vector search doesn’t always feel as precise as you might hope. Because my knowledge base is mostly technical — and weighted towards .NET — queries often surfaced results that were *semantically close* but not actually relevant.

For example, if I asked specifically about **new features in C#**, the system would sometimes return notes on dependency injection or ASP.NET Core. They’re related at a conceptual level (same language, same ecosystem), but not what I really wanted.

This is a natural side-effect of how embeddings work: vectors capture what is semantically close but not the “exact topic”. The model sees C#, ASP.NET, and dependency injection as part of the same neighbourhood in vector space. Without additional constraints, you can easily get neighbours that are near — but not on point.

## Introducing a Certainty Threshold

The fix was to introduce a **certainty (or confidence) threshold** in the GraphQL query to Weaviate. Instead of accepting *any* close match, I required that results pass a minimum semantic similarity before they’re returned.

Here’s a an example query:

```graphql
{
    Get {
        StorageModel (
            nearVector: {
                vector: [........],
                certainty: 0.7
            }
            where: {
                operator: And,
                operands: [{
                    operator: ContainsAny,
                    path: ["tags"],
                    valueText: ["CSharp","Dotnet"]
                },
                {
                    operator: GreaterThanEqual,
                    path: ["noteDate"],
                    valueDate: "2023-01-01T00:00:00Z"
                },
                {
                    operator: LessThanEqual,
                    path: ["noteDate"],
                    valueDate: "2023-12-31T23:59:59Z"
                }]
            }
        ) {
            noteName
            noteDate
            text
            tags
            section
            _additional {
                id
                certainty
            }
        }
    }
}
```

By setting `certainty: 0.7`, I forced the query and search to be stricter. Results that were only loosely related (say, ASP.NET Core when I really wanted C# features) would fall below that threshold and be excluded.

## Balancing Precision and Recall

The right threshold isn’t one-size-fits-all. Too low, and I would drown “in noise”. Too high, and I would miss genuinely useful matches. I found that `0.7` worked well for my data — but the “best” number depends on:

* The **diversity** of the notes (more topics = lower threshold may help).
    
* The **embedding model** used (some produce tighter clusters).
    
* The **use case** (browsing vs. precise answering).
    

In the context of MindLog, introducing certainty thresholds was a key step in moving towards more precise results.

# Testing the MCP Server

MCP development is made much easier by the **Inspector tool.** You can run the inspector using:

```bash
npx @modelcontextprotocol/inspector
```

This launches a simple UI where we can:

* Browse the tools the server exposes.
    
* Inspect parameter descriptions.
    
* Run test queries and inspect responses.
    

![](https://cdn-images-1.medium.com/max/800/1*xDvgTokY2rCLz4sgZvOphQ.png)

> You might have noticed I’m using HTTP Transport in the screenshot above. I usually find it much easier to test using this transport compared to STDIO.

In the screenshot above I connected to my MCP server on port 5001.

The inspector also returns other relevant tools like `tool/list` , which is used to discover the existing tools in my server:

```json
{
  "method": "tools/list",
  "params": {}
}
```

 which responds with:

```json
{
  "tools": [
    {
      "name": "query",
      "description": "Searches my personal article knowledge base for any notes and articles i've written",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "description": "Query to be sent for article knowledge base search - this should be stripped of dates ranges or keywords",
            "type": "string"
          },
          "specificDateTime": {
            "description": "If a precise date time is provided, only this property should be populated, not the range - should be UTC format",
            "type": [
              "string",
              "null"
            ],
            "format": "date-time"
          },
          "startDateTime": {
            "description": "Start date time, if the original query includes date ranges - should be UTC format",
            "type": [
              "string",
              "null"
            ],
            "format": "date-time"
          },
          "endDateTime": {
            "description": "End date time, if the original query includes date ranges - should be UTC format",
            "type": [
              "string",
              "null"
            ],
            "format": "date-time"
          },
          "keywords": {
            "description": "Specific keywords used in the base query, ex: C#, dependency injection, and others. These keywords should be translated to the available keywords Dotnet, Async, CSharp, LanguageFeatures, DependencyInjection, ASPNETCore, EFCore, MigrationsInference should also be used, if the query relates to C#, CSharp and Dotnet should also be provided",
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "query",
          "specificDateTime",
          "startDateTime",
          "endDateTime",
          "keywords"
        ]
      }
    }
  ]
}
```

`query` is my existing tool that will perform the request.

I can then perform a test query to my MCP server:

```json
{
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {
      "query": "C# programming articles",
      "specificDateTime": "2023-01-01T00:00:00Z",
      "startDateTime": "2023-01-01T00:00:00Z",
      "endDateTime": "2023-12-31T23:59:59Z",
      "keywords": [
        "CSharp",
        "Dotnet"
      ]
    },
    "_meta": {
      "progressToken": 2
    }
  }
}
```

and the response:

```json
{
  "content": [
    {
      "type": "text",
      "text": "[{\"noteName\":\"cshap.md\",\"noteDate\":\"2023-05-25T00:00:00Z\",\"text\":\"C# 10 introduces several features aimed at reducing boilerplate and improving developer productivity.\",\"tags\":[\"Dotnet\",\"CSharp\",\"LanguageFeatures\"],\"section\":\"What\\u2019s New in C# 10\"},{\"noteName\":\"cshap.md\",\"noteDate\":\"2023-05-25T00:00:00Z\",\"text\":\"Simplifies namespace declarations by removing indentation: [csharp code] namespace MyApp; public class Program {   // ... }\",\"tags\":[\"Dotnet\",\"CSharp\",\"LanguageFeatures\"],\"section\":\"File-scoped Namespaces\"}, ....]"
    }
  ]
}
```

For MindLog, **Inspector** became an essential part of the workflow. It confirmed that:

* Tools were registered correctly.
    
* Parameters like `keywords` and `date ranges` were interpreted properly.
    
* The server returned valid responses before ever touching Claude Desktop.  
    

# Putting It All Together

With the MCP server in place, MindLog now has a clean, reusable interface for accessing my knowledge base. Instead of thinking about embeddings, certainty thresholds, or GraphQL queries, I can just expose a `KnowledgeBaseSearch` tool and let MCP handle the rest.

At this point, the system is “*AI-ready”*. Semantic search is available through a standard protocol that any compliant client can consume. For now, I’ve focused on making sure the foundation is solid: notes are parsed, embeddings are generated, results are filtered, and the MCP server ties everything together.

The next step is where things get really interesting: bringing Claude into the picture. That’s the focus of the final article in the series, **“Conversations with MindLog”**, where we’ll explore what it feels like to actually chat with your own second brain.

I hope this article has given you both insight and practical guidance into how MCP can turn a vector database into an accessible, AI-ready service. More importantly, I hope you’ve enjoyed following along and learned something you can apply in your own projects.

***Stay tuned — keep building, keep learning.***