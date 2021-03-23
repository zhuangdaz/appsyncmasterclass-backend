const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given an authenticated user with a tweet", () => {
    let userA, tweet
    const text = chance.string({ length: 16 })
    beforeAll(async () => {
      userA = await given.an_authenticated_user()
      tweet = await when.we_invoke_tweet(userA.username, text)
    })

    describe("When he retweets his own tweet", () => {
      beforeAll(async () => {
        await when.we_invoke_retweet(userA.username, tweet.id)
      })

      it("Saves the retweet to TweetsTable", async () => {
        await then.retweet_exists_in_TweetsTable(userA.username, tweet.id)
      })

      it("Saves the retweet to RetweetsTable", async () => {
        await then.retweet_exists_in_RetweetsTable(userA.username, tweet.id)
      })

      it("Increments the original tweet's retweetCount by 1", async () => {
        const { retweets } = await then.tweet_exists_in_TweetsTable(tweet.id)

        expect(retweets).toEqual(1)
      })

      it("Increments the user's tweetCount by 1", async () => {
        await then.tweetsCount_is_updated_in_UsersTable(userA.username, 2)
      })

      it("Should not save the retweet to TimelinesTable", async () => {
        const tweets = await then.there_are_N_tweets_in_TimelinesTable(userA.username, 1)
        expect(tweets[0].tweetId).toEqual(tweet.id)
      })
    })
  })