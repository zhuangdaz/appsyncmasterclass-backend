require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()

describe("Given authenticated users, userA, userB and userC", () => {
  let userA, userB, userC, userAsTweet
  const text = chance.string({ length: 16 })
  beforeAll(async() => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      userC = await given.an_authenticated_user()
      userAsTweet = await when.a_user_calls_tweet(userA, text)
  })

  describe("When userB replies to userA's tweet", () => {
    const replyText = chance.string({length: 16})
    beforeAll(async () => {
      await when.a_user_calls_reply(userB, userAsTweet.id, replyText)
    })

    it("userB should see his reply when calling getTweets", async () => {
      const { tweets } = await when.a_user_calls_getTweets(userB, userB.username, 25)

      expect(tweets.length).toEqual(1)
      expect(tweets[0]).toMatchObject({
        profile: {
          id: userB.username,
          tweetsCount: 1
        },
        inReplyToTweet: {
          id: userAsTweet.id,
          replies: 1
        },
        inReplyToUsers: [
          {
            id: userA.username
          }
        ]
      })
    })

    it("userB should see his reply when calling getMyTimeline", async () => {
      const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)
      expect(tweets.length).toEqual(1)
      expect(tweets[0]).toMatchObject({
        profile: {
          id: userB.username,
          tweetsCount: 1
        },
        inReplyToTweet: {
          id: userAsTweet.id,
          replies: 1
        },
        inReplyToUsers: [
          {
            id: userA.username
          }
        ]
      })
    })
  })

})