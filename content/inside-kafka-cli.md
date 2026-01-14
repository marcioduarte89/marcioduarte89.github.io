![header](https://miro.medium.com/v2/resize:fit:770/1*y-8NaBH83BMBjuzDj40SVw.jpeg)

Welcome to our fourth part of our Kafka Series!

This is what we covered so far:

1. [Into to Kafka — Topics](https://medium.com/@marcio.duarte89/intro-to-kafka-1c62e4a6d1e1)  
2. [Producers](https://medium.com/@marcio.duarte89/producers-3241ed906f0a)  
3. [Consumers](https://medium.com/@marcio.duarte89/consumers-c21fb73a84af)  
4. Inside Kafka’s CLI  
5. [Demo](https://medium.com/@marcio.duarte89/kafka-net-demo-8f42f83b89cb)

In this article we’ll spin up Kafka (and Zookeeper) using Docker (usage of Docker is not in the scope of this post) and we’ll use some of the most common and important Kafka’s CLI commands.

Using the following docker compose file:

Run: `docker-compose up`.

If no errors are thrown while Kafka and Zookeeper are starting, you should now be able to connect to both Kafka and Zookeeper using ports 19092 and 22181, respectively.

Now, let’s connect to Kafka’s container shell, first run `docker ps` to get the container id then run the following command: `docker exec -w /bin --interactive --tty {container-id} bash`

# Brokers definitions through Zookeeper

We can get a list of available Brokers by connecting and querying Zookeeper: `zookeeper-shell zookeeper:2181 ls /brokers/ids`

This should output the following:

![brokers](https://miro.medium.com/v2/resize:fit:521/0*oxD5XCbEFjd1Rz9n)

Where 1 is the Id of our Broker.

We could then query the definition of the Broker, by using:

`zookeeper-shell zookeeper:2181 get /brokers/ids/1` which would output the broker configuration:

![zookeeper](https://miro.medium.com/v2/resize:fit:770/0*Fxxzi022tfaYcR_g)

Its also possible to get all sorts of other information from the Brokers, such as seqids, topics, etc. But i’ll leave that up to you to explore.

# Managing topics

Kafka has quite a good CLI documentation, if one just types `kafka-topics` the whole list of options to manage Topics will show up, the same list and helpful tips will be shown if one makes a mistake while running a invalid command.

![topics](https://miro.medium.com/v2/resize:fit:733/0*9dI9D4vhC3iB2MyC)

In order to operate on topics we need to specify a bootstrap-server, let’s list the available topics: `kafka-topics --bootstrap-server kafka:19092 --list` this should output only one topic, `__consumer_offsets`, which holds topic offsets.

Let’s now create a topic which we will later use in our Client application, to create a topic use the following command:

`kafka-topics --bootstrap-server kafka:19092 --topic transactions --create --partitions 3 --replication-factor 3`

The following error should be thrown:

`Error while executing topic command : Replication factor: 3 larger than available brokers: 1. [2021-11-10 14:44:08,783] ERROR org.apache.kafka.common.errors.InvalidReplicationFactorException: Replication factor: 3 larger than available brokers: 1. (kafka.admin.TopicCommand$)`

Given we only have one broker running, Kafka won’t allows us to have a replication factor &gt; 1. So let’s just amend that, set it to 1, and create the `transactions` topic.

`kafka-topics --bootstrap-server kafka:19092 --topic transactions --create --partitions 3 --replication-factor 1`.

Let’s now take a look at the details of the new topic we just created: `kafka-topics --bootstrap-server kafka:19092 --topic transactions --describe`

This should return:

![Partitions](https://miro.medium.com/v2/resize:fit:770/0*MvTQac1646TaKb8b)

This should be expected, given the topic was created with 3 partitions, and it only has 1 Broker, with ID 1, the Leader, Replicas and Isr will be Broker 1.

You could also delete a topic if you wish to by inputting the following command:

`kafka-topics --bootstrap-server kafka:19092 --topic transactions --delete`. But we won't delete it as it will be used later for our Demo application.

# Producers CLI

In order to produce messages one needs to use `kafka-console-producer`. The command to produce to our new topic should be:

`kafka-console-producer --bootstrap-server kafka:19092 --topic transactions`.

This will then allow you to input any messages you want.

If one wants to increase delivery guarantees, can use `--producer-property` setting: `kafka-console-producer --bootstrap-server kafka:19092 --topic transactions --producer-property acks=all`.

If a message was produced to a topic that did not exist, the topic would be created there and then — Although errors related to leader election could have been generated, but eventually, Kafka would retry, the topic would be created and the message produced.

As seen in previous posts, there are quite a lot of settings that can be configured in the producer, I invite you to take a look at it and explore at your own time.

# Consumers CLI

Consuming messages uses `kafka-console-consumer`. If you now use a similar command to connect to the broker and to the topic, ex: `kafka-console-consumer --bootstrap-server kafka:19092 --topic transactions` (and assuming you produced messages to the topic in the previous section) we then don't see any messages being processed.. This is because this consumer will only start consuming messages from the point it was launched, if one wants to consume all messages, one has to specify `--from-beginning`. Keep in mind that messages that were produced without specifying a partition, might be read out of order when consumed.

When running the consumer, and no group is specified, it will use a default consumer group. If one wants to run the consumer in a group, we need to add: `--group {name of the group}` setting and as seen before, if more than one consumer are in a given group, messages will be split across consumers.

# Consumer Groups CLI

Kafka consumer groups command use `kafka-consumer-groups`. To list existing consumer groups, one can use: `kafka-consumer-groups --bootstrap-server kafka:19092 --list`.

Describing a consumer group, will list the partitions, their current-offset (where the consumer is currently reading), Log-end-offset (where the log ends) and the LAG (how much reading is left): `kafka-consumer-groups --bootstrap-server kafka:19092 --describe --group {name of the group}`

![offsets](https://miro.medium.com/v2/resize:fit:770/0*Ws6R9zcu6oSezyt1)

If one wants to reset offsets, the following command could be used: `kafka-consumer-groups --bootstrap-server kafka:19092 --group my_group --reset-offsets --to-earliest --execute --topic transactions`. There are a few options to when one would want to reset the offsets, `kafka-consumer-groups` documentation provides all of this information.

# Kafka GUI Tools

Just before we wrap up this section, would still like to add a couple of tools that can be used to manage, topics, messages, producers/consumers in Kafka through a User Interface. These tools are: [Offset Explorer](https://www.kafkatool.com/download.html) and [Conduktor](https://www.conduktor.io/)

Next, join me where we will create a new .NET application where we will produce and consume from our newly created `transactions` topic. See you [there](https://medium.com/@marcio.duarte89/kafka-net-demo-8f42f83b89cb).

If you enjoyed this post, please give it a like or a share!