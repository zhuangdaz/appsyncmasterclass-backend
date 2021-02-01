require('dotenv').config()
const AWS = require('aws-sdk')

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

module.exports = {
    we_invoke_confirmUserSignup,
    a_user_signs_up
}