const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()

const { USERS_TABLE, TWEETS_TABLE, TIMELINES_TABLE, RETWEETS_TABLE } = process.env

module.exports.handler = async(event) => {
  const { username } = event.identity
  const { tweetId } = event.arguments

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

  const queryResp = await docClient.query({
    TableName: process.env.TWEETS_TABLE,
    IndexName: 'retweetsByCreator',
    KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
    ExpressionAttributeValues: {
      ':creator': username,
      ':tweetId': tweetId
    },
    Limit: 1
  }).promise()

  const retweet = _.get(queryResp, 'Items.0')

  if (!retweet) {
    throw new Error("Retweet is not found")
  }

  const transactionItems = [
    {
      Delete: {
        TableName: TWEETS_TABLE,
        Key: {
          id: retweet.id
        },
        ConditionExpression: 'attribute_exists(id)'
      }
    },
    {
      Delete: {
        TableName: RETWEETS_TABLE,
        Key: {
          userId: username,
          tweetId
        },
        ConditionExpression: 'attribute_exists(tweetId)'
      }
    },
    {
      Update: {
        TableName: USERS_TABLE,
        Key: {
          id: username
        },
        UpdateExpression: 'Add tweetsCount :minusOne',
        ExpressionAttributeValues: {
          ':minusOne': -1
        },
        ConditionExpression: 'attribute_exists(id)'
      }
    },
    {
      Update: {
        TableName: TWEETS_TABLE,
        Key: {
          id: tweetId
        },
        UpdateExpression: 'Add retweets :minusOne',
        ExpressionAttributeValues: {
          ':minusOne': -1
        },
        ConditionExpression: 'attribute_exists(id)'
      }
    }
  ]

  console.log(`creator: [${tweet.creator}]; username: [${username}]`)
  if (tweet.creator != username) {
    transactionItems.push({
      Delete: {
        TableName: TIMELINES_TABLE,
        Key: {
          userId: username,
          tweetId: retweet.id
        },
        ConditionExpression: "attribute_exists(tweetId)"
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
  return true
}