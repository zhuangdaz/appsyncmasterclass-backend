global.WebSocket = require('ws')
require('isomorphic-fetch')
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const { AWSAppSyncClient, AUTH_TYPE } = require('aws-appsync')
const gql = require('graphql-tag')

const retry = require('async-retry')

describe("Given two authenticated users", () => {
  const text = chance.string({ length: 16 })
  let userA, userB
  let userAsTweet
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()  

    userAsTweet = await when.a_user_calls_tweet(userA, text)
  })

  describe("Given userA subscribes to notifications", () => {
    let client, subscription
    const notifications = []

    beforeAll(async () => {
      client = new AWSAppSyncClient({
        url: process.env.API_URL,
        region: process.env.AWS_REGION,
        auth: {
          type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
          jwtToken: () => userA.idToken
        },
        disableOffline: true
      })

      subscription = client.subscribe({
        query: gql `
          subscription onNotified($userId: ID!) {
            onNotified(userId: $userId) {
              ... on Retweeted {
                id
                userId
                tweetId
                retweetedBy
                retweetId
                createdAt
                type
              }
            }
          }
        `,
        variables: {
          userId: userA.username
        }
      }).subscribe({
        next: resp => {
          notifications.push(resp.data.onNotified)
        }
      })
    })

    afterAll(() => {
      subscription.unsubscribe()
    })

    describe("When userB retweets userA's tweet", () => {
      let userBsRetweet
      beforeAll(async () => {
        userBsRetweet = await when.a_user_calls_retweet(userB, userAsTweet.id)
      })

      it("UserA should receive a notification", async () => {
        await retry(async () => {
          expect(notifications).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: 'Retweeted',
                userId: userA.username,
                tweetId: userAsTweet.id,
                retweetedBy: userB.username,
                retweetId: userBsRetweet.id
              })
            ])
          )
        }, {
          retries: 10,
          maxTimeout: 1000
        })
      }, 15000)
    })
  })
})