const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')
const { TweetsType } = require('../lib/constants')
const { getTweetById } = require('../lib/tweets')

const { USERS_TABLE, TWEETS_TABLE, TIMELINES_TABLE } = process.env

module.exports.handler = async(event) => {
  const { username } = event.identity
  const { tweetId, text } = event.arguments
  const id = ulid.ulid()
  const timestamp = new Date().toJSON()

  const tweet = getTweetById(tweetId)
  if (!tweet) {
    throw new Error("Tweet is not found")
  }

  const inReplyToUserIds = await getInReplyToUserIds(tweet)
  const newTweet = {
    __typename: TweetsType.REPLY,
    id,
    creator: username,
    createdAt: timestamp,
    inReplyToTweetId: tweetId,
    inReplyToUserIds,
    text,
    likes: 0,
    replies: 0,
    retweets: 0
  }

  const transactionItems = [
    {
      Put: {
        TableName: TWEETS_TABLE,
        Item: newTweet
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
        UpdateExpression: 'Add replies :one',
        ExpressionAttributeValues: {
          ':one': 1
        },
        ConditionExpression: 'attribute_exists(id)'
      }
    },
    {
      Put: {
        TableName: TIMELINES_TABLE,
        Item: {
          userId: username,
          tweetId: id,
          timestamp,
          inReplyToTweetId: tweetId,
          inReplyToUserIds
        }
      }
    }
  ]

  await docClient.transactWrite({
      TransactItems: transactionItems
  }).promise();

  return true
}

async function getInReplyToUserIds(tweet) {
  let userIds = [tweet.creator]
  if (tweet.__typename === TweetsType.REPLY) {
    userIds = userIds.concat(tweet.inReplyToUserIds)
  } else if (tweet.__typename === TweetsType.RETWEET) {
    let originalTweet = await getTweetById(tweet.retweetOf)
    userIds = userIds.concat(await getInReplyToUserIds(originalTweet))
  }

  return _.uniq(userIds)
}