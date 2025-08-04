![header](https://miro.medium.com/v2/resize:fit:770/1*y-8NaBH83BMBjuzDj40SVw.jpeg)

We have finally made it! This will be the fifth and last article in our Kafka Learning Series, and the culmination of our theoretical learning with a real demo!

This is what we covered so far:

1. [Into to Kafka — Topics](https://medium.com/@marcio.duarte89/intro-to-kafka-1c62e4a6d1e1)  
2. [Producers](https://medium.com/@marcio.duarte89/producers-3241ed906f0a)  
3. [Consumers](https://medium.com/@marcio.duarte89/consumers-c21fb73a84af)  
4. [Inside Kafka’s CLI](https://medium.com/@marcio.duarte89/inside-kafka-cli-77e6179da50a)  
5. Demo

# Bank

Our demo bank application is composed by 3 projects:

## Producer.API:

.NET Core 5.0 Web API with a Transactions API to simulate the creation of transactions. These transactions are sent to Kafka via Idempotent producer which produces to the transaction topic. It uses UserId as the message key (ensuring messages from the same user will always be sent to the same topic partition).

## Consumer:

Worker which consumes messages from the transactions Topic. This consumer disables auto commit. Messages are processed and offsets committed separately.

## Contracts:

Holds the Transaction Message type.

![Transaction message type](https://miro.medium.com/v2/resize:fit:277/0*A7_A8_JCwCJvitKu)

# Producer:

## Application Settings:

### Registration:

We register the IProducer as a service so that we can tidy up the code a bit more on the Producer application. As you can see, we define our producer as `Idempotent` and to `Ack=All`.

We also created a Transaction service so that our controller is quite light and doesn’t have any infrastructure code and concerns.

The message is defined to take the UserId as its Key, and then the payload of the transaction is serialized into the actual content of the message.

Our controller is as simple as:

# Consumer:

## Application Settings:

### Consumer worker:

As you can see, we will be looping through until the Worker actually stops. We subscribe to the `transactions` topic, and we consume from it. Kafka doesn't have an async API for the Consume method (you can check the thread [here](https://github.com/confluentinc/confluent-kafka-dotnet/issues/487)), so this call will actually block the current thread, one can specify the amount of time to block until it exits the `Consume` method. There are a few important configurations in the Consumer:

```csharp
var config = new ConsumerConfig 
{ 
    BootstrapServers = bootstrapperServer, 
    GroupId = consumerGroupId, 
    AutoOffsetReset = AutoOffsetReset.Earliest, 
    EnableAutoCommit = false, 
    EnableAutoOffsetStore = false 
};
```

Its set to disable auto commits, meaning its our responsibility to commit the offset. Offset position is to be Earliest when there is no committed offset.

Two other important statements are:

```csharp
consumer.StoreOffset(consumerResult); 
consumer.Commit(consumerResult);
```

`StoreOffset` Stores offsets for a single partition based on the topic/partition/offset of a consume result. The offset will be committed according to `EnableAutoCommit` and `AutoCommitIntervalMs`.

`Commit` Commits an offset based on the topic/partition/offset of a ConsumeResult.

As you can see its quite easy to work with Kafka .NET Client. You can find the repo [here](https://github.com/marcioduarte89/Kafka.Bank.Demo).

This concludes our Kafka Learning series, I hope you have liked it, and learned something from it! If you have please, give the Like button a click or share it to help me out produce more content.