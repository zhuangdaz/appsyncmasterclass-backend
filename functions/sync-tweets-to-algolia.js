const DynamoDB = require('aws-sdk/clients/dynamodb')
const middy = require('@middy/core')
const ssm = require('@middy/ssm')

const { STAGE } = process.env
const { initTweetsIndex } = require('../lib/algolia')
const { TweetTypes } = require('../lib/constants')

module.exports.handler = middy(async (event, context) => {
  const index = await initTweetsIndex(context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)

  for (const record of event.Records) {
    if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)

      if (tweet.__typename === TweetTypes.RETWEET) {
        continue
      }
      
      tweet.objectID = tweet.id
      
      await index.saveObjects([tweet])
    } else if (record.eventName === "REMOVE") {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)

      if (tweet.__typename === TweetTypes.RETWEET) {
        continue
      }

      await index.deleteObjects([tweet.id])
    }
  }
}).use(ssm({
  fetchData: {
    ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
    ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`
  },
  setToContext: true,
  cacheExpiry: 5 * 60 * 1000 // 5 mins
})).onError(async (request) => {
  throw request.error
})
