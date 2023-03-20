const {
  SpeechConfig,
  AudioConfig,
  SpeechRecognizer,
  ResultReason
} = require("microsoft-cognitiveservices-speech-sdk");

const subscriptionKey = "const subscriptionKey = 'e33585f4decc46958be421161f45e15e";
const serviceRegion = "eastus";

const speechToText = async (audioFilePath) => {
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    const audioConfig = AudioConfig.fromWavFileInput(audioFilePath);
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognized = (s, e) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        resolve(e.result.text);
      } else {
        reject("No speech recognized");
      }
    };

    recognizer.canceled = (s, e) => {
      reject(`Canceled: ${e.errorDetails}`);
    };

    recognizer.startContinuousRecognitionAsync();
  });
};

module.exports = {
  speechToText
};
