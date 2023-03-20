const fs = require('fs');
const path = require('path');
const { SpeechConfig, AudioConfig, SpeechSynthesizer, SpeechSynthesisOutputFormat } = require('microsoft-cognitiveservices-speech-sdk');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;


const subscriptionKey = '4d28ad01f3214b8aa96e0a757c111a0b';
const serviceRegion = 'eastus';
const accountName = 'jolin';
const accountKey = 'dolnR3xkXS4OprvKSOV2chiqrewUJYmIDZQO2pgGSYjhdBoGHogg7f4zcFCIEI6n+jdCTVK8UGbD+AStA2+KSg==';
const containerName = 'jolin';


const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);

const textToSpeech = async (text, language = 'en-GB', voice = 'en-GB-EthanNeural') => {
    return new Promise(async (resolve, reject) => {
      const speechConfig = SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
      speechConfig.speechSynthesisLanguage = language;
      speechConfig.speechSynthesisVoiceName = voice;
      speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio16Khz64KBitRateMonoMp3;
  
      const audioFileName = `output-${Date.now()}.mp3`;
      const audioConfig = AudioConfig.fromAudioFileOutput(audioFileName);
  
      const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
  
      synthesizer.speakTextAsync(text, async result => {
        synthesizer.close();
  
        if (result) {
          try {
            const inputFilePath = path.resolve(audioFileName);
            const outputFilePath = path.resolve(`${Date.now()}.m4a`);
            const { stdout, stderr } = await exec(`${ffmpegPath} -i ${inputFilePath} -c:a aac -b:a 64k -strict -2 ${outputFilePath}`);
  
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const blockBlobClient = containerClient.getBlockBlobClient(path.basename(outputFilePath));
            const data = fs.readFileSync(outputFilePath);
            await blockBlobClient.upload(data, data.length);
  
            fs.unlinkSync(audioFileName);
            fs.unlinkSync(outputFilePath);
  
            resolve(blockBlobClient.url);
          } catch (error) {
            reject(`Error in textToSpeech: ${error}`);
          }
        } else {
          reject('Error generating audio');
        }
      }, error => {
        synthesizer.close();
        reject(`Error in textToSpeech: ${error}`);
      });
    });
  }
  

module.exports = {
  textToSpeech
};
