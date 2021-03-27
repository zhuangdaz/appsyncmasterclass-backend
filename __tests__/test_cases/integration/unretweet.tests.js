const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given an authenticated userA retweets userB's tweet'", () => {
    let userA, userB, tweet
    const text = chance.string({ length: 16 })
    beforeAll(async () => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      tweet = await when.we_invoke_tweet(userB.username, text)
      await when.we_invoke_retweet(userA.username, tweet.id)
    })

    describe("When userA unretweets userB's tweet", () => {
      beforeAll(async () => {
        await when.we_invoke_unretweet(userA.username, tweet.id)
      })

      it("Deletes the retweet from TweetsTable", async () => {
        await then.retweet_does_not_exist_in_TweetsTable(userA.username, tweet.id)
      })

      it("Deletes the retweet from RetweetsTable", async () => {
        await then.retweet_does_not_exist_in_RetweetsTable(userA.username, tweet.id)
      })

      it("Decrements the original tweet's retweetCount by 1", async () => {
        const { retweets } = await then.tweet_exists_in_TweetsTable(tweet.id)
        expect(retweets).toEqual(0)
      })

      it("Decrements the user's tweetCount by 1", async () => {
        await then.tweetsCount_is_updated_in_UsersTable(userA.username, 0)
      })

      it("Deletes the retweet to TimelinesTable", async () => {
        await then.there_are_N_tweets_in_TimelinesTable(userA.username, 0)
      })
    })
  })