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

module.exports = {
  getTweetById
}