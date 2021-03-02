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

    it("The user should get a new tweet", async() => {
      expect(tweet).toMatchObject({
        text,
        likes: 0,
        replies: 0,
        retweets: 0
      })
    })
  })
})
