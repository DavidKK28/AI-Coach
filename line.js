// Set line bot config 
const azureTTS = require('./azure-tts');
const fs = require('fs');
const path = require('path');
const line = require('@line/bot-sdk')
const config = {
  channelAccessToken: process.env.channelAccessToken,
  channelSecret: process.env.channelSecret
}
const client = new line.Client(config)
const openai = require('./openai')
const middleware = line.middleware(config)

// Handles an incoming LINE Messaging API event
const handleEvent = async (event) =>{
  if (event.type === 'message' && event.message.type === 'text') {
    const textResponse = await openai.chatGPT(event.message.text);
    const audioFilePath = await azureTTS.textToSpeech(textResponse);
  
    const audioMessage = {
      type: 'audio',
      originalContentUrl: audioFilePath,
      duration: 60000
    };
  
    return client.replyMessage(event.replyToken, audioMessage);
  }
  

  return Promise.resolve(null)
}

module.exports = {
  middleware,
  handleEvent
}
