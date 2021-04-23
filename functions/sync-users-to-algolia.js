const DynamoDB = require('aws-sdk/clients/dynamodb')
const middy = require('@middy/core')
const ssm = require('@middy/ssm')

const { STAGE } = process.env
const { initUsersIndex } = require('../lib/algolia')

module.exports.handler = middy(async (event, context) => {
  const index = await initUsersIndex(context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)

  for (const record of event.Records) {
    if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
      const user = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      
      user.objectID = user.id
      
      await index.saveObjects([user])
    } else if (record.eventName === "REMOVE") {
      const user = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)

      await index.deleteObjects([user.id])
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
