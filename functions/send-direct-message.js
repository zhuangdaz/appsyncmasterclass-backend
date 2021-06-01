const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')

const { CONVERSATIONS_TABLE, DIRECT_MESSAGES_TABLE } = process.env

module.exports.handler = async(event) => {
  const { otherUserId, message } = event.arguments
  const { username } = event.identity
  const id = ulid.ulid()
  const timestamp = new Date().toJSON()
  const conversationId = username < otherUserId
    ? `${username}_${otherUserId}`
    : `${otherUserId}_${username}`

  const newMessage = {
    conversationId,
    id,
    message,
    from: username,
    createdAt: timestamp
  }

  const request = docClient.transactWrite(
    {
      TransactItems: [
        {
          Put: {
            TableName: DIRECT_MESSAGES_TABLE,
            Item: newMessage
          }
        },
        {
          Update: {
            TableName: CONVERSATIONS_TABLE,
            Key: {
              userId: username,
              otherUserId
            },
            UpdateExpression: 'Set id = :id, lastMessage = :message, lastModified = :now',
            ExpressionAttributeValues: {
              ':id': conversationId,
              ':message': message,
              ':now': timestamp
            }
          }
        },
        {
          Update: {
            TableName: CONVERSATIONS_TABLE,
            Key: {
              userId: otherUserId,
              otherUserId: username
            },
            UpdateExpression: 'Set id = :id, lastMessage = :message, lastModified = :now',
            ExpressionAttributeValues: {
              ':id': conversationId,
              ':message': message,
              ':now': timestamp
            }
          }
        }
      ]
    }
  )

  request.on('extractError', (response) => {
    if (response.error) {
      const cancellationReasons = JSON.parse(response.httpResponse.body.toString()).CancellationReasons;
      console.log(JSON.stringify(cancellationReasons))
      response.error.cancellationReasons = cancellationReasons;
    }
  });
  await request.promise();
  return {
    id: conversationId,
    otherUserId,
    lastMessage: message,
    lastModified: timestamp
  }
}