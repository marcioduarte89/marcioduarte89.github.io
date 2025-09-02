![header](https://miro.medium.com/v2/resize:fit:1155/1*hja5V5Ls7002jnRfYdPQsQ.jpeg)

In any telemetry-driven system, detecting anomalies is only half the work — responding to them quickly and reliably is just as critical. In Navora, the alerting pipeline is designed to be scalable, loosely coupled, and extensible, using Amazon SNS, Lambda, and a purpose-built DynamoDB Alerts table.

# **Why SNS for Alerts Distribution?**

We use Amazon SNS (Simple Notification Service) as the backbone of our alert distribution system. It allows us to fan out alert messages to multiple subscribers in real time, without coupling producers to consumers.

Amazon SNS delivers alert messages directly to a Lambda function (Telemetry Alerts). This integration is powerful because it’s:

- **Fully managed**: No need to poll or manage consumers.
    
- **Highly scalable**: SNS can handle millions of messages per second, ensuring that alert throughput scales with telemetry volume. SNS fans out messages to all subscribers in parallel.
    
- **Low latency**: Messages are typically delivered to Lambda within milliseconds.
    
- **Flexibility:** Multiple subscribers can independently consume alerts.
    

# **What Happens on Failure?**

When SNS invokes a Lambda function, it expects a successful response. If the Lambda fails (e.g., due to an exception or timeout), SNS will:

1. **Retry the message**:  
    \- SNS retries up to 3 times with exponential backoff.  
    \- If the Lambda continues to fail, the message is considered undeliverable.
    
2. **Dead-Letter Queue (DLQ) (optional but recommended)**:  
    \- You can configure an SQS DLQ for the Lambda subscription.  
    \- Failed messages are sent to the DLQ after all retries are exhausted.  
    \- This allows for manual inspection, reprocessing, or alerting on failures.
    
3. **Monitoring**:  
    \- CloudWatch metrics and alarms can be used to track invocation failures and retry attempts.  
    \- This is critical for maintaining observability and operational confidence.
    

# **DynamoDB Alerts Table: Designing for Query Efficiency**

Unlike the main telemetry table (which uses `VehicleId` and `Timestamp` as Partion and sort keys), the Alerts table is optimized for a different access pattern: querying alerts across all vehicles for a given day.

To support this, we use:

- Partition Key: `AlertDate` (e.g., `2025-06-13`).
    
- Sort Key: `VehicleId#Timestamp.`
    

This schema allows us to:

- Efficiently retrieve all alerts for a specific day.
    
- Avoid full table scans.
    
- Maintain a logical grouping of alerts by time and source.
    

This is a great example of designing DynamoDB tables based on access patterns, not just data structure.

# Idempotency and Deduplication in Alert Processing

In distributed systems, especially those involving retries and asynchronous messaging (like SNS → Lambda), idempotency is essential to ensure that the same alert isn’t processed or stored multiple times due to retries or duplicate messages.

## How Navora Handles Idempotency

To prevent duplicate alert records in DynamoDB, the Telemetry Alert Processor Lambda uses a conditional write:

```plaintext
var request = new PutItemRequest
{
    TableName = "Alerts",
    Item = item,
    ConditionExpression = "attribute_not_exists(AlertId)"
};
```

This ensures that if an alert with the same `AlertId` already exists, the write is skipped. This is particularly useful when:

- SNS retries a failed Lambda invocation.
    
- The same alert is accidentally published more than once.
    

## **Deduplication Strategy**

- AlertId could be generated deterministically (e.g., a hash of `VehicleId + Timestamp + AlertType`). This uniquely identifies an alert.
    
- This allows the system to safely retry without risk of duplication.
    
- It also enables idempotent downstream processing, such as logging, analytics, or notifications.
    

# **Strategies to Control Notification Volume:**

Some potential strategies to control notifications:

> *These strategies weren’t implemented as part of the project.*

1. **Track Notification State:**  
    \- Store a `Notified` flag or timestamp in the Telemetry Data table (and ignore notification in case of retrying).  
    \- Only send a notification if it hasn’t been sent yet.
    
2. **Throttle or Debounce Alerts:**  
    \- Implement logic to suppress repeated alerts for the same condition within a time window (e.g., 5 minutes).  
    \- Useful for noisy sensors or rapidly fluctuating metrics.
    
3. **Batch Notifications:  
    \-** Aggregate alerts and send summaries instead of individual messages.  
    \- Especially useful for email or dashboard-based alerting.
    
4. **Use SNS Message Attributes:  
    \-** Include metadata like `AlertType`, `Severity`, or `Source` to allow subscribers to filter or route messages intelligently.
    

If combining and implementing the above strategies, we can ensure alerts are:

- Processed exactly once.
    
- Stored without duplication.
    
- Notified responsibly.
    

This design not only improves system reliability but also enhances the user experience by reducing noise, costs and ensuring meaningful, actionable alerts.

> *Given this feature architecture and details is very similar to the previous post, I won’t add any screenshots or code snippets.*

With the alerting pipeline in place, Navora is now equipped to detect and respond to critical telemetry events in real time. But alerts are only part of the story — administrators need visibility and control over the system to manage configurations, review historical data, and interact with telemetry in meaningful ways. In the next post, we’ll explore the Telemetry Admin API, how it’s secured using Cognito, and how it exposes key functionality through a scalable, serverless interface. Stay tuned as we continue building out the operational backbone of Navora.