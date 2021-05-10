const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()

const { TWEETS_TABLE } = process.env

const getTweetById = async (tweetId) => {
  const resp =  await docClient.get({
    TableName: TWEETS_TABLE,
    Key: {
      id: tweetId
    }
  }).promise()

  return resp.Item
}

const extractHashTags = (text) => {
  const hashTags = new Set()
  const regex = /(\#[a-zA-Z0-9_]+\b)/gm
  while (m = regex.exec(text) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    hashTags.add(m[0])
  }
  return Array.from(hashTags)
}

module.exports = {
  getTweetById,
  extractHashTags
}