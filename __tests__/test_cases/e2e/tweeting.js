require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()

describe("Given an authenticated user", () => {
  let user
  beforeAll(async() => {
      user = await given.an_authenticated_user()
  })

  describe("When he sends a tweet", () => {
    let tweet
    const text = chance.string( { length: 16 })

    beforeAll(async() => {
      tweet = await when.a_user_calls_tweet(user, text)
    })

    it("Should get the new tweet", async() => {
      expect(tweet).toMatchObject({
        text,
        likes: 0,
        replies: 0,
        retweets: 0,
        liked: false
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

    describe("When he likes the tweet", () => {
      beforeAll(async() => {
        await when.a_user_calls_like(user, tweet.id)
      })

      it("Should see tweet.liked becomes true", async() => {
        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25)
        expect(tweets).toHaveLength(1)
        expect(tweets[0].id).toEqual(tweet.id)
        expect(tweets[0].liked).toEqual(true)
      })

      it("Should not allow to like the same tweet a second time", async() => {
        await expect(when.a_user_calls_like(user, tweet.id))
          .rejects
          .toMatchObject({
            message: expect.stringContaining("DynamoDB transaction error")
          })
      })

      it("Should see the tweet when he calls getLikes", async() => {
        const { tweets, nextToken } = await when.a_user_calls_getLikes(user, user.username, 25)
        
        expect(nextToken).toBeNull()
        expect(tweets).toHaveLength(1)
        expect(tweets[0]).toMatchObject({
          ... tweet,
          liked: true,
          likes: 1,
          profile: {
            ... tweet.profile,
            likesCount: 1
          }
        })
      })
    })

    describe("When he unlikes the tweet", () => {
      beforeAll(async() => {
        await when.a_user_calls_unlike(user, tweet.id)
      })

      it("Should see tweet.liked becomes false", async() => {
        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25)
        expect(tweets).toHaveLength(1)
        expect(tweets[0].id).toEqual(tweet.id)
        expect(tweets[0].liked).toEqual(false)
      })

      it("Should not allow to unlike the same tweet a second time", async() => {
        await expect(when.a_user_calls_unlike(user, tweet.id))
          .rejects
          .toMatchObject({
            message: expect.stringContaining("DynamoDB transaction error")
          })
      })

      it("Should not see the tweet when he calls getLikes", async() => {
        const { tweets, nextToken } = await when.a_user_calls_getLikes(user, user.username, 25)
        
        expect(nextToken).toBeNull()
        expect(tweets).toHaveLength(0)
      })
    })

    describe("When he retweets the tweet", () => {
      beforeAll(async () => {
        await when.a_user_calls_retweet(user, tweet.id)
      })

      it("Should see the retweet when calling getTweets", async () => {
        const { tweets } = await when.a_user_calls_getTweets(user, user.username, 25)
  
        expect(tweets.length).toEqual(2)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: user.username,
            tweetsCount: 2
          },
          retweetOf: {
            ...tweet,
            retweets: 1,
            retweeted: true,
            profile: {
              id: user.username,
              tweetsCount: 2
            }
          }
        })
        expect(tweets[1]).toMatchObject({
          ...tweet,
          retweets: 1,
          retweeted: true,
          profile: {
            id: user.username,
            tweetsCount: 2
          }
        })
      })

      it("Should not see the retweet when calling getMyTimeline", async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25)
        expect(tweets).toHaveLength(1)
        expect(tweets[0]).toMatchObject({
          ...tweet,
          retweets: 1,
          retweeted: true,
          profile: {
            id: user.username,
            tweetsCount: 2
          }
        })
      })

      describe("When he unretweets the tweet", () => {
        beforeAll(async () => {
          await when.a_user_calls_unretweet(user, tweet.id)
        })

        it("Should not see the tweet when calling getTweets", async () => {
          const { tweets } = await when.a_user_calls_getTweets(user, user.username, 25)
    
          expect(tweets.length).toEqual(1)
          expect(tweets[0]).toMatchObject({
            ...tweet,
            retweets: 0,
            retweeted: false,
            profile: {
              id: user.username,
              tweetsCount: 1
            }
          })
        })
      })

    })

    describe("When he retweets someone's tweet", () => {
      let anotherTweet, anotherUser
      beforeAll(async () => {
        anotherUser = await given.an_authenticated_user()
        anotherTweet = await when.a_user_calls_tweet(anotherUser, text)
        await when.a_user_calls_retweet(user, anotherTweet.id)
      })

      it("Should see the tweet when calling getTweets", async () => {
        const { tweets } = await when.a_user_calls_getTweets(user, user.username, 25)
  
        expect(tweets.length).toEqual(2)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: user.username,
            tweetsCount: 2
          },
          retweetOf: {
            ...anotherTweet,
            retweets: 1,
            retweeted: true
          }
        })
      })

      it("Should see the tweet when calling getMyTimeline", async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25)
        expect(tweets).toHaveLength(2)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: user.username,
            tweetsCount: 2
          },
          retweetOf: {
            ...anotherTweet,
            retweets: 1,
            retweeted: true
          }
        })
      })

      describe("When he unretweets the tweet", () => {
        beforeAll(async () => {
          await when.a_user_calls_unretweet(user, anotherTweet.id)
        })

        it("Should not see the tweet when calling getTweets", async () => {
          const { tweets } = await when.a_user_calls_getTweets(user, user.username, 25)
    
          expect(tweets.length).toEqual(1)
          expect(tweets[0]).toMatchObject({
            ...tweet,
            retweets: 0,
            retweeted: false,
            profile: {
              id: user.username,
              tweetsCount: 1
            }
          })
        })
  
        it("Should see the tweet when calling getMyTimeline", async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(user, 25)
          expect(tweets).toHaveLength(1)
          expect(tweets[0]).toMatchObject({
            ...tweet,
            retweets: 0,
            retweeted: false,
            profile: {
              id: user.username,
              tweetsCount: 1
            }
          })
        })
      })
    })
  })
})
