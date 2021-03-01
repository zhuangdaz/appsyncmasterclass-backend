const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given an authenticated user", () => {
    let user
    beforeAll(async() => {
        user = await given.an_authenticated_user()
    })

    describe("When they sent a tweet", () => {
        let tweet
        const text = chance.string( { length: 16 })

        beforeAll(async() => {
            tweet = await when.we_invoke_tweet(user.username, text)
        })

        it("Saves the tweet to TweetsTable", async() => {
            console.log(`checking tweet=[${tweet}]...`)
            await then.tweet_exists_in_TweetsTable(tweet.id)
        })

        it("Saves the tweet to TimelinesTable", async() => {
            await then.tweet_exists_in_TimelinesTable(user.username, tweet.id)
        })

        it("Updates tweetsCount to 1 in UsersTable", async() => {
            await then.tweetsCount_is_updated_in_UsersTable(user.username, 1)
        })
    })
})