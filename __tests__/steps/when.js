require('dotenv').config()
const AWS = require('aws-sdk')
const fs = require('fs')
const velocityMapper = require('amplify-appsync-simulator/lib/velocity/value-mapper/mapper')
const velocityTemplate = require('amplify-velocity-template')
const { GraphQL, registerFragment } = require('../lib/graphql')

const myProfileFragment = `
fragment myProfileFields on MyProfile {
    id
    name
    screenName
    imageURL
    backgroundImageURL
    bio
    location
    website
    birthDate
    createdAt
    followersCount
    followingCount
    tweetsCount
    likesCount
}
`

const otherProfileFragment = `
fragment otherProfileFields on OtherProfile {
    id
    name
    screenName
    imageURL
    backgroundImageURL
    bio
    location
    website
    birthDate
    createdAt
    followersCount
    followingCount
    tweetsCount
    likesCount
    following
    followedBy
}
`

const iProfileFragment = `
fragment iProfileFields on IProfile {
    ... on MyProfile {
        ... myProfileFields
    }
    ... on OtherProfile {
        ... otherProfileFields
    }
}
`

const tweetFragment = `
fragment tweetFields on Tweet {
    id
    profile {
        ... iProfileFields
    }
    createdAt
    text
    likes
    replies
    retweets
    liked
    retweeted
}
`

const retweetFragment = `
fragment retweetFields on Retweet {
    id
    profile {
        ... iProfileFields
    }
    createdAt
    retweetOf {
        ... on Tweet {
            ... tweetFields
        }
    }
}
`

const replyFragment = `
fragment replyFields on Reply {
    id
    profile {
        ... iProfileFields
    }
    createdAt
    text
    likes
    replies
    retweets
    liked
    retweeted
    inReplyToTweet {
        id
        profile {
            ... iProfileFields
        }
        createdAt
        ... on Tweet {
            replies
        }
        ... on Reply {
            replies
        }
    }
    inReplyToUsers {
        ... iProfileFields
    }
}
`

const iTweetFragment = `
fragment iTweetFields on ITweet {
    ... on Tweet {
        ... tweetFields
    }
    ... on Retweet {
        ... retweetFields
    }
    ... on Reply {
        ... replyFields
    }
}
`

registerFragment("myProfileFields", myProfileFragment)
registerFragment("otherProfileFields", otherProfileFragment)
registerFragment("iProfileFields", iProfileFragment)
registerFragment("tweetFields", tweetFragment)
registerFragment("retweetFields", retweetFragment)
registerFragment("replyFields", replyFragment)
registerFragment("iTweetFields", iTweetFragment)

const we_invoke_confirmUserSignup = async (userName, name, email) => {
    const handler = require('../../functions/confirm-user-signup').handler

    const context = {}
    const event = {
        "version": "1",
        "region": process.env.AWS_REGION,
        "userPoolId": process.env.COGNITO_USER_POOL_ID,
        "userName": userName,
        "triggerSource": "PostConfirmation_ConfirmSignUp",
        "request": {
            "userAttributes": {
                "sub": userName,
                "cognito:email_alias": email,
                "cognito:user_status": "CONFIRMED",
                "email_verified": "false",
                "name": name,
                "email": email
            }
        },
        "response": {}
    }

    await handler(event, context)
}

const a_user_signs_up = async(name, password, email) => {
    const cognito = new AWS.CognitoIdentityServiceProvider()

    const userPoolId = process.env.COGNITO_USER_POOL_ID
    const clientId = process.env.WEB_USER_POOL_CLIENT_ID

    const signUpResp = await cognito.signUp({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [
            { Name: 'name', Value: name }
        ]
    }).promise()

    const userName = signUpResp.UserSub
    console.log(`[${email}] - user has signed up [${userName}]`)

    await cognito.adminConfirmSignUp({
        UserPoolId: userPoolId,
        Username: userName
    }).promise()

    console.log(`[${email}] - user confirmed sign up`)

    return {
        userName,
        name,
        email
    }
}

const we_invoke_an_appSync_template = (templatePath, context) => {
    const template = fs.readFileSync(templatePath, { encoding: 'utf-8' })
    const ast = velocityTemplate.parse(template)
    const compiler = new velocityTemplate.Compile(ast, {
        valueMapper: velocityMapper.map,
        escape: false
    })

    return JSON.parse(compiler.render(context))
}

const a_user_calls_getMyProfile = async (user) => {
    const getMyProfile = `query MyQuery {
        getMyProfile {
          ... myProfileFields

          tweets {
              nextToken
              tweets {
                ... iTweetFields
              }
          }
        }
    }`

    const data = await GraphQL(process.env.API_URL, getMyProfile, {}, user.accessToken)
    const profile = data.getMyProfile

    console.log(`[${user.username}] - fetched profile`)
    return profile
}

const a_user_calls_tweet = async (user, text) => {
    const tweet = `mutation MyMutation($text: String!) {
        tweet(text: $text) {
            ... tweetFields
        }
    }`

    const variables = {
        text
    }

    const data = await GraphQL(process.env.API_URL, tweet, variables, user.accessToken)
    const newTweet = data.tweet

    console.log(`[${user.username}] - posted tweet`)
    return newTweet
}

const a_user_calls_retweet = async (user, tweetId) => {
    const retweet = `mutation MyMutation($tweetId: ID!) {
        retweet(tweetId: $tweetId) {
            ... retweetFields
        }
    }`

    const variables = {
        tweetId
    }

    const data = await GraphQL(process.env.API_URL, retweet, variables, user.accessToken)
    console.log(`[${user.username}] - retweeted tweet:[${tweetId}]`)
    return data.retweet
}

const a_user_calls_reply = async (user, tweetId, text) => {
    const reply = `mutation MyMutation($tweetId: ID!, $text: String!) {
        reply(tweetId: $tweetId, text: $text) {
            ... replyFields
        }
    }`

    const variables = {
        tweetId,
        text
    }

    const data = await GraphQL(process.env.API_URL, reply, variables, user.accessToken)
    console.log(`[${user.username}] - replied to tweet:[${tweetId}]`)
    return data.reply
}

const a_user_calls_follow = async (user, userId) => {
    const follow = `mutation MyMutation($userId: ID!) {
        follow(userId: $userId)
    }`

    const variables = {
        userId
    }

    await GraphQL(process.env.API_URL, follow, variables, user.accessToken)
    console.log(`[${user.username}] - follows:[${userId}]`)
}

const a_user_calls_unfollow = async (user, userId) => {
    const unfollow = `mutation MyMutation($userId: ID!) {
        unfollow(userId: $userId)
    }`

    const variables = {
        userId
    }

    await GraphQL(process.env.API_URL, unfollow, variables, user.accessToken)
    console.log(`[${user.username}] - unfollows:[${userId}]`)
}

const a_user_calls_getProfile = async (user, screenName) => {
    const getProfile = `query MyQuery($screenName: String!) {
        getProfile(screenName: $screenName) {
            ... otherProfileFields
        }
    }`

    const variables = {
        screenName
    }

    const data = await GraphQL(process.env.API_URL, getProfile, variables, user.accessToken)
    console.log(`[${user.username}] - getProfile for :[${screenName}]`)
    return data.getProfile
}

const a_user_calls_getFollowers = async (user, userId, limit, nextToken) => {
    const getFollowers = `query MyQuery($userId: ID!, $limit: Int!, $nextToken: String) {
        getFollowers(userId: $userId, limit: $limit, nextToken: $nextToken) {
            profiles {
                ... iProfileFields
            }
            nextToken
        }
    }`

    const variables = {
        userId,
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.API_URL, getFollowers, variables, user.accessToken)
    console.log(`[${user.username}] - getFollowers for :[${userId}]`)
    return data.getFollowers
}

const a_user_calls_getFollowing = async (user, userId, limit, nextToken) => {
    const getFollowing = `query MyQuery($userId: ID!, $limit: Int!, $nextToken: String) {
        getFollowing(userId: $userId, limit: $limit, nextToken: $nextToken) {
            profiles {
                ... iProfileFields
            }
            nextToken
        }
    }`

    const variables = {
        userId,
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.API_URL, getFollowing, variables, user.accessToken)
    console.log(`[${user.username}] - getFollowing for :[${userId}]`)
    return data.getFollowing
}

const a_user_calls_unretweet = async (user, tweetId) => {
    const unretweet = `mutation MyMutation($tweetId: ID!) {
        unretweet(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    await GraphQL(process.env.API_URL, unretweet, variables, user.accessToken)
    console.log(`[${user.username}] - unretweeted tweet:[${tweetId}]`)
}

const a_user_calls_getTweets = async (user, userId, limit, nextToken) => {
    const getTweets = `query getTweets($userId: ID!, $limit: Int!, $nextToken: String) {
        getTweets(userId: $userId, limit: $limit, nextToken: $nextToken) {
            tweets {
                ... iTweetFields
            }
            nextToken
        }
    }`

    const variables = {
        userId,
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.API_URL, getTweets, variables, user.accessToken)
    const tweets = data.getTweets

    console.log(`[${user.username}] - gets tweets`)
    return tweets
}

const a_user_calls_editMyProfile = async(user, input) => {
    const editMyProfile = `mutation MyMutation($input: ProfileInput!) {
        editMyProfile(newProfile: $input) {
          ... myProfileFields
          tweets {
            nextToken
            tweets {
                ... iTweetFields
            }
          }
        }
      }`

    const variables = {
        input
    }

    const data = await GraphQL(process.env.API_URL, editMyProfile, variables, user.accessToken)
    const profile = data.editMyProfile

    console.log(`[${user.username}] - edited profile`)
    return profile
}

const we_invoke_getImageUploadURL = async (username, extension, contentType) => {
    const handler = require('../../functions/get-upload-url').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            extension,
            contentType
        }
    }

    return await handler(event, context)
}

const a_user_calls_getImageUploadUrl = async(user, extension, contentType) => {
    const getImageUploadURL = `query getImageUploadURL($extension: String, $contentType: String) {
        getImageUploadURL(extension: $extension, contentType: $contentType)
      }`

    const variables = {
        extension,
        contentType
    }

    const data = await GraphQL(process.env.API_URL, getImageUploadURL, variables, user.accessToken)
    const url = data.getImageUploadURL

    console.log(`[${user.username}] - got image upload url`)
    return url
}

const we_invoke_tweet = async (username, text) => {
    const handler = require('../../functions/tweet').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            text
        }
    }
    return await handler(event, context)
}

const we_invoke_retweet = async (username, tweetId) => {
    const handler = require('../../functions/retweet').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            tweetId
        }
    }
    return await handler(event, context)
}

const we_invoke_reply = async (username, tweetId, text) => {
    const handler = require('../../functions/reply').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            tweetId,
            text 
        }
    }
    return await handler(event, context)
}

const we_invoke_distribute_tweets = async (event) => {
    const handler = require('../../functions/distribute-tweets').handler

    const context = {}
    return await handler(event, context)
}

const we_invoke_distribute_tweets_to_follower = async (event) => {
    const handler = require('../../functions/distribute-tweets-to-follower').handler

    const context = {}
    return await handler(event, context)
}

const we_invoke_unretweet = async (username, tweetId) => {
    const handler = require('../../functions/unretweet').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            tweetId
        }
    }
    return await handler(event, context)
}

const a_user_calls_getMyTimeline = async (user, limit, nextToken) => {
    const getMyTimeline = `query getMyTimeline($limit: Int!, $nextToken: String) {
        getMyTimeline(limit: $limit, nextToken: $nextToken) {
            tweets {
                ... iTweetFields
            }
            nextToken
        }
    }`

    const variables = {
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.API_URL, getMyTimeline, variables, user.accessToken)
    const result = data.getMyTimeline

    console.log(`[${user.username}] - fetched his timeline`)
    return result
}

const a_user_calls_like = async (user, tweetId) => {
    const like = `mutation like($tweetId: ID!) {
        like(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    const data = await GraphQL(process.env.API_URL, like, variables, user.accessToken)
    const result = data.like

    console.log(`[${user.username}] - liked tweet: [${tweetId}]`)
    return result
}

const a_user_calls_unlike = async (user, tweetId) => {
    const unlike = `mutation unlike($tweetId: ID!) {
        unlike(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    const data = await GraphQL(process.env.API_URL, unlike, variables, user.accessToken)
    const result = data.unlike

    console.log(`[${user.username}] - unliked tweet: [${tweetId}]`)
    return result
}

const a_user_calls_getLikes = async (user, userId, limit, nextToken) => {
    const getLikes = `query getLikes($userId: ID!, $limit: Int!, $nextToken: String) {
        getLikes(userId: $userId, limit: $limit, nextToken: $nextToken) {
            tweets {
                ... iTweetFields
            }
            nextToken
        }
    }`

    const variables = {
        userId,
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.API_URL, getLikes, variables, user.accessToken)
    const result = data.getLikes

    console.log(`[${user.username}] - fetched [${userId}]'s liked tweets`)
    return result
}

module.exports = {
    we_invoke_confirmUserSignup,
    we_invoke_tweet,
    we_invoke_an_appSync_template,
    we_invoke_getImageUploadURL,
    we_invoke_retweet,
    we_invoke_unretweet,
    we_invoke_reply,
    we_invoke_distribute_tweets,
    we_invoke_distribute_tweets_to_follower,
    a_user_signs_up,
    a_user_calls_getMyProfile,
    a_user_calls_editMyProfile,
    a_user_calls_getImageUploadUrl,
    a_user_calls_tweet,
    a_user_calls_retweet,
    a_user_calls_unretweet,
    a_user_calls_getTweets,
    a_user_calls_getMyTimeline,
    a_user_calls_like,
    a_user_calls_unlike,
    a_user_calls_getLikes,
    a_user_calls_reply,
    a_user_calls_follow,
    a_user_calls_unfollow,
    a_user_calls_getProfile,
    a_user_calls_getFollowers,
    a_user_calls_getFollowing
}