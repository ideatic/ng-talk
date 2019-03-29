import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {DocumentReference} from "@google-cloud/firestore";

admin.initializeApp();

export const archiveChats = functions
    .region('europe-west1')
    .firestore
    .document("channels/{chatId}")
    .onUpdate(change => {
        if (!change.after) {
            return null;
        }

        const channel = change.after.data();


        if (!channel) {
            return null;
        }

        const maxMessageCount = 200;
        const maxContentSize = 10000;

        let messageCount = channel.messages.length;
        const originalCount = messageCount;
        let contentSize = JSON.stringify(channel.messages).length;

        if (messageCount >= maxMessageCount || contentSize >= maxContentSize) {
            // Trim messages while conditions are true
            let trimmedMessages: any[] = channel.messages;
            while (messageCount >= maxMessageCount || contentSize >= maxContentSize) {
                const deleteCount = messageCount - maxMessageCount - 10;
                trimmedMessages = trimmedMessages.splice(0, Math.max(1, deleteCount));
                
                messageCount = trimmedMessages.length;
                contentSize = JSON.stringify(trimmedMessages).length;
            }

            // Update
            const channelRef: DocumentReference = change.after.ref;

            const kb = Math.round(contentSize / 1024);
            console.log(`Trimmed '${change.after.id}' messages from ${originalCount} to ${trimmedMessages.length} (${kb}kb)`);

            return channelRef.set({
                messages: trimmedMessages
            }, {merge: true});
        } else {
            return null;
        }
    });