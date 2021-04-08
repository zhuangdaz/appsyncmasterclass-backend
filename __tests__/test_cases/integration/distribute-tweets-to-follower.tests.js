const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given userA and userB", () => {
    let userA, userB
    let userAsTweet1, userAsTweet2
    beforeAll(async () => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      userAsTweet1 = await when.we_invoke_tweet(userA.username, chance.paragraph())
      userAsTweet2 = await when.we_invoke_tweet(userA.username, chance.paragraph())
    })

    describe("When userB follows userA", () => {
      beforeAll(async () => {
        const event = require("../../data/new-follower.json")
        const { NewImage } = event.Records[0].dynamodb
        NewImage.userId.S = userB.username
        NewImage.sk.S = `FOLLOWS_${userA.username}`
        NewImage.otherUserId.S = userA.username
        await when.we_invoke_distribute_tweets_to_follower(event)
      })

      it("userB should see these two tweets in his timeline", async () => {
        await then.tweet_exists_in_TimelinesTable(userB.username, userAsTweet1.id)
        await then.tweet_exists_in_TimelinesTable(userB.username, userAsTweet2.id)
      })

      describe("When userB unfollows userA", () => {
        beforeAll(async () => {
          const event = require("../../data/unfollow.json")
          const { OldImage } = event.Records[0].dynamodb
          OldImage.userId.S = userB.username
          OldImage.sk.S = `FOLLOWS_${userA.username}`
          OldImage.otherUserId.S = userA.username
          await when.we_invoke_distribute_tweets_to_follower(event)
        })
  
        it("userB should not see the tweets in his timeline", async () => {
          await then.tweet_does_not_exist_in_TimelinesTable(userB.username, userAsTweet1.id)
          await then.tweet_does_not_exist_in_TimelinesTable(userB.username, userAsTweet2.id)
        })
      })
    })
})