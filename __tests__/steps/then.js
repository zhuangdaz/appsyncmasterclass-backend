require('dotenv').config()
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
  tweetsCount_is_updated_in_UsersTable
}