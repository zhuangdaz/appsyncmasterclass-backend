const DynamoDB = require('aws-sdk/clients/dynamodb')
const { TweetTypes } = require('../lib/constants')
const { getTweetById } = require('../lib/tweets')
const graphql = require('graphql-tag')
const { mutate } = require('../lib/graphql')
const ulid = require('ulid')

module.exports.handler = async(event) => {
  for (const record of event.Records) {
    if (record.eventName === "INSERT") {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      switch (tweet.__typename) {
        case TweetTypes.RETWEET:
          await notifyRetweeted(tweet)
          break
      }
    }
  }
}

async function notifyRetweeted(tweet) {
  // call notifyRetweeted mutation
  const retweetOf = await getTweetById(tweet.retweetOf)
  await mutate(
    graphql `mutation notifyRetweeted(
      $id: ID!
      $userId: ID!
      $tweetId: ID!
      $retweetBy: ID!
      $retweetId: ID!
    ) {
      notifyRetweeted(
        id: $id
        userId: $userId
        tweetId: $tweetId
        retweetBy: $retweetBy
        retweetId: $retweetId
      ) {
        __typename
        ... on Retweeted {
          id
          userId
          tweetId
          retweetBy
          retweetId
          createdAt
          type
        }
      }
    }`,
    {
      id: ulid.ulid(),
      userId: retweetOf.creator,
      tweetId: retweetOf.id,
      retweetBy: tweet.creator,
      retweetId: tweet.id
    }
  )
}