![header](https://miro.medium.com/v2/resize:fit:770/1*y-8NaBH83BMBjuzDj40SVw.jpeg)

Welcome back!

This is the third part of our Kafka Series.

1. [Into to Kafka — Topics](https://medium.com/@marcio.duarte89/intro-to-kafka-1c62e4a6d1e1)  
2. [Producers](https://medium.com/@marcio.duarte89/producers-3241ed906f0a)  
3. Consumers  
4. [Inside Kafka’s CLI](https://medium.com/@marcio.duarte89/inside-kafka-cli-77e6179da50a)  
5. [Demo](https://medium.com/@marcio.duarte89/kafka-net-demo-8f42f83b89cb)

Kafka Consumers are an integral part of Kafka.

# What is a Consumer

Consumers are subscribers responsible for reading messages out of topic partitions.

Consumers work by issuing fetch requests to the broker leading the partitions it wants to consume from.

As mentioned in first [article](https://outofmemoryexception.hashnode.dev/series/kafka-series/topics), topics are divided into a set of totally ordered partitions, which are consumed by exactly one consumer within each subscribing consumer group at any given time. Each consumer keeps an offset of the next message to consume, making the state of what’s been consumed very small, the consumer also has control over the position it starts reading from and can rewind it to re-consume data if need be.

The offsets committed live in a kafka topic called `__consumer_offsets`. When a consumer in a group processes data received from Kafka, it should commit the offsets (We will talk more about commit strategies later).

![Pooling](https://miro.medium.com/v2/resize:fit:770/0*Td0BOf1B-n4_W8dg)

# Consumer Poll Behavior

While there are message bus technologies that use push models, Kafka Consumers use a poll model. This allows consumers to control where in the log they want to consume, how fast and gives them abilities to replay messages.

There are some important settings worth knowing about:

`fetch.min.bytes`: Default 1. This setting controls the minimum amount of data one want to poll on each request. Could help **improve** throughput by decreasing number of requests (potentially at the cost of latency).

`max.poll.records`: Default 500. This setting controls how many requests to receive per poll request. Depending on system requirements, one could increase this setting if messages are very small and/or one is not restricted by RAM.

`max.partition.fetch.bytes`: Default 1Mb. Maximum data returned by a broker per partition.

`fetch.max.bytes`: Default 50Mb. Maximum data returned for each fetch request (covers multiple partitions).

# Consumer Groups

Consumers read data in consumer groups. As long as there are more or equal partitions than consumers (in a single group), all consumers will be used.

![consumers read group](https://miro.medium.com/v2/resize:fit:770/0*iY7cnIB6jX4oB2Vw )

If one has more consumers than partitions, some consumers will be inactive.

![partitions](https://miro.medium.com/v2/resize:fit:674/0*Rbc01cw5cDmRzk44)

# Delivery Semantics for Consumers

Consumers choose when to commit offsets. There are 3 delivery semantics:

**At most once:**

* Offsets are committed **as soon** as the message is received.
    
* If the processing goes wrong, the message will be lost (it won’t be read again, unless the consumer rewinds to a previous offset).
    
![at most once](https://miro.medium.com/v2/resize:fit:770/0*XFiAL-zkwnBCol0h)

**At least once:**

* Offsets are committed **after** as the message is received.
    
* If the processing goes wrong, the message will be read again.
    
* Message processing needs to be idempotent.
    
![at least once](https://miro.medium.com/v2/resize:fit:770/0*_f1slHA5dZd2gn8g)

**Exactly once:**

# Consumer Offset Commit Strategies

There are 2 strategies:

`enable.auto.commit=true`: The Consumer commits the offsets periodically when calling poll (by default every 5000ms - `auto.commit.interval.ms`) - This works well if messaging processing is synchronous and failures are handled gracefully, otherwise delivery guarantees will be at most once as offsets will be committed before data is processed (as covered above).

`enable.auto.commit=false`: We control when we commit offsets and under what conditions we should commit them.

# Consumer Offset Reset Behaviours

A consumer is expected to read from a log continuously. If the consumer is down for more than 7 days, there could be data loss (depending of default configurations), as offsets become invalid.

`auto.offset.reset=latest`: Will read from the end of the log.

`auto.offset.reset=earliest`: Will read from the start of the log.

`auto.offset.reset=none`: Will throw exception if no offset is found.

`offset.retention.minutes`: Default 7 days, but can be more.

# Controlling Consumer Liveliness

Consumers in a group talk to a Consumer coordinator. To detect consumers are down there is a heartbeat and a poll mechanism. Consumers are encouraged to process data fast and poll often.

## Heartbeat thread

`session.timeout.ms`: Default 10 seconds. If no heartbeat is sent during that period, the consumer is considered dead.

`heartbeat.interval.ms`: Default 3 seconds. How often the heartbeat is sent. Should normally be 1/3 of the [session.timeout.ms](http://session.timeout.ms/)

## Consumer poll thread

`max.poll.interval.ms`: Default 5 min. Maximum amount of time between 2 poll calls before declaring the consumer dead. One should be careful with long running processes, otherwise Kafka could kill the consumer.

![Consumer pool thread](https://miro.medium.com/v2/resize:fit:594/0*LIxgRHQco0MWC82o)

Well, I guess its enough of Kafka theory for now! Let’s just start up Kafka and take it for a ride! See you in the [next article](https://medium.com/@marcio.duarte89/inside-kafkas-cli-77e6179da50a).

If you enjoyed this post, please give it a like or a share!