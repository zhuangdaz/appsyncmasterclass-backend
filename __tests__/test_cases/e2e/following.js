require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const retry = require('async-retry')

describe("Given authenticated users, userA and userB", () => {
  let userA, userB, userAsProfile, userBsProfile
  beforeAll(async() => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      userAsProfile = await when.a_user_calls_getMyProfile(userA)
      userBsProfile = await when.a_user_calls_getMyProfile(userB)
  })

  describe("When userA follows userB", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userA, userB.username)
    })

    it("userA should see following as true when viewing userB's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)
      expect(following).toBe(true)
      expect(followedBy).toBe(false)
    })

    it("userB should see followedBy as true when viewing userA's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)
      expect(following).toBe(false)
      expect(followedBy).toBe(true)
    })

    describe("UserB sends a tweet", () => {
      let tweet
      const text = chance.string({ length: 16 })
      beforeAll(async() => {
        tweet = await when.a_user_calls_tweet(userB, text)
      })

      it("Should appear in userA's timeline", async() => {
        await retry(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
          expect(tweets).toHaveLength(1)
          expect(tweets[0].id).toEqual(tweet.id)
        }, {
          retries: 3,
          maxTimeout: 1000
        })
      })
    })
  })

  describe("When userB follows back userA", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userB, userA.username)
    })

    it("userA should see following and followedBy as true when viewing userB's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)
      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })

    it("userB should see following and followedBy as true when viewing userA's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)
      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })

    describe("UserA sends a tweet", () => {
      let tweet
      const text = chance.string({ length: 16 })
      beforeAll(async() => {
        tweet = await when.a_user_calls_tweet(userA, text)
      })

      it("Should appear in userB's timeline", async() => {
        await retry(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)
          expect(tweets).toHaveLength(2)
          expect(tweets[0].id).toEqual(tweet.id)
        }, {
          retries: 3,
          maxTimeout: 1000
        })
      })
    })
  })
})