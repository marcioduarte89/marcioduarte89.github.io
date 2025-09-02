![header](https://miro.medium.com/v2/resize:fit:770/1*y-8NaBH83BMBjuzDj40SVw.jpeg)

This is the first article of a series of 5 where we will learn and discuss about some of Kafka features, its usage and in the end we’ll implement a small .NET demo application.

The series will be split in the following articles:

1. Into to Kafka — Topics  
2. [Producers](https://medium.com/@marcio.duarte89/producers-3241ed906f0a)  
3. [Consumers](https://medium.com/@marcio.duarte89/consumers-c21fb73a84af)  
4. [Inside Kafka’s CLI](https://medium.com/@marcio.duarte89/inside-kafka-cli-77e6179da50a)  
5. [Demo](https://medium.com/@marcio.duarte89/kafka-net-demo-8f42f83b89cb)

# What is Kafka

Apache Kafka is an open-source distributed event streaming platform used by thousands of companies for high-performance data pipelines, streaming analytics, data integration, and mission-critical applications.

Main usages of event streaming within current industries:

- Processing of payments and financial transactions in real-time, ex: stock exchanges, banks.
    
- Track and monitoring of vehicles in real-time.
    
- Continuously capture and analysis of sensor data from IoT devices or other equipment’s.
    
- Collection of customer interactions and orders for retail, hotel and travel industry.
    
- Connect, store, and make available data produced by different producers to a different set of consumers.
    
Kafka can be deployed on bare-metal hardware, virtual machines and containers on-premise as well as cloud environments.

# Topics

Kafka Topics are streams of data, categories used to organize messages. Each topic has a name which is unique across the entire Kafka cluster, and one can create as many topics as wanted. Messages are sent and received from Topics, in other words, producers write to Topics and consumers read from them.

# Anatomy of a topic:

![topic](https://miro.medium.com/v2/resize:fit:581/0*fLut0NU4jweEKJe1)

Topics are split into partitions. There are a few principles when it comes to Kafka Topics:

- Each partition is ordered, and order is only guaranteed within the partition.
    
- Each message within a partition gets an incremental Id, called offset.
    
- The number of partitions needs to be specified when creating a topic.
    
- Different partitions might have different numbers of messages.
    
- Offsets only have meaning within each specific partition.
    
- Data is only kept (retention policy) for a limited amount of time (default 7 days).
    
- Once data is written to a partition it can’t be changed/switched to a different partition (immutability).
    
- Data is assigned randomly to a partition unless a key is provided.
    
- Different consumers can consume different topics in parallel.
    

# Topic replication factor

When creating a topic one needs to think about the replication factor. Ideally it should always be &gt; 1 (unless its for testing purposes), where the standard is 3. This allows the topic to be scalable and fault tolerant as if any of its servers fails, the other servers will take over their work to ensure continuous operations without any data loss.

![replication factor](https://miro.medium.com/v2/resize:fit:673/0*HaNkmpXjlgcJFiX2)

# Brokers

Kafka is run as a cluster of one or more servers that can span multiple datacenters or cloud regions. These servers are called Brokers.

Each Broker is identifier with its Id, and it contains certain topic partitions. After connecting to any Broker (called the bootstrap broker), one will be connected to the entire cluster. Each broker knows about all brokers, topics and partitions.

![brokers](https://miro.medium.com/v2/resize:fit:770/0*ePaVaxrqWu58dyiK)

# Concept of partition leader

At any given time, only one broker can be a leader for a given partition. Only that leader can receive and serve data for the partition. Other brokers will just sync the data. Each partition has one leader and multiple ISR (In sync replicas). If the leader shuts down or fails, the next leader is chosen from the in-sync replicas.

![leader](https://miro.medium.com/v2/resize:fit:770/0*1o9HqVvoegsvBDTf)

# Zookeeper

One cannot talk about Kafka and not mention Zookeeper.

Kafka cannot work without Zookeeper. It manages brokers by keeping a list of them and helps perform leader election for partitions. It also sends notifications to Kafka in case of changes (new topics, down/up brokers, deleted topics). Zookeeper does not store consumer offsets.

Zookeeper by design operates with a odd number of servers. It also has a leader (which handles writes) the rest of the servers are followers (handle reads)

![zookeper](https://miro.medium.com/v2/resize:fit:770/0*XVBZgd8AOgQuIr-V)

Stick around, next we’ll talk about [Producers](https://medium.com/@marcio.duarte89/producers-3241ed906f0a)!