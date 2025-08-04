![header](https://miro.medium.com/v2/resize:fit:1155/1*hja5V5Ls7002jnRfYdPQsQ.jpeg)

## First Things First: This Was a Side Project

Let’s be clear — Navora isn’t a real product. It’s a side project I've been building in the margins of my day, usually with just a couple of hours (being generous here..) to spare after work. That constraint shaped a lot of the decisions I made. Some features were designed at a high level but never implemented. Others were simplified or skipped entirely to keep the momentum going. The code was never intended to be production ready code - as the intent was to make the system work.

This series was never about building a production-ready system. It was about exploring architecture, experimenting with AWS services, and sharing what I learned along the way.

## Architectural Intent vs. Reality

The architecture I designed was intentionally ambitious. I wanted to simulate a real-world telemetry platform with:

- IoT ingestion

- Stream processing

- Alerting

- Admin APIs

- Role-based access control

But not everything made it into the implementation. Here are some of the things I considered but didn't build:

- Dead Letter Queues (DLQs): I planned to add DLQs for SQS and Lambda to handle failed telemetry and alert messages. It's a best practice, but it would've added complexity and time I didn't have.

- Tests: I scaffolded test projects for all services to support CI, but I didn't write actual tests. In a real-world scenario, this would be a non-starter!

- Alert De-duplication: I mentioned de-duplicating alerts and notifications, but this logic wasn't implemented due to time constraints.

- IoT Rule Simplification: Instead of using AWS IoT rules to route messages directly, I chose to forward everything to SQS and process it in Lambda. This gave me more architectural flexibility, but in a real system (at least for the beginning), I'd likely opt for a simpler, more cost-effective path where messages that contain alert constraints would be forwarded directly into a specific queue, and we could potentially even bypass SNS flow.

- Authorization: Cognito and API Gateway were set up with basic auth flows. In production, I'd explore fine-grained access control, token scopes, and integration with enterprise identity providers.

- Strategies to reduce infrastructure costs like storage, reads/writes (ex: introduction of cache; TTL to expire old data; Archive older data to colder storages for cheaper long term storage).

## The Constraints of Testing in AWS

Testing AWS services locally was not always trivial on this project. LocalStack helped, but not all services are supported (or free) or behave identically. SAM CLI was inconsistent, and I often had to deploy to AWS just to test things properly (which would incur in expenses).

Even when running Lambdas locally against real AWS resources (like DynamoDB or SNS), I'd hit subtle issues that only appeared after deployment, ex:
> When processing Telemetry history and getting the SNS topic to publish Telemetry alerts to SNS, the entire execution worked locally but it failed when running on AWS. It turned out to be the Lambda function didn't have the necessary sns:Publish or sns:ListTopics permissions. AWS Cloudwatch was also not logging what was actually happening.

That lack of confidence in local testing slowed me down and made iterations harder than it should've been.

I was not always confident if the entire stack would continue to operate correctly when deploying individual services. So end to end testing strategies would need to be put in place in a real production environment to mitigate these concerns.

## Vendor Lock-In: A Real Concern?

Going all-in on AWS made development easier in some ways, but it also introduced tight coupling to the platform. Even with patterns like the repository pattern and service abstraction, some parts of the system - like DynamoDB queries - are inherently AWS-specific.

There are tools like AWS Annotations and frameworks that aim to abstract cloud providers code, but the reality is: **if you build for AWS, you're building *on* AWS**. That's not necessarily bad, **but it's a trade-off worth acknowledging**.

## Let's Talk About Cost

One of the most eye-opening exercises was estimating how much this architecture would cost at scale for Navora. Here's a rough breakdown based on:

- 10,000 IoT devices publishing telemetry every 10 seconds (assuming we would always have drivers operating the vehicles 24/7).

- AWS IoT Core -> SQS -> Lambda -> DynamoDB.

- 5% of messages triggering alerts via SNS and another Lambda.

- 3-5 back-office users querying telemetry and alerts via API Gateway.

The pricing values used in the previous breakdown are based on public AWS pricing documentation (approximate and simplified for estimation):

| AWS Service | Pricing Used (USD) |
| -------- | ------- |
| IoT Core | $1.00 per million messages |
| SQS | $0.20 per million invocations |
| Lambda Compute | $0.00001667 per GB-second |
| DynamoDB Writes | $1.25 per million write units |
| DynamoDB Reads | $0.25 per million read units |
| SNS | $0.50 per million publishes |
| API Gateway | $1.00 per million requests (HTTP API) |

These are simplified averages and may vary by region or usage tier. For production-grade estimates, you'd want to use the [AWS Pricing Calculator](https://calculator.aws/).

### Monthly message volume:

**Telemetry messages per month:**

- 10,000 devices x 6 (each 10 second per min) x 60 x 24 x 30 = 259,200,000 messages.

- Alert messages (5%):
259,200,000 x 0.05 = 12,960,000 alert messages.

With the above message volume in mind and the cost per compute highlighted earlier- processing costs would equate to:

| AWS Service | Pricing Used (USD) |
| -------- | ------- |
| IoT Core | $2592.00 |
| SQS | $1036.80 |
| Lambda (invocations) | $544.32 |
| Lambda (compute time) | $567.11 |
| DynamoDB (reads) | $648.00 |
| DynamoDB (writes) | $3240.00 |
| DynamoDB (alert writes) | $162.00 |
| SNS | $64.80 |
| API Gateway | $0.02 |
| Total | $8855.05 |

That's nearly $9,000/month - and that's without factoring in storage, monitoring, or data transfer costs.

**Storage Cost estimation:**

Payload size - The payload we used averages around 300bytes per message. For DynamoDB, AWS charges based on item size rounded up to the nearest 1 KB. So it will be billed as 1 KB per item.

1 GB = 1,024 MB = 1,048,576 KB

- 259,200,000 KB of Telemetry History / 1,048,576 = 247.2 GB

- 5 % of alerts = 259,200,000 x 0.05 = 12,960,000 KB / 1,048,576 = ~12.4 GB

This equates to:

| Table | Size (GB) | Monthly Cost (USD) |
| -------- | ------- | ------- |
| Telemetry | 247.2 | $61.80 |
| Alerts | 12.4 | $3.10 |
| Total | 259.6 | $64.90 |

**Updated Total Monthly Costs:**

**Compute costs:** $8,855.05 + **Storage costs:** $64.90 = $8,919.95/month.

This would be one of the most important factors if we were pitching this architecture to a potential real client.

### Exploring Hybrid and Cost-Conscious Alternatives

If this was a real-world project with a client concerned about infrastructure costs, nearly $9,000/month could be a tough sell. While the architecture we explored is scalable and cloud-native, it's also heavily reliant on on-demand services like Lambda, DynamoDB, and IoT Core - which are convenient but not always the most cost-effective at scale. We should discuss all different types of trade-offs with the clients.

**Pragmatic alternatives:**

A hybrid approach might look like:

- Use IoT Core for ingestion (still cost-effective for device connectivity).

- Replace Lambda with a Fargate service for telemetry processing and Admin Portal:
    - More predictable pricing.
    - Easier to manage shared state or in-memory caching.
    - Lose automatic scaling granularity of Lambda.
    - Need to manage container lifecycle, health checks, and deployments - Potentially higher operational overhead.
- Use RDS or MongoDB for telemetry storage:
    - Lower storage costs.
    - More flexible querying in some cases.
    - You manage scaling, backups, and availability.
    - May require more infrastructure and monitoring.

- Keep SNS for alert fan-out (cheap and reliable).

- If the Admin Portal was low traffic and internal we could:
    - Skip Cognito and use Microsoft Identity for authentication and replace API Gateway with a self-hosted Ocelot API Gateway, for example.
    - Alternatively, we could use other cloud native Identity platforms which have free tiers available like Azure AD B2C or Auth0.

## What I'd Do Differently

If I were to start over or take this project further, here's what I'd change:

- Simplify the architecture: Use IoT rules to route messages directly to DynamoDB or SNS where possible.

- Add observability early: Logging, tracing, and metrics would've saved me hours of debugging.

- Invest in end to end testing: This is a big one - Even basic integration tests would've improved confidence and reduced deployment surprises.

- Explore cost-saving options: Use batching, compression, caching, and reserved capacity where appropriate. Usage of non-serverless approaches.

- Design for portability: Abstract cloud-specific logic more aggressively to reduce lock-in.

## Final Thoughts

Navora was never about perfection. It was about **learning**, **experimenting**, and **sharing**. I hope this series gave you a glimpse into the thought process behind building cloud-native systems - and the trade-offs that come with it. The repository can be found at [https://github.com/marcioduarte89/Navora](https://github.com/marcioduarte89/Navora).

If you've followed along, thank you! I'd love to hear your thoughts, questions, or even your own war stories from the cloud trenches.

Until next time - keep building, keep learning.
