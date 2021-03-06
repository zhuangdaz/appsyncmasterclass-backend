require('dotenv').config()
const _ = require('lodash')
const AWS = require('aws-sdk')
const http = require('axios')
const fs = require('fs')

const user_exists_in_UsersTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for user [${id}] in table [${process.env.USERS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id
    }
  }).promise()

  expect(resp.Item).toBeTruthy()
  return resp.Item
}

const user_can_upload_image_to_url = async (url, filePath, contentType) => {
  const data = fs.readFileSync(filePath)

  await http({
    method: 'put',
    url,
    headers: {
      'Content-Type': contentType
    },
    data
  })

  console.log("Uploaded image to", url)
}

const user_can_download_image_from_url = async (url) => {
  const resp = await http(url)

  console.log("Downloaded image from", url)

  return resp.data
}

const tweet_exists_in_TweetsTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for tweet [${id}] in table [${process.env.TWEETS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.TWEETS_TABLE,
    Key: {
      id
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

const retweet_exists_in_TweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for retweetOf [${tweetId}] in table [${process.env.TWEETS_TABLE}]`)
  const resp = await DynamoDB.query({
    TableName: process.env.TWEETS_TABLE,
    IndexName: 'retweetsByCreator',
    KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
    ExpressionAttributeValues: {
      ':creator': userId,
      ':tweetId': tweetId
    },
    Limit: 1
  }).promise()

  const retweet = _.get(resp, 'Items.0')

  expect(retweet).toBeTruthy()

  return retweet
}

const reply_exists_in_TweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  const resp = await DynamoDB.query({
    TableName: process.env.TWEETS_TABLE,
    IndexName: 'repliesForTweet',
    KeyConditionExpression: 'inReplyToTweetId = :tweetId',
    ExpressionAttributeValues: {
      ':tweetId': tweetId,
      ':userId': userId
    },
    FilterExpression: 'creator = :userId'
  }).promise()

  const reply = _.get(resp, 'Items.0')

  expect(reply).toBeTruthy()

  return reply
}

const retweet_exists_in_RetweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for retweetOf [${tweetId}] for user [${userId}] in table [${process.env.RETWEETS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.RETWEETS_TABLE,
    Key: {
      userId,
      tweetId
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

const retweet_does_not_exist_in_TweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for retweetOf [${tweetId}] in table [${process.env.TWEETS_TABLE}]`)
  const resp = await DynamoDB.query({
    TableName: process.env.TWEETS_TABLE,
    IndexName: 'retweetsByCreator',
    KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
    ExpressionAttributeValues: {
      ':creator': userId,
      ':tweetId': tweetId
    },
    Limit: 1
  }).promise()

  expect(resp.Items).toHaveLength(0)
}

const retweet_does_not_exist_in_RetweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for retweetOf [${tweetId}] for user [${userId}] in table [${process.env.RETWEETS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.RETWEETS_TABLE,
    Key: {
      userId,
      tweetId
    }
  }).promise()

  expect(resp.Item).not.toBeTruthy()
}

const tweet_exists_in_TimelinesTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for tweet [${tweetId}] for user [${userId}] in table [${process.env.TIMELINES_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.TIMELINES_TABLE,
    Key: {
      userId,
      tweetId
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

const conversation_exists_in_ConversationsTable = async (userId, otherUserId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  const resp = await DynamoDB.get({
    TableName: process.env.CONVERSATIONS_TABLE,
    Key: {
      userId,
      otherUserId
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

const there_are_N_messages_in_DirectMessagesTable = async (conversationId, n) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  const resp = await DynamoDB.query({
    TableName: process.env.DIRECT_MESSAGES_TABLE,
    KeyConditionExpression: 'conversationId = :conversationId',
    ExpressionAttributeValues: {
      ':conversationId': conversationId
    },
    ScanIndexForward: false   // reverse the index order so that later message shows up first
  }).promise()

  expect(resp.Items).toHaveLength(n)

  return resp.Items
}

const tweet_does_not_exist_in_TimelinesTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for tweet [${tweetId}] for user [${userId}] in table [${process.env.TIMELINES_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.TIMELINES_TABLE,
    Key: {
      userId,
      tweetId
    }
  }).promise()

  expect(resp.Item).not.toBeTruthy()
}

const there_are_N_tweets_in_TimelinesTable = async (userId, n) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for [${n}] tweets for user [${userId}] in table [${process.env.TIMELINES_TABLE}]`)
  const resp = await DynamoDB.query({
    TableName: process.env.TIMELINES_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false   // reverse the index order so that later tweet shows up first
  }).promise()

  expect(resp.Items).toHaveLength(n)

  return resp.Items
}

const tweetsCount_is_updated_in_UsersTable = async (username, tweetsCount) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  console.log(`Looking for user [${username}] in table [${process.env.USERS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id: username
    }
  }).promise()

  expect(resp.Item).toBeTruthy()
  expect(resp.Item.tweetsCount).toEqual(tweetsCount)
}

module.exports = {
  user_exists_in_UsersTable,
  user_can_upload_image_to_url,
  user_can_download_image_from_url,
  tweet_exists_in_TweetsTable,
  tweet_exists_in_TimelinesTable,
  conversation_exists_in_ConversationsTable,
  there_are_N_messages_in_DirectMessagesTable,
  tweet_does_not_exist_in_TimelinesTable,
  tweetsCount_is_updated_in_UsersTable,
  retweet_exists_in_TweetsTable,
  reply_exists_in_TweetsTable,
  retweet_exists_in_RetweetsTable,
  retweet_does_not_exist_in_TweetsTable,
  retweet_does_not_exist_in_RetweetsTable,
  there_are_N_tweets_in_TimelinesTable
}