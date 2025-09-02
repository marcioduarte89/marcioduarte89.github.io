![Header](https://cdn.hashnode.com/res/hashnode/image/upload/v1755776465513/1a2356c4-a30a-4faf-a266-e349add16d55.jpeg)

---

The journey from raw Markdown notes to being able to “chat” with my notes begins with a parser. In the MindLog pipeline, the parser ensures that notes from the knowledge base are consistently extracted, segmented, and enriched before they ever reach the embedding stage.

---

### A Scheduled Service

The parser is designed as a lightweight **.NET Core CRON service**, scheduled to run at a certain interval. The reasoning here is that my knowledge base (using Obsidian) usually evolves on a daily basis, but in reality it doesn’t need real-time indexing. For my notes, a 12–24 hour indexing cadence ensures that new insights are captured in a timely manner without wasting compute cycles on excessive updates.

A **log file** stored in my knowledge base acts as a `lastUpdated` bookmark. Instead of re-parsing the entire knowledge base every run, generating and persisting the embeddings in the vector database, the service gets all the files in my knowledge base and only processes the ones that have been modified since the last recorded timestamp. This dramatically reduces processing overhead while keeping the vector store in sync with ongoing knowledge capture.

### Markdown and Frontmatter Parsing

The structure of each note matters. Markdown itself provides the textual flow, but my knowledge notes begin with **YAML frontmatter** — metadata describing date, resource, tags etc.  
My notes usually focus on a specific topic (are usually very targeted) and roughly follow the structure (below is just an illustration — Different items and order might be used):

```markdown
---
date:
resource:
tags:
---

# Heading level 1
Paragraph / Lists / Images / Links / Code

## Heading level 2
Paragraph / Lists / Images / Links / Code

# Heading level 1
Paragraph / Lists / Images / Links / Code
```

A more specific example could be:

````markdown
---
date: 2023-05-25
resource: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/
tags:
  - Dotnet
  - EFCore
  - Migrations
  - CSharp
---

# Managing Database Schema with EF Core Migrations

EF Core Migrations help manage changes to your database schema over time, keeping your code and database in sync.

## Common Commands

- Add a new migration:

```bash
dotnet ef migrations add AddCustomerTable
```

- Update the database:

```bash
dotnet ef database update
```

- Remove the last migration:

```bash
dotnet ef migrations remove
```

### Workflow
- Modify your entity classes.
- Add a migration to capture schema changes.
- Apply migration to the database.

Migrations generate code files describing schema changes, allowing version control and collaboration.

Check official docs: [EF Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/).
````

I like to have my notes organised within different folders based on top level topics, but this isn’t really needed as Obsidian search is great if you know what you are looking for and have notes well categorized.

To handle parsing reliably in .NET, two well-supported libraries are used:

* [**Markdig**](https://github.com/xoofx/markdig?utm_source=chatgpt.com) — a robust Markdown parser for .NET. It transforms raw Markdown into an abstract syntax tree, which makes extracting paragraphs, headings, and inline structures straightforward.
    
* [**YamlDotNet**](https://github.com/aaubry/YamlDotNet?utm_source=chatgpt.com) — a YAML parser for .NET, ideal for reading the frontmatter section at the top of each note. This metadata can later enrich embeddings with higher-level context, improving search relevance.
    

### Splitting Notes into Chunks?

One key design choice is how to represent a note for embeddings. The naive option would be to feed the entire note into a single embedding. But this comes with pitfalls:

* **Semantic dilution** — Although I try to keep my notes targeted, semantically, a single note might contain multiple concepts, and lumping them together risks blurring distinctions. For example, a note titled *Entity Framework* could discuss both *fluent api* and *optimistic concurrency*. One embedding would mix these unrelated ideas.
    
* **Granularity of retrieval** — When querying the vector store, smaller chunks improve precision. A question about *optimistic concurrency* should surface only the relevant section, not the entire note.
    
* **Scalability** — Embedding smaller paragraphs allows us to reuse relevant sections across multiple queries without regenerating embeddings.
    

The chosen approach is to split each note by the “items”, i.e.. paragraphs under **headings or subheadings, if they exist**. Paragraphs under the **headings**/**subheadings** become a discrete semantic unit with its own embedding. This strikes a balance between preserving context (headings are carried along as metadata) and ensuring embeddings remain tightly focused. Here’s an example split taking into consideration the above markdown:

![Note split](https://cdn-images-1.medium.com/max/880/1*HtdTuqMUNwc9NWKOormBuw.png)

The following type holds the representation of the markdown section:

```csharp
internal record MarkdownSection
{
    public Guid Id { get; init; }

    public string Text { get; init; } = default!;

    public string NoteName { get; init; } = default!;

    public DateTime NoteDate { get; init; }

    public IEnumerable<string> Tags { get; init; }

    public string? Section { get; init; }
}
```

Here’s an example of the data held in this type:

![Data in structure](https://cdn-images-1.medium.com/max/880/1*H9jbhgt3C75ha9XlFBdSJA.png)

Each note has a Id which is auto-generated, this Id is the identifier for the Markdown section which will be sent to the Embeddings service (together with the Text to generate the embedding).

### Embeddings via Python

Once the text chunks are identified, they need to be converted into embeddings. For this stage, we deliberately decouple from the .NET ecosystem and use a **Python microservice**. The reasoning is threefold:

* **Model ecosystem** — Python is the de-facto ecosystem for machine learning, with mature libraries and tooling.
    
* **SentenceTransformers** — Specifically, we use `all-MiniLM-L6-v2`, a well-regarded open-source embedding model. It offers an excellent trade-off:  
    * Free to use and self-hosted (no dependency on proprietary APIs).  
    * Compact (384-dimensional embeddings), making it efficient in storage and retrieval.  
    * High semantic performance relative to its size.  
    * **Avoiding wheel reinvention** — While technically possible to wrap a transformer model in .NET, it would require significant overhead in integration, performance tuning, and model compatibility. Python allows us to adopt the model out-of-the-box and focus engineering energy on the surrounding pipeline instead.
    

The Python service is built using [Flask](https://flask.palletsprojects.com/en/stable/). Flask is lightweight WSGI web application framework. It is designed to make getting started quick and easy, with the ability to scale up to complex applications.  
This Python service receives a:

```json
[
    { 
        "id": "384b03bf-85e1-4bfb-a922-76a61ca3581a",
        "text": "the text section to generate the embedding"
    },
    ..
]
```

it then generates the embeddings for the `text` and associates the embeddings to the `id`, this has the following advantages:

* Smaller payloads—We only send the Markdown section id and the text for the section, instead of the entire markdown metadata which the Embeddings service doesn’t need.
    
* We send all Markdown sections for a note — instead of calling the service per Markdown section, this reduces the overall number of API calls we make.
    

The Python service is written as follows:

```python
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)

# Load model once at startup
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/sentences-transform', methods=['POST'])
def transform_sentences():
    try:
        data = request.get_json()
        
        if not isinstance(data, list):
            return jsonify({"error": "Input must be a list"}), 400

        response = []
        for item in data:
            if not isinstance(item, dict) or 'id' not in item or 'text' not in item:
                return jsonify({"error": "Each item must be a list with 'id' and 'text'"}), 400

            sentence_id = item['id']
            text = item['text']
            embedding = model.encode(text).tolist()  # Convert numpy array to list

            response.append({
                "id": sentence_id,
                "embeddings": embedding
            })

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

Once the embeddings are generated, its then time to persist them in our Vector Database.

### The Vault: Why Weaviate for Vectors

Once embeddings are generated, they need a home — a system designed not just to store them, but to make them retrievable in a way that preserves their semantic power. This is where a vector database enters the pipeline.

#### Why a Vector Database at All?

Traditional databases excel at exact matches and well-structured queries. If you need to know *“what notes did I write on August 12th?”*, a relational database is perfect. But if you need to ask *“what notes talk about semantic search even if the word ‘semantic’ isn’t used?”*, traditional indexing falls short.

A vector database addresses this gap by supporting **approximate nearest neighbor (ANN) search** over high-dimensional embeddings. Instead of checking for keyword overlap, the database finds the embeddings closest in vector space to a query. This enables:

* **Semantic retrieval**—results are ranked by meaning, not exact token match.
    
* **Contextual discovery**—related notes can be surfaced even if phrased differently.
    
* **Scalability**—ANN indexes are optimized for large collections of embeddings, something relational databases struggle with at scale.
    

Could one retrofit a SQL or NoSQL database for embeddings? Yes — you could store embeddings as JSON arrays or blobs and run cosine similarity computations manually. But this would quickly become unmanageable for non-trivial datasets. Without native ANN indexing, query latency and cost would skyrocket.

#### Why Weaviate?

The vector database space has grown crowded: Pinecone, Milvus, Vespa, Qdrant — all offer ANN capabilities. Choosing Weaviate came down to three considerations:

1. **Integrated Hybrid Search**  
   Weaviate combines vector search with traditional filters (structured metadata, boolean queries, keyword matching). This is vital for knowledge bases, where I often want queries like *“What do I know about partition keys when using DynamoDb”*. (This query would automatically add #DynamoDb tag and filter notes further).
    
2. **Modular Deployment**  
   Unlike some commercial SaaS-first solutions, Weaviate is open-source and deployable on-prem or in the cloud. This flexibility avoids lock-in and makes it easy to start small, then scale.
    
3. **Ecosystem and Maturity**  
   Weaviate has strong documentation, an active community, and production-grade stability. It has features like schema enforcement, modularity, and hybrid search integration.
    

Ultimately, Weaviate balances **open-source control** with **production readiness**, making it a natural fit for my personal knowledge vault.

#### Abstracting Access with WeaviateNET

I could have written a client to interact with Weaviate via REST endpoints, but it wouldn’t have been the best usage of my (limited) time for my “pet projects”. Instead, after reading a good portion of the source code and doing some feature testing I was happy to use [WeaviateNET](https://github.com/Unipisa/WeaviateNET) as the client for my project. It provides:

* **Schema management** — defining object classes, properties, and vector fields directly from C#.
    
* **Data ingestion** — pushing embeddings (paragraphs + metadata) into Weaviate without writing raw HTTP calls.
    
* **Querying** — running both semantic vector searches and hybrid keyword queries with LINQ-like syntax.
    

#### Usage and Testing

I ran my Weaviate instance in a Docker [container](https://docs.weaviate.io/academy/py/starter_multimodal_data/setup_weaviate/create_docker).

I can always query data through the Weaviate API.. but having a GUI client is always better. For this I used [WeaviateCluster](https://github.com/Shah91n/WeaviateDB-Cluster-WebApp) — It’s not an official GUI client, but good enough for me.

![Collection schema](https://cdn-images-1.medium.com/max/880/1*CdeXhWuYFoxrXuh03eJOIg.png)

![Collection schema data](https://cdn-images-1.medium.com/max/880/1*ocRcS7fOYKbmgrEXQGH2XA.png)

### What’s Next?

We’ve walked through the first steps of turning Markdown notes into meaning: a **.NET Core parser** to process and split notes, a **Python embedding service** powered by `SentenceTransformers`, and a **vector database in Weaviate** to store and retrieve knowledge at a semantic level. These pieces lay the foundation for a system that doesn’t just capture text, but captures understanding.

I hope this helps you think about your own knowledge pipelines, and maybe gives you ideas for how to bring structure and semantics to your notes. Next up in: **Searching Smarter: Building an AI-Ready Knowledge Base**, where we’ll dive into how to query, retrieve, and unlock the potential of vectors.

Stay tuned—keep building, keep learning.