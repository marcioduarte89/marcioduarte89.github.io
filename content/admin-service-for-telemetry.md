![header](https://miro.medium.com/v2/resize:fit:1155/1*hja5V5Ls7002jnRfYdPQsQ.jpeg)

In Navora’s architecture, the **Admin Service** acts as the control center — a secure interface where administrators can monitor vehicle activity, review historical telemetry, and respond to alerts as they happen. Navoras Control Center brings observability and operational control to the heart of the system. In this post, we’ll explore how the Admin Service is designed and built using AWS serverless components. We’ll focus on how we provide secure access, expose telemetry data efficiently, and maintain a scalable, low-maintenance architecture that can evolve as the system grows.

# A Single Entry Point for Admin Operations

Unlike user-facing APIs, which often split functionality across multiple endpoints and microservices, the Admin Service consolidates its logic into **a single Lambda function** behind an **Amazon API Gateway (HTTP API)**. This decision was intentional.

Because this service is relatively low-traffic and used primarily by internal staff, we optimized for simplicity over micro-level modularity. The Lambda function serves as the backend for multiple admin operations — including retrieving recent alerts, accessing historical telemetry, and filtering vehicle data. Each API route is routed internally to the appropriate handler within the same Lambda.

This design provides a clean, cohesive boundary around the admin domain and makes it easy to share infrastructure like database clients, logging utilities, and authentication checks — all without sacrificing performance for our expected load.

Of course, we’re aware that single-function architectures can grow unwieldy. To counteract this, the function should be modularized internally with clear separation between routes, domain logic, and integrations. This should make the service easy to navigate and extend while keeping the deployment footprint minimal.

# Securing Access with Cognito and API Gateway

Given the sensitive nature of the data involved — including real-time location and alert information — strong access control is non-negotiable.

To achieve this, we integrated **Amazon Cognito** for user authentication. Admins sign in using Cognito’s hosted UI or through federated identity providers (such as an enterprise IdP), and their identity is validated via **API Gateway’s Cognito authorizer**.

This approach offers several advantages. First, it keeps the Lambda code clean — authentication is handled at the API Gateway layer, so only verified users can even reach the function. Second, it aligns with a broader serverless philosophy: offload what you can to managed services. Finally, Cognito scales easily with the organization, supporting user groups, role-based access, and multi-factor authentication out of the box.

Zoom image will be displayed

![Navora Admin Service architecture](https://miro.medium.com/v2/resize:fit:1155/1*JsJXGINqyVQz0w6O0hg_Iw.png)


## Best Practices for Cognito Authentication in Admin Services

When building admin interfaces — especially for internal control panels like Navora’s — it’s essential to follow **secure, modern OAuth2 standards**. The recommended pattern is:

**Authorization Code Flow with PKCE (Proof Key for Code Exchange).**

This flow is secure even in **single-page apps (SPA)** or **mobile clients**, where storing a client secret is not safe.

## Overview: Cognito Code Flow with PKCE

Here’s how the full flow works step-by-step:

![Code flow with PKCE](https://miro.medium.com/v2/resize:fit:833/1*gn5Ul6f0Nu36nhbtZO-t8w.png)


**1\. Admin User Tries to Log In**

- Admin is redirected to Cognito’s **Hosted UI**.
    
- The frontend app initiates an **OAuth 2.0 Authorization Code Flow with PKCE**, generating:
    
- A `code_verifier` (random secret).
    
- A **code\_challenge** (hashed from `code_verifier`, usually using SHA-256).
    
- The frontend app sends the user to:
    

```sh
https://<your-domain>.auth.<region>.amazoncognito.com/oauth2/authorize
```

With query parameters like:

```plaintext
response_type=code
client_id=...
redirect_uri=...
code_challenge=... (from code_verifier)
code_challenge_method=S256
```

**2**. **User Logs In via Hosted UI**

- The user authenticates (e.g., with username/password or enterprise IdP via SAML/OIDC).
    
- Cognito then **redirects back to your app** with a `?code=...` query param.
    

**3\. Token Exchange (Backend or Frontend)**

- The app sends a `POST` request to:
    

```plaintext
https://<your-domain>.auth.<region>.amazoncognito.com/oauth2/token
```

with:

```plaintext
grant_type=authorization_code
code=<authorization_code>
client_id=<your app client id>
redirect_uri=<same as before>
code_verifier=<original verifier>
```

If the `code_verifier` matches the previously submitted `code_challenge`, Cognito returns:

- **ID Token** (JWT describing the user, used for identity)
    
- **Access Token** (JWT used to authorize API requests)
    
- **Refresh Token** (used to silently refresh tokens later)
    

**4.** **Calling the Admin API**

The frontend/client app **attaches the Access Token** as a bearer token in an `Authorization` header:

```plaintext
Authorization: Bearer eyJ... (access_token)
```

- **API Gateway** uses the **Cognito Authorizer** to validate the token.
    
- If valid, API Gateway passes the request to the Lambda function with user claims.
    

## Why Use Code Flow with PKCE?

- No client secret needed — Ideal for public clients (SPAs, mobile).
    
- Mitigates code interception — The code can’t be used without the verifier.
    
- Leverages Cognito Hosted UI — You avoid building and securing your own login form.
    
- Multi-Provider Support — Cognito can federate to enterprise IdPs, Google, Facebook, etc.
    
- Standards-compliant — Aligns with OAuth 2.1 and OpenID Connect.
    

# Reading from DynamoDB: Alerts and History

The Admin Service primarily reads from two DynamoDB tables: The **Telemetry** A**lerts** and **Telemetry History**.

The **Telemetry** **Alerts** table captures all triggered events — from high temperature, low fuel — tagged with metadata such as severity, vehicle ID, timestamps and vehicle position. These are queried frequently to populate the dashboard with recent incidents.

The **Telemetry** **History** table stores rolling telemetry snapshots per vehicle — position, speed and other contextual signals over time. When administrators want to investigate the lead-up to a particular alert, they can retrieve this history to build a full picture of what was happening in the vehicle before and after the event.

We chose DynamoDB for its performance characteristics and fit for our access patterns. Admin operations tend to involve key-based or time-range queries — tasks DynamoDB excels at. It’s fully managed, scales elastically, and with on-demand capacity mode, we only pay for what we use.

While DynamoDB is optimized for these access patterns, we’re mindful of limitations around ad-hoc querying and indexing. That said, for this service’s use case — targeted lookups driven by admin workflows — it’s the right tool for the job.

**Example of query history by vehicle id:**

```csharp
private async Task<List<T>> Query<T>(long vehicleId)
{
    var telemetryData = new List<T>();
    var queryResults = _dynamoDbContext.QueryAsync<T>(vehicleId);
    while (!queryResults.IsDone)
    {
        telemetryData.AddRange(await queryResults.GetNextSetAsync());
    }

    return telemetryData;
}
```

This is a classic usage of **AWS SDK for .NET’s DynamoDBContext**, which implements a **lazy-loading paginated query** under the hood.  
How it works:

- `QueryAsync<T>()` returns a `AsyncSearch<T>` **object** — a wrapper that handles paging through DynamoDB results.
    
- DynamoDB queries are **paginated by default**, with a **maximum page size of 1MB** or a user-specified `Limit`.
    
- The SDK’s pattern is:  
    \- Check `IsDone   `\- If false, call `GetNextSetAsync()` to fetch the next page.  
    \- Aggregate the results until done.
    

This lazy iteration model (looping with `IsDone`) offers:

- Streamlined memory use — We don’t need to buffer everything at once — but you can if you want.
    
- AWS-optimized SDK — Respects read capacity units (RCUs), retries, exponential backoff, etc.
    
- Transparent pagination — We avoid manually stitching `LastEvaluatedKey` tokens.
    

## DynamoDBContext vs DynamoDBClient

**Use** `DynamoDBContext` **when:**

- You want quick mapping of objects (e.g., telemetry DTOs).
    
- You’re doing basic Get/Query/Scan operations.
    

**Use** `DynamoDBClient` **when:**

- You need **precise control** over capacity units, filters, pagination, or consistency.
    
- You want to use **expression-based queries** or PartiQL.
    
- You’re building **general-purpose data access layers** or admin tooling.
    

# Performance, Scalability, and Cost Considerations

Despite its simplicity, this architecture scales remarkably well.

The single Lambda function handles all admin requests and scales horizontally with load. Cold starts are minimal thanks to AWS’s recent improvements and our use of lightweight dependencies. If traffic increases — say, during major fleet incidents — the service can handle it without manual intervention.

API Gateway’s HTTP API tier was chosen for its cost-effectiveness and lower latency compared to the REST API tier. And because everything is event-driven and pay-per-use, the system incurs no idle costs. This aligns with our goal of keeping the platform lean while still delivering enterprise-grade responsiveness.

# Putting It All Together

Once we simulate a code change in the `TelemetryAdmin` service, open a PR, and merge it (we need to have a milestone in the PR):

The CI/CD pipeline will be triggered.

![CI/CD pipeline](https://miro.medium.com/v2/resize:fit:1119/1*vSSAZVnX2Mm2F8vWcEbUoQ.png)


Let’s see what was executed as part of the publish step:

![CD Publishing steps](https://miro.medium.com/v2/resize:fit:645/1*Z_RQBowbcf_NhFj5l0O1gg.png)


A versioned release is created.

Zoom image will be displayed

![New Telemetry Admin service release](https://miro.medium.com/v2/resize:fit:1155/1*F4GbWYNx7TWVVdYp5GDMRw.png)


The CloudFormation stack is created/updated with all the resources to make this service work.

![Telemetry Admin Stack creation](https://miro.medium.com/v2/resize:fit:1026/1*6Ju3XYENSd3DiGY8LSm4FQ.png)


Cognito has now been created

![User pool](https://miro.medium.com/v2/resize:fit:898/1*GIiXt13KPuVmrIC9CcLIUA.png)


and the `AppClients` been configured:

Zoom image will be displayed

![Cognito and AppClient](https://miro.medium.com/v2/resize:fit:1155/1*cDPakywOOgfcN3WOGl88Ng.png)


We can now use the `AppClient` to verify the Identity Provider, OAuth grant types and OpenId scopes.

Zoom image will be displayed

![Cognito Login pages](https://miro.medium.com/v2/resize:fit:1155/1*bsW-6ii1OuoAhM_nsrI_LQ.png)


> *As you might have noticed, I've left* `ImplicitGrant` as an available grant type (instead of just having Authorization code with PKCE). As we haven’t created a real client (frontend) application, I'll be using this grant type for a little hack do get a valid access token to demo the service.

We can use the Cognito’s Login page to create a user for testing:

![Out of the box Login pages](https://miro.medium.com/v2/resize:fit:574/1*E-P17-Z8WnFP-9MzjNLjuA.png)


![User creation](https://miro.medium.com/v2/resize:fit:366/1*We3YLR102AJHsNQ3rqFtFQ.jpeg)

Once the user is created and verified, we can choose to login with the user. We will be redirected to the following page:

Zoom image will be displayed

![Authentication](https://miro.medium.com/v2/resize:fit:1155/1*gi5DR5wVPOGCxO45xPu24w.png)

For the little hack I mentioned above, we can update the `response_type=code`above with `response_type=token.`This will return to the callback URL with the access tokens in the URL.

Zoom image will be displayed

![Callback to get the access tokens](https://miro.medium.com/v2/resize:fit:1155/1*iIWQwj_lqo4-iPZYf-jg1w.png)

Callback to get the access tokens

We can now grab the token and check the claims provided.

Zoom image will be displayed

![Access Token](https://miro.medium.com/v2/resize:fit:1155/1*ogHopAq1N-BhAJCEIoIEfA.png)

Let’s now check our API Gateway. We can see the different routes, its authorizers and lambda integrations.

![API Gateway Routes and authorizer](https://miro.medium.com/v2/resize:fit:881/1*pH4a4RitgymaIYb1uZRjJA.png)


![API Gateway Lambda Integrations](https://miro.medium.com/v2/resize:fit:873/1*LjFxr4m4x1K3BFH6hUjScg.png)


As part of the `CloudFormation` deployment, the API Gateway was automatically deployed to a dev stage — so its ready to use.

Zoom image will be displayed

![API Gateway stage](https://miro.medium.com/v2/resize:fit:1155/1*zJ_XsCGvzZVYLX3BRzuDmw.png)


Let’s now try our API’s — The first test is calling any of the routes without a valid access token:

Zoom image will be displayed

![Unauthorized API call](https://miro.medium.com/v2/resize:fit:1155/1*XtzZgFidljGuIUKjsP_WeA.png)


Once we provide the Access token we got before and call the live Telemetry API we get the current live positions and details for our vehicles:

Zoom image will be displayed

![Live telemetry](https://miro.medium.com/v2/resize:fit:1155/1*fMeXo5LlncA8XVmQ5jUYjA.png)

We can get a specific vehicle Telemetry History:

Zoom image will be displayed

![Vehicle Telemetry history](https://miro.medium.com/v2/resize:fit:1155/1*R2YgK-Wf138Bi5CaW_MlPw.png)

We can also get all Vehicle information that emitted an alert:

Zoom image will be displayed

![Vehicle Alerts Telemetry](https://miro.medium.com/v2/resize:fit:1155/1*BOGqOcS2a-oz8G6WnfhUzw.png)

And finally we can see specific vehicle Alerts:

Zoom image will be displayed

![Api call](https://miro.medium.com/v2/resize:fit:1155/1*sRdU1aVasB5zZr-yERp7Tw.png)

# Looking Ahead

The Admin Service could continue to evolve. As alert volumes grow and admin workflows become more sophisticated, we could explore the addition of server-side filtering, paginated queries, and potentially a caching layer (such as Lambda-level in-memory caching or ElastiCache) for frequently accessed alert views.

We could also consider integration with `AWS EventBridge`or `WebSockets`to support real-time push notifications for critical alerts — giving admins faster situational awareness.

# Wrapping Up

As we’ve seen, the Admin Service leverages a minimal, serverless design — centered around a single, secure Lambda function and DynamoDB-backed data access — we’ve built a reliable and extensible control center for fleet monitoring.

It’s a great example of how a thoughtful approach to simplicity can yield powerful results, especially when backed by the flexibility and scalability of AWS’s serverless ecosystem.

In the next post — which will be a very important ones — we’ll dive on what we have learned, reflections on Architecture, trade-offs, and what we would do differently, I hope to see you there.