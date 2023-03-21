// line.js
const azureTTS = require("./azure-tts");
const azureSpeech = require("./azure-speech");
const fs = require("fs");
const path = require("path");
const line = require("@line/bot-sdk");
const config = {
  channelAccessToken: process.env.channelAccessToken,
  channelSecret: process.env.channelSecret
};

const client = new line.Client(config);
const openai = require("./openai");
const middleware = line.middleware(config);

// Handles an incoming LINE Messaging API event
const handleEvent = async (event) => {
  if (event.type === "message") {
    if (event.message.type === "text") {
      const textResponse = await openai.chatGPT(event.message.text, event.source.userId);
      const currentRole = openai.getCurrentRole(event.source.userId); // 传递用户ID
      const audioFilePath = await azureTTS.textToSpeech(textResponse, currentRole);
      console.log(`Current role: ${currentRole}`); // 输出 currentRole 的值


      const audioMessage = {
        type: "audio",
        originalContentUrl: audioFilePath,
        duration: 60000
      };

      return client.replyMessage(event.replyToken, audioMessage);
    } else if (event.message.type === "audio") {
      // Download audio file from LINE server
      const audioStream = await client.getMessageContent(event.message.id);
      const audioFilePath = path.join(__dirname, "tempAudio.wav");
      const writeStream = fs.createWriteStream(audioFilePath);
      audioStream.pipe(writeStream);

      writeStream.on("finish", async () => {
        try {
          const recognizedText = await azureSpeech.speechToText(audioFilePath);
          fs.unlinkSync(audioFilePath); // Remove temporary audio file

          const textResponse = await openai.chatGPT(recognizedText, event.source.userId);
          const currentRole = openai.getCurrentRole(event.source.userId); // 传递用户ID
          const audioResponsePath = await azureTTS.textToSpeech(textResponse, currentRole);
          const audioMessage = {
            type: "audio",
            originalContentUrl: audioResponsePath,
            duration: 60000
          };

          return client.replyMessage(event.replyToken, audioMessage);
        } catch (error) {
          console.error("Error processing audio:", error);
        }
      });

      writeStream.on("error", (error) => {
        console.error("Error writing audio file:", error);
      });

    }
  }

  return Promise.resolve(null);
};

module.exports = {
  middleware,
  handleEvent
};
