const DynamoDB = require('aws-sdk/clients/dynamodb')
const { getTweetById } = require('../lib/tweets')
const graphql = require('graphql-tag')
const { mutate } = require('../lib/graphql')
const ulid = require('ulid')

module.exports.handler = async(event) => {
  for (const record of event.Records) {
    if (record.eventName === "INSERT") {
      const like = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      await notifyLiked(like)
    }
  }
}

async function notifyLiked(like) {
  const tweet = await getTweetById(like.tweetId)
  await mutate(
    graphql `mutation notifyLiked(
      $id: ID!
      $userId: ID!
      $tweetId: ID!
      $likedBy: ID!
    ) {
      notifyLiked(
        id: $id
        userId: $userId
        tweetId: $tweetId
        likedBy: $likedBy
      ) {
        __typename
        ... on Liked {
          id
          userId
          tweetId
          likedBy
          createdAt
          type
        }
      }
    }`,
    {
      id: ulid.ulid(),
      userId: tweet.creator,
      tweetId: like.tweetId,
      likedBy: like.userId
    }
  )
}