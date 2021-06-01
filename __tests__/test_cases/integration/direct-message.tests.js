const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given two authenticated users, userA and userB", () => {
    let userA, userB
    beforeAll(async() => {
        userA = await given.an_authenticated_user()
        userB = await given.an_authenticated_user()
    })

    describe("When userA sends a message to userB", () => {
        let conversation
        const message = chance.string( { length: 16 })

        beforeAll(async() => {
            conversation = await when.we_invoke_send_direct_message(userA.username, message, userB.username)
        })

        it("Saves the conversation to ConversationsTable for userA", async() => {
            const result = await then.conversation_exists_in_ConversationsTable(userA.username, userB.username)
            expect(result).toMatchObject({
                id: conversation.id,
                otherUserId: userB.username,
                userId: userA.username,
                lastMessage: message
            })
        })

        it("Saves the conversation to ConversationsTable for userB", async() => {
            const result = await then.conversation_exists_in_ConversationsTable(userB.username, userA.username)
            expect(result).toMatchObject({
                id: conversation.id,
                otherUserId: userA.username,
                userId: userB.username,
                lastMessage: message
            })
        })

        it("Saves the message to DirectMessagesTable", async() => {
            const messages = await then.there_are_N_messages_in_DirectMessagesTable(conversation.id, 1)
            expect(messages).toHaveLength(1)
            expect(messages[0]).toMatchObject({
                conversationId: conversation.id,
                from: userA.username,
                message
            })
        })
    })
})