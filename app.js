const express = require('express')
require('dotenv').config()
const axios = require('axios')
const AIDevs_API_KEY = process.env.AIDevs_API_KEY

// OpenAI
const OpenAI = require('openai')
const OPEN_AI_KEY = process.env.OPEN_AI_KEY
const openai = new OpenAI({
  apiKey: OPEN_AI_KEY
});

const app = express()
const port = 3000

app.get('/', async (req, res) => {
  res.status(200).json({
    endpoints: [
      'moderation',
      'blogger',
      'liar'
    ]
  })
})

// Blogger
app.get('/blogger', async (req, res) => {
  const { token } = await getTaskToken('blogger')
  const { task } = await getTaskByToken(token);

  
  const result = []
  for(let sentence of task.blog) {
    const { response } = await bloggerTask(sentence)
    const text = findContent(response)
    result.push(text)
  }

  const submit_response = await submitAnswer(token, result)

  res.status(200).json({
    token: token,
    task: task,
    result: result,
    response: submit_response.response
  });
})

// Moderation
app.get('/moderation', async (req, res) => {

  const { token } = await getTaskToken('moderation')
  const { task } = await getTaskByToken(token);

  let result = [];
  for(let text of task.input) {
    let { response } = await getModeration(text)
    if(response[0].flagged == true) result.push(1)
    else result.push(0)
  }

  const { response } = await submitAnswer(token, result)
 
  res.status(200).json({
    token: token,
    task: task,
    result: result,
    response: response
  });
})

// Liar
app.get('/liar', async (req, res) => {

  const { token } = await getTaskToken('liar')
  const question = "What is a biggest river in Poland?"
  const { task } = await getTaskByPost(token, { question: question});
 
  let result = await liarTask(question, task.answer)
  const text = findContent(result.response)

  const { response } = await submitAnswer(token, text)

  res.status(200).json({
    token: token,
    task: task,
    result: text,
    response: response
  });
})

// Inprompt
app.get('/inprompt', async (req, res) => {

  const { token } = await getTaskToken('inprompt')
  const { task } = await getTaskByToken(token)

  const { response } = await inPromptTask(task.msg)

  const name = findContent(response)
  console.log("FO?UND NAME: ",name)
  let context = "";
  if(task.input.length > 0) {
    task.input.forEach(line => {
     if(line.includes(name+" ")) {
      context += line + '\n';
      console.warn("MATCH: ", name, line)
     }
    });
  }
 console.log("context: ", context)
 console.log("task message: ",task.msg)
  const getAnswer =  await getAnswerToQuestionUsingContext(task.msg, context)
  const answer = findContent(getAnswer.response)

  console.log("getAnswer: ",getAnswer.response)
  console.log("answer: ",answer)
  const submitResult = await submitAnswer(token,answer)

  res.status(200).json({
    token: token,
    task: task.msg,
    name: name,
    includes: context,
    answer: answer,
    result: submitResult.response
    // response: response
  });
})

app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}`)
})


// Get task token
async function getTaskToken(taskName) {
  try {
    const apiUrl = `https://zadania.aidevs.pl/token/${taskName}`; 
   
    const requestData = {
      apikey: AIDevs_API_KEY
    }

    const response = await axios.post(apiUrl, requestData);
    return { token: response.data.token}
  } catch (error) {
    console.log(error)
    return { token: null}
  }
}

// Get task by valid token
async function getTaskByToken(token) {


  try {
    const apiUrl = `https://zadania.aidevs.pl/task/${token}`; 
    const response = await axios.get(apiUrl);
    return { task: response.data}
  } catch (error) {
    console.log(error)
    return { task: null}
  }
}

async function getTaskByPost(token, data) {


  try {
    const apiUrl = `https://zadania.aidevs.pl/task/${token}`; 

    const headers = {
      'Content-Type': 'multipart/form-data', // Set the appropriate content type if needed
    };

    const response = await axios.post(apiUrl, data, { headers });
    return { task: response.data}
  } catch (error) {
    console.log(error)
    return { task: null}
  }
}

// Send answer for task
async function submitAnswer(token, answer) {
  try {
    const apiUrl = `https://zadania.aidevs.pl/answer/${token}`; 
   
    const requestData = {
      answer: answer
    }

    const response = await axios.post(apiUrl, requestData);
    return { response: response.data}
  } catch (error) {
    console.log(error.message)
    return { response: null}
  }
}

// Get input moderation from OpenAI API
async function getModeration(text) {
  try {
    const apiUrl = `https://api.openai.com/v1/moderations`; 
   
    const accessToken = OPEN_AI_KEY;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json', // Set the appropriate content type if needed
    };

    const requestData = {
      input: text
    }

    const response = await axios.post(apiUrl, requestData, { headers });
    return { response: response.data.results}
  } catch (error) {
    console.log(error)
    return { response: null}
  }
}
// Get text to blog from OpenAI API
async function getAnswerToQuestionUsingContext(question, data) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: `${question}` },
        {
          role: "system",
          content: `

          You will be provided with question, that you have to answer. That your only one thing to do. Answer using context provided to you. 
          On any diffrent questions not related with context, simply answer example: "I don't know"

          Rules:
          - use only context informations to answer the question
          - if context do not provide enought informations simply return "i don't know"

          context###
          ${data}
          `
        },
      ],
      model: 'gpt-3.5-turbo',
    });
  
    return { response: chatCompletion.choices}
  } catch (error) {
    console.log(error.message)
    return { response: null}
  }
}
// Get text to blog from OpenAI API
async function inPromptTask(question) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: `${question}` },
        {
          role: "system",
          content: `
          Find a name and return it. 
          
          Rules:
          - response is only name, without any more informations
          `
        },
      ],
      model: 'gpt-3.5-turbo',
    });
  
    return { response: chatCompletion.choices}
  } catch (error) {
    console.log(error)
    return { response: null}
  }
}

// Get text to blog from OpenAI API
async function liarTask(question, answer) {
  console.warn(question,answer)
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: `${answer}` },
        {
          role: "system",
          content: `
          Is this the correct answer to the question: ${question}
          Answer in a single word, like: 'YES' or 'NO'
          
          Rules:
          - you can only answer "YES" or "NO"
          - do not use comma, dots
          `
        },
      ],
      model: 'gpt-3.5-turbo',
    });
  
    return { response: chatCompletion.choices}
  } catch (error) {
    console.log(error)
    return { response: null}
  }
}

// Get text to blog from OpenAI API
async function bloggerTask(text) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: `${text}` },
        {
          role: "system",
          content: "Jako blogger napisz w 4 zdaniach rodział do wprowadzonego tekstu. Artykuł jest na temat przyrządzania pizzy Margherity."
        },
      ],
      model: 'gpt-3.5-turbo',
    });
  
    return { response: chatCompletion.choices}
  } catch (error) {
    console.log(error)
    return { response: null}
  }
}

// Find content inside OpenAI API response
function findContent(response) {

  console.log(response)
  if(!Array.isArray(response)) return 'No content: '+response
  if(typeof response[0].message == 'undefined')  return 'No content: '+response[0]
  if(typeof response[0].message.content == 'undefined') return 'No content: '+response[0].message
  
  return response[0].message.content;

}