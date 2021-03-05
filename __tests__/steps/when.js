require('dotenv').config()
const AWS = require('aws-sdk')
const fs = require('fs')
const velocityMapper = require('amplify-appsync-simulator/lib/velocity/value-mapper/mapper')
const velocityTemplate = require('amplify-velocity-template')
const GraphQL = require('../lib/graphql')

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
          bio
          birthDate
          createdAt
          name
          screenName
          backgroundImageURL
          followersCount
          followingCount
          id
          imageURL
          likesCount
          location
          tweetsCount
          website
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
            id
            createdAt
            profile {
                id
                name
                screenName
            }
            text
            likes
            replies
            retweets
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

const a_user_calls_getTweets = async (user, userId, limit, nextToken) => {
    const getTweets = `query getTweets($userId: ID!, $limit: Int!, $nextToken: String) {
        getTweets(userId: $userId, limit: $limit, nextToken: $nextToken) {
            tweets {
                id
                createdAt
                profile {
                    id
                    name
                    screenName
                }
                ... on Tweet {
                    likes
                    replies
                    retweets
                    text
                }
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
          id
          name
          backgroundImageURL
          bio
          birthDate
          createdAt
          followersCount
          followingCount
          imageURL
          likesCount
          location
          screenName
          tweetsCount
          website
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

module.exports = {
    we_invoke_confirmUserSignup,
    a_user_signs_up,
    we_invoke_an_appSync_template,
    a_user_calls_getMyProfile,
    a_user_calls_editMyProfile,
    we_invoke_getImageUploadURL,
    a_user_calls_getImageUploadUrl,
    we_invoke_tweet,
    a_user_calls_tweet,
    a_user_calls_getTweets
}