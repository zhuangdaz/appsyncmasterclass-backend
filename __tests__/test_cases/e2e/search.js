const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const retry = require('async-retry')

const { SearchModes } = require('../../../lib/constants')

describe("Given an authenticated user", () => {
  let userA, userAsProfile
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userAsProfile = await when.a_user_calls_getMyProfile(userA)
  })

  it("he can find his profile by searching for his twitter handle", async () => {
    await retry(async () => {
      const { results, nextToken } = await when.a_user_calls_search(
        userA, SearchModes.PEOPLE, userAsProfile.screenName, 10)

      expect(nextToken).toBeNull()
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        __typename: "MyProfile",
        id: userAsProfile.id,
        name: userAsProfile.name,
        screenName: userAsProfile.screenName
      })
    }, {
      maxTimeout: 1000,
      retries: 5
    })
  }, 10000)

  it("he can find his profile by searching for his name", async () => {
    await retry(async () => {
      const { results, nextToken } = await when.a_user_calls_search(
        userA, SearchModes.PEOPLE, userAsProfile.name, 10)

      expect(nextToken).toBeNull()
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        __typename: "MyProfile",
        id: userAsProfile.id,
        name: userAsProfile.name,
        screenName: userAsProfile.screenName
      })
    }, {
      maxTimeout: 1000,
      retries: 5
    })
  }, 10000)

  describe("When the user sends a tweet", () => {
    const text = chance.string({ length: 16 })
    let tweet
    beforeAll(async () => {
      tweet = await when.a_user_calls_tweet(userA, text)
    })

    it("he can find the tweet when he searches for the text", async () => {
      await retry(async () => {
        const { results, nextToken } = await when.a_user_calls_search(
          userA, SearchModes.LATEST, text, 10)
  
        expect(nextToken).toBeNull()
        expect(results).toHaveLength(1)
        expect(results[0]).toMatchObject({
          __typename: "Tweet",
          id: tweet.id,
          text
        })
      }, {
        maxTimeout: 1000,
        retries: 5
      })
    }, 10000)

    describe("When the user replies to the tweet", () => {
      const replyText = chance.string({ length: 16 })
      let reply
      beforeAll(async () => {
        reply = await when.a_user_calls_reply(userA, tweet.id, replyText)
      })
  
      it("he can find the reply when he searches for the reply text", async () => {
        await retry(async () => {
          const { results, nextToken } = await when.a_user_calls_search(
            userA, SearchModes.LATEST, replyText, 10)
    
          expect(nextToken).toBeNull()
          expect(results).toHaveLength(1)
          expect(results[0]).toMatchObject({
            __typename: "Reply",
            id: reply.id,
            text: replyText
          })
        }, {
          maxTimeout: 1000,
          retries: 5
        })
      }, 10000)
    })
  })
})