const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')
const { TweetTypes } = require('../lib/constants')
const { extractHashTags } = require('../lib/tweets')

const { USERS_TABLE, TWEETS_TABLE, TIMELINES_TABLE } = process.env

// 1. create a new item in tweets_table
// 2. create a new item to timelines_table
// 3. update the tweetCount in users_table
module.exports.handler = async(event) => {
  const { text } = event.arguments
  const { username } = event.identity
  const id = ulid.ulid()
  const timestamp = new Date().toJSON()
  const hashTags = extractHashTags(text)

  const newTweet = {
    __typename: TweetTypes.TWEET,
    id,
    text,
    creator: username,
    createdAt: timestamp,
    likes: 0,
    replies: 0,
    retweets: 0,
    hashTags
  }

  const request = docClient.transactWrite(
    {
      TransactItems: [
        {
          Put: {
            TableName: TWEETS_TABLE,
            Item: newTweet
          }
        },
        {
          Put: {
            TableName: TIMELINES_TABLE,
            Item: {
              userId: username,
              tweetId: id,
              timestamp
            }
          }
        },
        {
          Update: {
            TableName: USERS_TABLE,
            Key: {
              id: username
            },
            UpdateExpression: 'Add tweetsCount :one',
            ExpressionAttributeValues: {
              ':one': 1
            },
            ConditionExpression: 'attribute_exists(id)'
          }
        }
      ]
    }
  )

  request.on('extractError', (response) => {
    if (response.error) {
      const cancellationReasons = JSON.parse(response.httpResponse.body.toString()).CancellationReasons;
      console.log(JSON.stringify(cancellationReasons))
      response.error.cancellationReasons = cancellationReasons;
    }
  });
  await request.promise();
  return newTweet
}