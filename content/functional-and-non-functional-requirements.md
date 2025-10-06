![header](https://miro.medium.com/v2/resize:fit:1155/1*hja5V5Ls7002jnRfYdPQsQ.jpeg)

In the previous [post](https://medium.com/@marcio.duarte89/welcome-to-the-architects-workshop-1cae5e0b834d), we introduced the concept of The Architect’s Workshop and its first Series — Navora. In this post we will define the functional and non-functional requirements for our fictional company.

# Project Overview

> We operate a logistics company with a fleet of delivery vehicles across the UK. We need a cloud-native system to monitor our fleet in real time. The system should ingest telemetry data from vehicle-mounted IoT devices, process and store this data, and provide real-time alerts and analytics to fleet managers.

# Functional Requirements

## Actors:

**Vehicle device** IoT Sensor:

- Sends telemetry data every 10seconds.
    
Data includes:  
  - Vehicle Id number
  - Timestamp (ISO 8601)  
  - Location (lat, long)  
  - Speed (km/h)  
  - Fuel Level (%)  
  - Engine Temp (°C)  
  - Cargo Temp (°C)  
  - Ignition Status (on/off)
    

**Fleet Manager:**

- Views real-time vehicle locations
    
- Receives alerts for:  
    - Overheating engine (> 100ºC)  
    - Low fuel (<15%)  
    - Cargo temperature out of range (2ºC — 8ºC)
    
- Views historical data.
    

# Non-Functional Requirements:

* Scalability: Must support up to 10,000 vehicles sending data every 10 seconds.
    
* Latency: Real-time data should be available within 3 seconds of ingestion.
    
* Durability: All telemetry must be stored for at least 1 year.
    
* Security: Data must be encrypted in transit and at rest.
    
* Availability: Ensure 99.9% uptime for APIs and alerting.

# Technical Requirements:

To meet the functional and non-functional requirements, a cloud-based serverless architecture is proposed.

Project and architecture setup:

- A monorepo in GitHub with CI/CD via GitHub Actions.
    
- CloudFormation for infrastructure as code.
    
- AWS IoT Core → SQS → Lambda for telemetry ingestion and processing.
    
- SNS + Lambda(s) for alerting.
    
- API Gateway + Cognito + Lambda for admin APIs.
    
- DynamoDB to persist telemetry time-series data.
    
- Cloudwatch for Logging, Monitoring and tracing.
    
- S3 for persistent storage.
    

## Benefits of the Proposed Architecture

**Scalability**

> Requirement: Support up to 10,000 vehicles sending data every 10 seconds.

- AWS Lambda and SQS scale automatically with demand. We don’t need to provision or manage servers to handle spikes in telemetry data.
    
- IoT Core can handle millions of messages per second, and SQS decouples ingestion from processing, ensuring that bursts of data don’t overwhelm downstream services.
    
- DynamoDB supports millisecond latency at scale, which is essential for querying recent telemetry data in near real-time.
    
- With on-demand capacity mode, it automatically adjusts to traffic patterns — ideal for unpredictable IoT workloads.
    

**Low Latency**

> Requirement: Real-time data should be available within 3 seconds of ingestion.

- AWS Lambda functions are event-driven and near instantaneous in execution. Combined with SQS and SNS, this architecture ensures that telemetry is processed and alerts are triggered within milliseconds to seconds.
    
- No cold start issues for frequently invoked functions due to AWS’s provisioned concurrency options if needed.
    

**Durability**

> Requirement: Store telemetry for at least 1 year.

- We can integrate AWS Lambda with DynamoDB or S3 for long-term storage. These services are highly durable (11’s for S3) and cost-effective for large volumes of time-series data.

- DynamoDB offers high durability with automatic multi-AZ replication.
    
- Data is stored redundantly across multiple facilities, ensuring it remains safe for the required 1-year retention period.
    

**Security**

> Data must be encrypted in transit and at rest.

- AWS services like IoT Core, SQS, SNS, and Lambda support TLS encryption in transit and KMS encryption at rest by default.
    
- Cognito provides secure authentication and authorization for the Admin API, integrating seamlessly with API Gateway.
    

**High Availability**

> Requirement: 99.9% uptime for APIs and alerting.

- AWS manages the availability and fault tolerance of services like Lambda, API Gateway, DynamoDb and SNS. These services are deployed across multiple Availability Zones by default.
    
- No need to manage failover, load balancing, or patching — AWS handles it.
    

**Cost Consideration**

| Component | Pricing Model | Cost Efficiency |
| -------- | ------- | ------- |
| Lambda | Pay per request and execution time | No idle cost; scales to zero |
| SQS | Pay per request | Decouples services without compute overhead |
| SNS | Pay per publish and delivery | Low-cost alerting mechanism |
| DynamoDB | Pay per read/write or on-demand | Scales with usage; no over-provisioning |
| API Gateway | Pay per request | Ideal for low-to-medium traffic APIs |
| Cognito | Pay per MAU (monthly active user) | Cost-effective for secure auth |
| CloudFormation | Free | Infrastructure management at no cost |
| GitHub Actions | Free tier + usage-based | Scales with your CI/CD needs |

**Architecture Considerations**

- No idle infrastructure: Costs are incurred only when the system is active.

- Granular scaling: Each component scales independently, avoiding over-provisioning.

- Predictable billing: Especially with DynamoDB on-demand and Lambda’s transparent pricing.

- Meets all non-functional requirements: scalability, latency, durability, security, and availability.

- Minimizes operational overhead: no servers to patch, scale, or monitor.

- Future-proof: easily extendable with services like DynamoDB Streams, Step Functions, or EventBridge.
    

## Architecture Diagram & Workflows

![Navora’s Architecture](https://miro.medium.com/v2/resize:fit:1155/1*wB_AbMXEiXUC_Tf3AMR_FQ.png )

**CI/CD Pipeline Description:**

1. A pull request (PR) is created in GitHub, triggering the CI pipeline::  
    1.1 The milestone and version are verified.  
    1.2 The project is built.  
    1.3 Tests are executed.
    
2. Once the PR is merged to `main`, the CD pipeline is triggered:  
    2.1 The deployment agent logs in to AWS ECR.  
    2.2 The version is retrieved from the milestone.  
    2.3 A new tag is created.  
    2.4 A new Release is created.  
    2.5 The Docker image is built with the new version and published to ECR.  
    2.6 CloudFormation stack is deployed for the service.
    

**Workflow description:**

1. IoT device sends messages to the MQTT broker using the Telemetry topic.
    
2. The broker forwards the message to SQS.
    
3. The Telemetry Processor Lambda Function:  
    3.1 Pulls telemetry entries from the SQS queue.  
    3.2 Enriches the data set.  
    3.3 Persists the telemetry data in the TelemetryData DynamoDB table.  
    3.4 Verifies if any limits have been reached.  
    3.5 If limits have been reached, a new event is published to the Alerts Topic.

4. The Alerts Topic listens to any events published and forwards the events to a Telemetry Alerts Processor Lambda Function and to the Email service.  
    4.1 The Telemetry Alerts Processor, processes the alert and persists the data in the TelemetryAlerts DynamoDB table.  
    4.2 The Email service sends an email to the Administration and to the driver.
    
4. The Administration platform:  
    5.1 Authenticates using user credentials from a user pool in Cognito.  
    5.2 Accesses historical and alerts data using API Gateway which is backed up by a Telemetry Administration Lambda Function.
    

## **Monorepo**

We’ve chosen a Monorepo setup because Monorepos excel at code sharing and consistency, simplifying dependency management and collaboration across projects. Another aspect we wanted to explore with the monorepo setup was centralized build and release management across different projects (ie. we don’t want to build and deploy services when they haven’t been changed).

**Monorepo and service folder structure**

![Folder structure](https://miro.medium.com/v2/resize:fit:789/1*yWvEWRQnBVC1UM5TGxOMmw.png)

Services are organized within their specific folders. Each service contains the corresponding Dockerfile and cloudformation-template for deployment.

**GitHub actions**

GitHub actions and workflows are located under `.github > workflows` and `.github > actions`. Each workflow corresponds to a separate service which will build and deploy the corresponding service, ex:

![Release files](https://miro.medium.com/v2/resize:fit:1079/1*sHi2xapWqxnFy3Lad1YsEg.png)

## Release management

Release management happens through GitHub milestones with the following template: {service}-{SemVer}, ex: TelemetryProcessor-V1.0.0.  
The milestone will be used to generate the appropriate artifacts, create docker images, deployments and create a new tag and a new release.

> *In a later chapter we’ll discuss potential alternatives/improvements to this approach, especially around the tagging of the milestone with a specific SemVer version as this wouldn’t be scalable in bigger teams developing multiple features in the same service.*

# GitHub and AWS Configuration Setup

In order to be able to build, test, publish images to ECR and deploy CloudFormation stacks, we need to add some configuration to both AWS and GitHub:

## AWS

In order to publish images and deploy CloudFormation Stacks we have to create a new user with the appropriate permissions to be able to perform all of our CD tasks. We called ours github-actions. We also need to create an Access key for this user so that we can use it in GitHub.
Once the user is created we also created two user groups: cloudformation-stack-operations and push-pull-images.

**push-pull-images —** Has all the necessary permissions to manage ECR images on the Navora ECR repository.

**cloudformation-stack-operations —** Has all the necessary permissions to deal with CloudFormation stacks as well as to manage the creation, update and deletion of the involved services.

## GitHub

For GitHub we need to create a few secrets that will be used to authenticate and communicate with AWS:

- AWS_ACCOUNT_ID

- AWS_ACCESS_KEY_ID

- AWS_SECRET_ACCESS_KEY

- AWS_SECRET_REGION
    

So far we’ve covered quite a lot in the first post. Thanks for reading and stay tuned for the next post, where we’ll dive deeper into the IoT device integration and the telemetry ingestion pipeline.