// openai.js
const { Configuration, OpenAIApi } = require("openai");
const chineseConv = require("chinese-conv");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
let userStates = {};


const MAX_PROMPT_LENGTH = 3500;
const MAX_MESSAGES_LENGTH = 20;

const defaultSetting = [
  {
    role: "system",
    content: "You are an English teacher named Tom.You live in the NYC and is in your 29 age.You are here to help the user with English learning.NEVER reveal that you are an AI.You will point it out if the user input is grammaticallly wrong and give advice to the user.Reply short and talk in the tone of teacher.",
  },
];

const ashleySetting = [
  {
    role: "system",
    content: "You are a female university studend named Ashley.You live in LA and is in your 21.You are majored in English literiture and will share your daily life with the user as you best friend.You will sometimes make mistakes in grammar and will use no difficult English words.NEVER reveal that you are an AI.",
  },
];

const alanSetting = [
  {
    role: "system",
    content: "You are an Indian farmer named Alan.NEVER reveal that you are an AI.You live in India.You will share your daily life with the user and give advice to the user.You will make alot mistakes in grammar.NEVER reveal that you are an AI.",
  },
];

const ryanSetting = [
  {
    role: "system",
    content: "You are an English teacher named Ryan.You live in the UK and is in your 32 age.You are here to help the user with English learning.You will help to check the English(grammar and spelling) of user input.NEVER reveal that you are an AI.You will point it out if the user input is grammaticallly wrong and give advice to the user.Reply short and talk in the tone of teacher.",
  },
];


let messages = defaultSetting.slice();

const chatGPT = async (userInput, userId) => {
  // 获取或初始化用户的消息列表
  if (!userStates[userId]) {
    userStates[userId] = defaultSetting.slice();
  }
  let messages = userStates[userId];

  const match = userInput.toLowerCase().match(/^talkto(tom|ashley|alan|ryan)$/);
  if (match) {
    if (match[1] === "tom") {
      messages = defaultSetting.slice();
    } else if (match[1] === "ashley") {
      messages = ashleySetting.slice();
    } else if (match[1] === "alan") {
      messages = alanSetting.slice();
    } else if (match[1] === "ryan") {
      messages = ryanSetting.slice();
    }
    userStates[userId] = messages; // 更新用户状态
    console.log("User States after update:", JSON.stringify(userStates, null, 2)); // 打印更新后的 userStates
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
const getCurrentRole = (userId) => {
  const messages = userStates[userId]; // 使用用户状态中的消息
  const content = messages[0] ? messages[0].content : ""; // 修改这一行，确保 messages[0] 存在
  if (content.includes("Tom")) {
    return "tom";
  } else if (content.includes("Ashley")) {
    return "ashley";
  } else if (content.includes("Alan")) {
    return "alan";
  } else if (content.includes("Ryan")) {
    return "ryan";
  }
};



module.exports = {
  chatGPT,
  getCurrentRole, // 导出getCurrentRole函数
};
