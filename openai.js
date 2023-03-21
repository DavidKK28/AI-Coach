// openai.js
const { Configuration, OpenAIApi } = require("openai");
const chineseConv = require("chinese-conv");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const MAX_PROMPT_LENGTH = 3500;
const MAX_MESSAGES_LENGTH = 20;

const defaultSetting = [
  {
    role: "system",
    content: "You are an English teacher named Tom.You live in the UK and is in your 29 age.You are here to help the user with English learning.NEVER reveal that you are an AI.You will point it out if the user input is grammaticallly wrong and give advice to the user.",
  },
];

const jolinSetting = [
  {
    role: "system",
    content: "You are a female singer named Jolin.You live in Taiwan and is in your 35 age.You will share your daily life with the user and give advice to the user.You will sometimes make mistakes in grammar.NEVER reveal that you are an AI.",
  },
];

const alanSetting = [
  {
    role: "system",
    content: "You are an Indian farmer named Alan.NEVER reveal that you are an AI.You live in India.You will share your daily life with the user and give advice to the user.You will make alot mistakes in grammar.NEVER reveal that you are an AI.",
  },
];

let messages = defaultSetting.slice();

const chatGPT = async (userInput) => {
  const match = userInput.toLowerCase().match(/^talkto(tom|jolin|alan)$/);
  if (match) {
    if (match[1] === "tom") {
      messages = defaultSetting.slice();
    } else if (match[1] === "jolin") {
      messages = jolinSetting.slice();
    } else if (match[1] === "alan") { // 新增
      messages = alanSetting.slice(); // 新增
    }
    return `Now you are talking with ${match[1]}`;
  } else {
    messages.push({ role: "user", content: `${userInput.slice(0, 500)}` });
  }

  if (messages.length > MAX_MESSAGES_LENGTH) {
    messages.splice(1, 2);
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500,
    });
    // Clean up the text and translate simplified Chinese to traditional
    const text = chineseConv
      .tify(completion.data.choices[0].message.content.trim().replace(/^[\n,.;:?!，。；：？！]+/, ""));
    // If the length of the conversation exceeds 3600 tokens, delete the earliest message after setting.
    if (completion.data.usage.total_tokens > MAX_PROMPT_LENGTH) {
      messages.splice(1, 2);
    }
    // Save response records for continuous conversation
    messages.push({ role: "assistant", content: `${text}` });
    return text;
  } catch (err) {
    console.log("error.message = ", err.message);
  }
};
const getCurrentRole = () => {
  const content = messages[0].content;
  if (content.includes("Tom")) {
    return "tom";
  } else if (content.includes("Jolin")) {
    return "jolin";
  } else if (content.includes("Alan")) { // 新增
    return "alan"; // 新增
  }
};

module.exports = {
  chatGPT,
  getCurrentRole, // 导出getCurrentRole函数
};
