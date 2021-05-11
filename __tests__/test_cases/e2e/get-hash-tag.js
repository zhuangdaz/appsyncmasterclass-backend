const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const retry = require('async-retry')

const { HashTagModes } = require('../../../lib/constants')

describe("Given an authenticated user", () => {
  let userA, userAsProfile
  const hashTag = `#${chance.string({ length: 16, alpha: true })}`
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userAsProfile = await when.a_user_calls_getMyProfile(userA)
    await when.a_user_calls_editMyProfile(userA, {
      name: userA.name,
      imageURL: userA.imageURL,
      backgroundImageURL: userA.backgroundImageURL,
      bio: `My bio has a hash tag: ${hashTag}`,
      location: userA.location,
      website: userA.website,
      birthDate: userA.birthDate,
    })
  })

  it("he can find his profile by searching for the hash tag with PEOPLE", async () => {
    await retry(async () => {
      const { results, nextToken } = await when.a_user_calls_getHashTag(
        userA, HashTagModes.PEOPLE, hashTag, 10)

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
    const text = `${chance.string({ length: 16 })} ${hashTag}`
    let tweet
    beforeAll(async () => {
      tweet = await when.a_user_calls_tweet(userA, text)
    })

    it("he can find the tweet when he searches for the hash tag with LATEST", async () => {
      await retry(async () => {
        const { results, nextToken } = await when.a_user_calls_getHashTag(
          userA, HashTagModes.LATEST, hashTag, 10)
  
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
      const replyText = `${chance.string({ length: 16 })} ${hashTag}`
      let reply
      beforeAll(async () => {
        reply = await when.a_user_calls_reply(userA, tweet.id, replyText)
      })
  
      it("he can find the reply when he searches for the hash tag with LATEST", async () => {
        await retry(async () => {
          const { results, nextToken } = await when.a_user_calls_getHashTag(
            userA, HashTagModes.LATEST, hashTag, 10)
    
          expect(nextToken).toBeNull()
          expect(results).toHaveLength(2)
          expect(results[0]).toMatchObject({
            __typename: "Reply",
            id: reply.id,
            text: replyText
          })
          expect(results[1]).toMatchObject({
            __typename: "Tweet",
            id: tweet.id,
            text
          })
        }, {
          maxTimeout: 1000,
          retries: 5
        })
      }, 10000)
    })
  })
})