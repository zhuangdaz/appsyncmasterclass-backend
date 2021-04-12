require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const retry = require('async-retry')

describe("Given authenticated users, userA and userB", () => {
  let userA, userB, userAsProfile, userBsProfile
  let userBsTweet1, userBsTweet2
  beforeAll(async() => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      userAsProfile = await when.a_user_calls_getMyProfile(userA)
      userBsProfile = await when.a_user_calls_getMyProfile(userB)
      userBsTweet1 = await when.a_user_calls_tweet(userB, chance.paragraph())
      userBsTweet2 = await when.a_user_calls_tweet(userB, chance.paragraph())
  })

  describe("When userA follows userB", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userA, userB.username)
    })

    it("userA should see userB's tweets in his timeline", async() => {
      await retry(async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
        expect(tweets).toHaveLength(2)
        expect(tweets).toEqual([
          expect.objectContaining({
            id: userBsTweet2.id
          }),
          expect.objectContaining({
            id: userBsTweet1.id
          })
        ])
      }, {
        retries: 3,
        maxTimeout: 1000
      })
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

    it("userA should see he is in userB's follower list", async () => {
      const { profiles } = await when.a_user_calls_getFollowers(userA, userB.username, 25)
      expect(profiles).toHaveLength(1)
      expect(profiles[0].id).toEqual(userA.username)
      expect(profiles[0]).not.toHaveProperty("following")
      expect(profiles[0]).not.toHaveProperty("followedBy")
    })

    it("userA should no one in his follower list", async () => {
      const { profiles } = await when.a_user_calls_getFollowers(userA, userA.username, 25)
      expect(profiles).toHaveLength(0)
    })

    it("userA should see userB is in his following list", async () => {
      const { profiles } = await when.a_user_calls_getFollowing(userA, userA.username, 25)
      expect(profiles).toHaveLength(1)
      expect(profiles[0]).toMatchObject({
        id: userB.username,
        following: true,
        followedBy: false
      })
    })

    it("userB should see userA in his follower list", async () => {
      const { profiles } = await when.a_user_calls_getFollowers(userB, userB.username, 25)
      expect(profiles).toHaveLength(1)
      expect(profiles[0]).toMatchObject({
        id: userA.username,
        following: false,
        followedBy: true
      })
    })

    it("userB should not see userA in his following list", async () => {
      const { profiles } = await when.a_user_calls_getFollowing(userB, userB.username, 25)
      expect(profiles).toHaveLength(0)
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
          expect(tweets).toHaveLength(3)
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
          expect(tweets).toHaveLength(4)
          expect(tweets[0].id).toEqual(tweet.id)
        }, {
          retries: 3,
          maxTimeout: 1000
        })
      })
    })
  })

  describe("When userA unfollows userB", () => {
    beforeAll(async () => {
      await when.a_user_calls_unfollow(userA, userB.username)
    })

    it("userA shouldn't see userB's tweets in his timeline", async() => {
      await retry(async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)

        expect(tweets).toHaveLength(1)
        expect(tweets).toEqual([
          expect.objectContaining({
            profile: expect.objectContaining({
              id: userA.username
            })
          })
        ])
      }, {
        retries: 3,
        maxTimeout: 1000
      })
    })

    it("userA should see following as false when viewing userB's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)
      expect(following).toBe(false)
      expect(followedBy).toBe(true)
    })

    it("userB should see followedBy as false when viewing userA's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)
      expect(following).toBe(true)
      expect(followedBy).toBe(false)
    })
  })
})