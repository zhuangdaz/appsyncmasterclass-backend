const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given two authenticated users, userA and userB", () => {
    let userA, userB
    
    beforeAll(async () => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
    })
    
    describe("When userA sends a tweet", () => {
      const text = chance.string({ length: 16 })
      let tweet
      beforeAll(async () => {
        tweet = await when.we_invoke_tweet(userA.username, text)
      })

      describe("When userB replies to userA's tweet", () => {
        const replyText = chance.string({ length: 16 })
        beforeAll(async () => {
          await when.we_invoke_reply(userB.username, tweet.id, replyText)
        })
  
        it("Saves the reply to TweetsTable", async () => {
          const reply = await then.reply_exists_in_TweetsTable(userB.username, tweet.id)
          expect(reply).toMatchObject({
            inReplyToTweetId: tweet.id,
            inReplyToUserIds: [userA.username],
            text: replyText,
            likes: 0,
            retweets: 0,
            replies: 0
          })
        })
  
        it("Increments the original tweet's reply count by 1", async () => {
          const { replies } = await then.tweet_exists_in_TweetsTable(tweet.id)
  
          expect(replies).toEqual(1)
        })
  
        it("Increments the user's tweetCount by 1", async () => {
          await then.tweetsCount_is_updated_in_UsersTable(userB.username, 1)
        })
  
        it("Save the reply to TimelinesTable", async () => {
          const tweets = await then.there_are_N_tweets_in_TimelinesTable(userB.username, 1)
          expect(tweets[0].inReplyToTweetId).toEqual(tweet.id)
        })

        describe("When userA replies to userB's reply", () => {
          let userBsReply
          const replyText = chance.string({ length: 16 })
          beforeAll(async () => {
            userBsReply = await then.reply_exists_in_TweetsTable(userB.username, tweet.id)
            await when.we_invoke_reply(userA.username, userBsReply.id, replyText)
          })

          it("Saves the reply to TweetsTable", async () => {
            const reply = await then.reply_exists_in_TweetsTable(userA.username, userBsReply.id)
            expect(reply).toMatchObject({
              inReplyToTweetId: userBsReply.id,
              inReplyToUserIds: expect.arrayContaining([userA.username, userA.username]),
              text: replyText,
              likes: 0,
              retweets: 0,
              replies: 0
            })
            expect(reply.inReplyToUserIds).toHaveLength(2)
          })
        })
      })

      describe("When userB retweets userA's tweet", () => {
        let userBsRetweet
        beforeAll(async () => {
          await when.we_invoke_retweet(userB.username, tweet.id)
          userBsRetweet = await then.retweet_exists_in_TweetsTable(userB.username, tweet.id)
        })

        describe("When userA replies to userB's retweet", () => {
          const replyText = chance.string({ length: 16 })
          beforeAll(async () => {
            await when.we_invoke_reply(userA.username, userBsRetweet.id, replyText)
          })

          it("Saves the reply to TweetsTable", async () => {
            const reply = await then.reply_exists_in_TweetsTable(userA.username, userBsRetweet.id)
            expect(reply).toMatchObject({
              inReplyToTweetId: userBsRetweet.id,
              inReplyToUserIds: expect.arrayContaining([userA.username, userA.username]),
              text: replyText,
              likes: 0,
              retweets: 0,
              replies: 0
            })
            expect(reply.inReplyToUserIds).toHaveLength(2)
          })
        })
      })
    })
})