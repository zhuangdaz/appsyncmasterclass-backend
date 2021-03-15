const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')
const { TweetsType } = require('../lib/constants')

const { USERS_TABLE, TWEETS_TABLE, TIMELINES_TABLE, RETWEETS_TABLE } = process.env

// 1. create a new item in tweets_table, retweets_table
// 2. create a new item to timelines_table if it is a retweet of other's tweet
// 3. update the tweetCount in users_table, retweetCount in tweets_table
module.exports.handler = async(event) => {
  const { username } = event.identity
  const { tweetId } = event.arguments
  const id = ulid.ulid()
  const timestamp = new Date().toJSON()

  const getTweetResp =  await docClient.get({
    TableName: TWEETS_TABLE,
    Key: {
      id: tweetId
    }
  }).promise()

  const tweet = getTweetResp.Item

  if (!tweet) {
    throw new Error("Tweet is not found")
  }

  const newTweet = {
    __typename: TweetsType.RETWEET,
    id,
    creator: username,
    createdAt: timestamp,
    retweetOf: tweetId
  }

  const transactionItems = [
    {
      Put: {
        TableName: TWEETS_TABLE,
        Item: newTweet
      }
    },
    {
      Put: {
        TableName: RETWEETS_TABLE,
        Item: {
          userId: username,
          tweetId: id,
          createdAt: timestamp
        },
        ConditionExpression: 'attribute_not_exists(tweetId)'
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
    },
    {
      Update: {
        TableName: TWEETS_TABLE,
        Key: {
          id: tweet.id
        },
        UpdateExpression: 'Add retweets :one',
        ExpressionAttributeValues: {
          ':one': 1
        },
        ConditionExpression: 'attribute_exists(id)'
      }
    }
  ]

  console.log(`creator: [${tweet.creator}]; username: [${username}]`)
  if (tweet.creator != username) {
    transactionItems.push({
      Put: {
        TableName: TIMELINES_TABLE,
        Item: {
          userId: username,
          tweetId: id,
          retweetOf: tweetId,
          timestamp
        }
      }
    })
  }

  const request = docClient.transactWrite(
    {
      TransactItems: transactionItems
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