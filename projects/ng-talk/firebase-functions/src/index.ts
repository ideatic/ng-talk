import {DocumentReference} from '@google-cloud/firestore';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

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
    } else if (!channel.messages) {
      channel.messages = [];
    }

    const maxMessageCount = 250;
    const maxContentSize = 100 * 1024; // 100 kB

    const messageCount = channel.messages.length;
    const originalCount = messageCount;
    let contentSize = JSON.stringify(channel.messages).length;

    if (messageCount >= maxMessageCount || contentSize >= maxContentSize) {
      // Trim messages while conditions are true
      let trimmedMessages: any[] = channel.messages.slice();
      while ((trimmedMessages.length >= (maxMessageCount - 10) || contentSize >= maxContentSize) && trimmedMessages.length > 5) {
        trimmedMessages = trimmedMessages.slice(Math.max(trimmedMessages.length - maxMessageCount + 25, 1));

        contentSize = JSON.stringify(trimmedMessages).length;
      }

      // Update
      const channelRef: DocumentReference = change.after.ref;

      console.log(`Trimmed '${change.after.id}': from ${originalCount} messages to ${trimmedMessages.length} (${contentSize} bytes)`);

      return channelRef.set({
        messages: trimmedMessages
      }, {merge: true});
    } else {
      return null;
    }
  });
