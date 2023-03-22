const fs = require('fs');
const { Buffer } = require('buffer');
const path = require('path');
const { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason, AudioInputStream } = require('microsoft-cognitiveservices-speech-sdk');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ffmpegPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'ffmpeg', 'ffmpeg')
  : require('@ffmpeg-installer/ffmpeg').path;


const subscriptionKey = process.env.AZURE_SPEECH_KEY;
const serviceRegion = process.env.AZURE_SPEECH_REGION;

const convertToWav = async (inputFilePath) => {
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`File not found: ${inputFilePath}`);
    }
  
    const stats = fs.statSync(inputFilePath);
    if (stats.size === 0) {
      throw new Error(`File is empty: ${inputFilePath}`);
    }
  
    const outputFilePath = path.resolve(`${Date.now()}.wav`);
    const { stdout, stderr } = await exec(`${ffmpegPath} -i ${inputFilePath} -acodec pcm_s16le -ac 1 -ar 16000 ${outputFilePath}`);
    return outputFilePath;
  };
  
  const speechToText = async (audioFilePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        const wavFilePath = await convertToWav(audioFilePath);
        const audioData = fs.readFileSync(wavFilePath);
        const speechConfig = SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
        speechConfig.speechRecognitionLanguage = 'ja-JP';
        const audioStream = AudioInputStream.createPushStream();
        audioStream.write(Buffer.from(audioData));
        audioStream.close();
        const audioConfig = AudioConfig.fromStreamInput(audioStream);
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
  
        recognizer.recognizing = (s, e) => {
          console.log(`RECOGNIZING: Text=${e.result.text}`);
        };
  
        recognizer.recognized = (s, e) => {
          fs.unlinkSync(wavFilePath); // 删除临时WAV文件
          if (e.result.reason === ResultReason.RecognizedSpeech) {
            console.log(`RECOGNIZED: Text=${e.result.text}`);
            resolve(e.result.text);
          } else if (e.result.reason === ResultReason.NoMatch) {
            console.log("NOMATCH: Speech could not be recognized.");
            reject('Speech could not be recognized.');
          }
        };
  
        recognizer.canceled = (s, e) => {
          console.log(`CANCELED: Reason=${e.reason}`);
          fs.unlinkSync(wavFilePath); // 删除临时WAV文件
          reject('Speech recognition was canceled.');
        };
  
        recognizer.sessionStopped = (s, e) => {
          console.log("\n    Session stopped event.");
          recognizer.stopContinuousRecognitionAsync();
        };
  
        recognizer.startContinuousRecognitionAsync();
      } catch (error) {
        reject(`Error in speechToText: ${error}`);
      }
    });
  };
  
  module.exports = {
    speechToText
  };
  