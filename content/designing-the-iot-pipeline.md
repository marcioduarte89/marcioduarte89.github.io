![header](https://miro.medium.com/v2/resize:fit:1155/1*hja5V5Ls7002jnRfYdPQsQ.jpeg)

In the previous [post](https://medium.com/@marcio.duarte89/the-architects-workshop-navora-laying-the-foundation-8f3242cb1796), we presented the functional and non functional requirements for Navora, as well as the proposed architecture. In this post we will breakdown how we’ve designed and implemented the IoT Telemetry ingestion pipeline.

In IoT systems, where devices continuously transmit data, the ingestion pipeline plays a critical role. It’s the entry point for telemetry — responsible for reliably capturing, transporting, and preparing data for downstream processing. In Navora, we needed a solution that could:

- Handle high-frequency input from thousands of vehicles.
    
- Maintain low latency.
    
- Scale without manual intervention.
    

To meet these demands, we designed a serverless, event-driven pipeline using **MQTT, AWS IoT Core, SQS, Lambda**, and **DynamoDB**. This architecture allows us to decouple ingestion from processing, ensure message durability, and handle telemetry efficiently — while remaining flexible enough to support alerting and long-term storage.

# Why MQTT?

We chose MQTT for telemetry ingestion because it is a lightweight, publish-subscribe protocol ideal for constrained devices. Compared to HTTP or WebSocket's, MQTT offers:

- **Low overhead:** Ideal for frequent, small payloads like telemetry data.
    
- **Persistent connections:** Reduces connection churn and latency.
    
- **Built-in QoS levels:** Supports delivery guarantees (at most once, at least once, exactly once).
    
- **Efficient bandwidth usage:** Especially important when scaling to thousands of devices.
    

## MQTT Architecture

MQTT uses a broker-based architecture:

1. **Publisher**: Sends messages to a topic.
    
2. **Broker**: Receives, filters and distributes messages.
    
3. **Subscriber**: Receives messages from subscribed topics.
    

## MQTT Consistency Guarantees

MQTT has different Quality of Services (QoS) to define delivery guarantees:

QoS 0 — At most once:

- No guarantee of delivery.
    
- Message is sent once, no acknoledgement.
    
- No retry if message is lost.
    
- Fastest, lowest overhead.
    

QoS 1 — At least once:

- Message is **guaranteed to arrive**, but may be **duplicated.**
    
- Sender retries until it gets an acknowledgment (PUBACK).
    
- Duplicates possible — subscriber must handle idempotency.
    

QoS 2 — Exactly once:

- Message is guaranteed to arrive **exactly once**.
    
- Uses a four-step handshake.
    
- Most reliable, but highest overhead.
    

## MQTT Ordering Guarantees

MQTT guarantees **per-topic, per-client session** ordering for QoS 1 and 2. To maintain order, the broker waits for acknowledgments before sending the next message. If persistent sessions are enabled, unacknowledged messages can be redelivered when the client reconnects.

Here’s a little summary for MQTT consistency and order guarantees:

# How AWS IoT Core Fits In

AWS IoT Core acts as a **fully managed MQTT broker**, handling:

- Device authentication and authorization.
    
- Topic-based message routing.
    
- Scalable ingestion.
    
- Seamless integration with AWS services (SQS, Lambda, etc.)..
    

This lets us focus on business logic instead of managing broker infrastructure.

## Publishing Telemetry with MQTTnet

Now, let’s look at how we publish telemetry from a device using [`MQTTnet`](https://github.com/dotnet/MQTTnet).

> *Prerequisite: The device (Thing) must be registered in AWS, with its certificate, policy, and endpoint properly configured.*

```csharp
var config = new ConfigurationBuilder()
     .AddJsonFile($"appsettings.json")
     .Build();

var iotSettings = config.GetSection("iotSettings").Get<IoTSettings>();

var caCert = X509Certificate.CreateFromCertFile("Path to *.pem file");
var clientCert = new X509Certificate2("Path to *.cert.pfx", "AWS-Cert-Password");

var caChain = new X509Certificate2Collection();
caChain.ImportFromPem(caCert.GetCertHashString());

var mqttClientOptions = new MqttClientOptionsBuilder()
    .WithClientId(Guid.NewGuid().ToString())
    .WithTcpServer(iotSettings.Endpoint, iotSettings.Port)
    .WithTlsOptions(
        new MqttClientTlsOptionsBuilder()
        .WithTrustChain(caChain)
        .WithClientCertificates(new List<X509Certificate2> { clientCert })
        .WithSslProtocols(System.Security.Authentication.SslProtocols.Tls12)
        .Build())
    .WithCleanStart(false) // persistent session
    .WithProtocolVersion(MqttProtocolVersion.V500)
    .Build();

var mqttFactory = new MqttClientFactory();
var mqttClient = mqttFactory.CreateMqttClient();

var connection = await mqttClient.ConnectAsync(mqttClientOptions, CancellationToken.None);

var vehicleTelemetryData = new VehicleTelemetryData()
{
    VehicleId = 1,
    TimeStamp = DateTime.UtcNow,
    Speed = 60,
    CargoTemperature = 50,
    EngineTemperature = 50,
    FuelLevel = 90,
    IgnitionStatus = true,
    Location = new Nest.GeoCoordinate(51.5072, 0.1276)
};

 var serializedVehicle = JsonSerializer.Serialize(vehicleTelemetryData);

 var message = new MqttApplicationMessageBuilder()
     .WithTopic($"{iotSettings.Topic}/{vehicleTelemetryData.VehicleId}")
     .WithPayload(serializedVehicle)
     .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
     .Build();

 await mqttClient.PublishAsync(message, CancellationToken.None);
```

This client uses:

- TLS for secure communication.
    
- **Persistent sessions** for ordered delivery.
    
- **QoS 1** for at-least-once delivery.
    

To test if messages are being received:

- Create a subscriber client with the topic format: `{iotSettings.Topic}/{vehicleId}`.
    
- Or use the AWS IoT MQTT test client to monitor published messages (also needs to have a topic specified).
    

# Decoupling with SQS

Once messages are received by IoT Core, they are forwarded to **Amazon SQS**. This decoupling is critical for:

- **Scalability:** SQS can buffer spikes in telemetry traffic, preventing downstream overload.
    
- **Reliability:** Messages are durably stored until processed.
    
- **Flexibility:** Enables asynchronous processing and retries without blocking ingestion.
    

# Processing with Lambda and DynamoDB

Our **Telemetry Processor Lambda** is triggered by SQS and processes messages in **batches** (typically 10 per batch).

Why batching helps:

- Reduces Lambda invocation overhead.
    
- Increases throughput.
    

But batching has caveats:

- If one message fails, the entire batch is retried after the visibility timeout.
    
- Without **idempotency**, duplicates can corrupt data.
    
- This can lead to [**snowball effects**](https://docs.aws.amazon.com/prescriptive-guidance/latest/lambda-event-filtering-partial-batch-responses-for-sqs/best-practices-partial-batch-responses.html#snowball-anti-patterns) where failed messages cause growing retries.
    

Mitigating the risks:

- **Selective acknowledgment:** We only delete messages from the queue that were successfully processed, allowing partial batch success.
    
- **Idempotency:** We use conditional writes in DynamoDB.
    

In order to configure Partial batch response we must also enable `ReportBatchItemFailures` in the Lambda’s event source mapping to make only the failed messages visible again.

> *The above settings will be set in the CloudFormation Stack.*

The code snippet below shows how we are handling the processing of messages from the SQS Queue in the Telemetry Processor Lambda Function.

```plaintext
[LambdaFunction]
public async Task<SQSBatchResponse> FunctionHandler([FromServices] IAmazonDynamoDB dynamoDbClient, SQSEvent evnt, ILambdaContext context)
{
    List<BatchItemFailure> batchItemFailures = [];

    // Iterate over the messages in the batch
    foreach (var message in evnt.Records)
    {
        try
        {
            await ProcessMessageAsync(dynamoDbClient, message, context);
        }
        catch (Exception ex)
        {
            // TODO: handle the exception appropriately!

            //Add failed message identifier to the batchItemFailures list
            batchItemFailures.Add(new BatchItemFailure { ItemIdentifier = message.MessageId });
        }
    }

    // return only the message that failed
    return new SQSBatchResponse(batchItemFailures);
}

private async Task ProcessMessageAsync(IAmazonDynamoDB dynamoDbClient, SQSEvent.SQSMessage message, ILambdaContext context)
{
    var payload = JsonSerializer.Deserialize<VehicleTelemetryData>(message.Body, OPTIONS);

    // set the payload to be sent to DynamoDB
    var item = new Dictionary<string, AttributeValue>
    {
        { "vehicleId", new AttributeValue { N = payload.VehicleId.ToString() } },
        { "timestamp", new AttributeValue { S = payload.Timestamp.ToString("o") } },
        { "location", new AttributeValue { S = payload.Location.ToString() } },
        { "speed", new AttributeValue { S = payload.Speed.ToString() } },
        { "fuelLevel", new AttributeValue { S = payload.FuelLevel.ToString() } },
        { "engineTemperature", new AttributeValue { S = payload.EngineTemperature.ToString() } },
        { "cargoTemperature", new AttributeValue { S = payload.CargoTemperature.ToString() } },
        { "ignitionStatus", new AttributeValue { S = payload.IgnitionStatus.ToString() } },
        { "messageId", new AttributeValue { S = message.MessageId.ToString() } },
    };

    // by checking the Message Id in the condition we make sure we are not
    // inserting duplicated data.
    var request = new PutItemRequest
    {
        TableName = "TelemetryData",
        Item = item,
        ConditionExpression = "attribute_not_exists(MessageId)"
    };

    var response = await dynamoDbClient.PutItemAsync(request);

    // If the item was inserted in DynamoDB and has an Alert, then publish the message to the alert topic
    if (response.HttpStatusCode == HttpStatusCode.OK && payload.HasAlert())
    {
        // Gets the AlertsTopic Arn
        var topicArn = await _topicsService.GetTopicArnByName("AlertsTopic");

        if (topicArn is null)
        {
            // TODO: handle unexpected flow here (move message to error queue for example)
            // TODO: Log the error
            Console.WriteLine("No topic has been found");
            return;
        }

        var publishRequest = new PublishRequest
        {
            TopicArn = topicArn,
            Message = message.Body,
        };

        // TODO: Handle the result of the publish
        await _snsService.PublishAsync(publishRequest);
    }
}
```

## A Note on AWS Lambda Annotations

We use [**AWS Lambda Annotations**](https://docs.aws.amazon.com/sdk-for-net/v3/developer-guide/aws-lambda-annotations.html) to simplify function setup. This approach eliminates boilerplate code for:

- Dependency injection.
    
- Input/output mapping.
    
- Validation.
    

The annotations generate the necessary handlers during build time using Source Code generators. We need to configure the Lambda to point to the generated function entry point, otherwise it will attempt to use the main one in the project.

# Putting It All Together

Once we simulate a code change in the `TelemetryProcessor` service, open a PR, and merge it (we need to have a milestone in the PR):

![PR open with Service milestone](https://miro.medium.com/v2/resize:fit:554/1*6IheuC6-Pf3NpHmD7v1EuA.png)

1. The CI/CD pipeline will be triggered.

![CI/CD pipeline](https://miro.medium.com/v2/resize:fit:1110/1*-ohi7B-7NOPcIcnnLg_Pvg.png)

Let’s see what was executed as part of the publish step:

![CI pipeline](https://miro.medium.com/v2/resize:fit:427/1*r8QAMTv8P2iASAW6fv7EXg.png)


![CD pipeline](https://miro.medium.com/v2/resize:fit:764/1*dtUqCsq8mxjapy_9OViO1g.png)


2\. A versioned release is created.

![Service release](https://miro.medium.com/v2/resize:fit:1155/1*h9yew_wwEd2juzwQnO_m7A.png)

3\. A new Docker image is published to ECR:

![Telemetry Processor in ECR](https://miro.medium.com/v2/resize:fit:1155/1*GrZMyE1lea6ANtRLE-hbaQ.png)

The CloudFormation stack is created/updated.

![Created stacks](https://miro.medium.com/v2/resize:fit:1155/1*PONuI4JXsyEKvx2i8Gjrlw.png)


4\. All required resources — Thing, SQS, Lambda, DynamoDB, Roles— are deployed.


![Aws Thing](https://miro.medium.com/v2/resize:fit:1155/1*Gw7EwQ2_N6bQDGa2VMGZSw.png)

![Forwarding rule](https://miro.medium.com/v2/resize:fit:1155/1*o8zqO_gDJdmUyDtyHnmVew.jpeg)

![Lambda Function](https://miro.medium.com/v2/resize:fit:1155/1*YBTbhVMzMHuPHi-CxZQgww.png)


We can now use the **IoTDeviceApp** (or similar) to generate real telemetry traffic. While this data won’t trigger alerts (yet), it proves the ingestion flow is working end-to-end.

We can validate this by:

- Inspecting **DynamoDB** to see new entries appear every 10 seconds.
    
- Monitoring **CloudWatch** logs and metrics for throughput and billing.
    
![TelemetryData DynamoDB table](https://miro.medium.com/v2/resize:fit:1155/1*vGJYmdKZC_U-vvi-JHp2-A.png)

![Telemetry Processor Lambda Function monitoring](https://miro.medium.com/v2/resize:fit:1155/1*m-qRIRYXt1vYS753c5N_Yg.png)

![Billing](https://miro.medium.com/v2/resize:fit:1155/1*Tdf3Ku59vDLh0by79V6iHg.jpeg)

# Wrapping Up

This has been a deep dive into telemetry ingestion — from MQTT design decisions to AWS implementation details and resilience patterns. We’ve explored the critical role of decoupling and idempotency in building robust serverless data pipelines.

In the next post, we’ll explore the **Alerts Processing Service**, which kicks in when telemetry indicates abnormal vehicle behavior.

**Thanks for reading — see you in the next post!**