const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const { TweetTypes } = require('../lib/constants')
const graphql = require('graphql-tag')
const { mutate } = require('../lib/graphql')
const { getUserByScreenName } = require('../lib/users')
const { getTweetById, extractMentions } = require('../lib/tweets')
const ulid = require('ulid')

module.exports.handler = async(event) => {
  for (const record of event.Records) {
    if (record.eventName === "INSERT") {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      switch (tweet.__typename) {
        case TweetTypes.RETWEET:
          await notifyRetweeted(tweet)
          break
        case TweetTypes.REPLY:
          await notifyReplied(tweet)
          break
      }

      if (tweet.text) {
        const mentions = extractMentions(tweet.text)
        if (!_.isEmpty(mentions)) {
          await notifyMentioned(mentions, tweet)
        }
      }
    }
  }
}

async function notifyRetweeted(tweet) {
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

async function notifyReplied(tweet) {
  const promises = tweet.inReplyToUserIds.map(userId => 
    mutate(
      graphql `mutation notifyReplied(
        $id: ID!
        $userId: ID!
        $tweetId: ID!
        $repliedBy: ID!
        $replyTweetId: ID!
      ) {
        notifyReplied(
          id: $id
          userId: $userId
          tweetId: $tweetId
          repliedBy: $repliedBy
          replyTweetId: $replyTweetId
        ) {
          __typename
          ... on Replied {
            id
            userId
            tweetId
            repliedBy
            replyTweetId
            createdAt
            type
          }
        }
      }`,
      {
        id: ulid.ulid(),
        userId,
        tweetId: tweet.inReplyToTweetId,
        repliedBy: tweet.creator,
        replyTweetId: tweet.id
      }
    )
  )
  
  await Promise.all(promises)
}

async function notifyMentioned(screenNames, tweet) {
  const promises = (screenNames).map(async (screenName) => {
    const user = await getUserByScreenName(screenName.replace("@", ""))
    if (!user) { return }

    await mutate(
      graphql `mutation notifyMentioned(
        $id: ID!
        $userId: ID!
        $mentionedBy: ID!
        $mentionedByTweetId: ID!
      ) {
        notifyMentioned(
          id: $id
          userId: $userId
          mentionedBy: $mentionedBy
          mentionedByTweetId: $mentionedByTweetId
        ) {
          __typename
          ... on Mentioned {
            id
            userId
            mentionedBy
            mentionedByTweetId
            createdAt
            type
          }
        }
      }`,
      {
        id: ulid.ulid(),
        userId: user.id,
        mentionedBy: tweet.creator,
        mentionedByTweetId: tweet.id
      }
    )
  })
  
  await Promise.all(promises)
}