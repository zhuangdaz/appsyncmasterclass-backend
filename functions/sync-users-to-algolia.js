const DynamoDB = require('aws-sdk/clients/dynamodb')
const { STAGE, ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY } = process.env
const { initUsersIndex } = require('../lib/algolia')

module.exports.handler = async(event) => {
  const index = await initUsersIndex(ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY, STAGE)

  for (const record of event.Records) {
    if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
      const user = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      
      user.objectId = user.id
      
      await index.saveObjects([user])
    } else if (record.eventName === "REMOVE") {
      const user = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)

      await index.deleteObjects([user.id])
    }
  }
}
