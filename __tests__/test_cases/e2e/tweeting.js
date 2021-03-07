require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given an authenticated user", () => {
  let user
  beforeAll(async() => {
      user = await given.an_authenticated_user()
  })

  describe("When they send a tweet", () => {
    let tweet
    const text = chance.string( { length: 16 })

    beforeAll(async() => {
      tweet = await when.a_user_calls_tweet(user, text)
    })

    it("Should get a new tweet", async() => {
      expect(tweet).toMatchObject({
        text,
        likes: 0,
        replies: 0,
        retweets: 0
      })
    })

    describe("When he calls getTweets", () => {
      it("Should see the new tweet when he calls getTweets", async() => {
        const { tweets, nextToken } = await when.a_user_calls_getTweets(user, user.username, 25)
  
        expect(nextToken).toBeNull()
        expect(tweets.length).toEqual(1)
        expect(tweets[0]).toEqual(tweet)
      })
  
      it("Should get error when he queries more than 25 tweets in a page", async() => {
        await expect(when.a_user_calls_getTweets(user, user.username, 26))
          .rejects
          .toMatchObject({
            message: expect.stringContaining("Max limit is 25")
          })
      })
    })

    describe("When he calls getMyTimeline", () => {
      it("Should see the new tweet when he calls getMyTimeline", async() => {
        const { tweets, nextToken } = await when.a_user_calls_getMyTimeline(user, 25)
  
        expect(nextToken).toBeNull()
        expect(tweets.length).toEqual(1)
        expect(tweets[0]).toEqual(tweet)
      })
  
      it("Should get error when he queries more than 25 tweets in a page", async() => {
        await expect(when.a_user_calls_getMyTimeline(user, 26))
          .rejects
          .toMatchObject({
            message: expect.stringContaining("Max limit is 25")
          })
      })
    })
  })
})
