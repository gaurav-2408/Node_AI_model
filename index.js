import  { ChatGoogleGenerativeAI }  from "@langchain/google-genai";
import express from "express";
import dotenv from 'dotenv';
import  {getTable} from "./controller/dynamodb-controller.js";
import AWS from 'aws-sdk';
//import { getTable } from "./config.js";

dotenv.config();

//AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken:process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION
});

console.log("API key val: ", process.env.GOOGLE_API_KEY)
const model = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    maxOutputTokens: 2048,
    apiKey: process.env.GOOGLE_API_KEY,
  });

const app = express()
app.use(express.json())

app.post('/api/prompts/:tableName', async(req, res) => {
  const { prompt } = req.body
  try {
    const response = await generateResponse(prompt)
    res.status(200).json({response: response})
  } catch (error) {
    res.status(500).json({ error: error.message})
    console.error(error)
  }
})

app.get('/api/getdata/:tableName', async (req, res) => {
  const { tableName } = req.params; 
  try {
    const tableInfo = await getTable(tableName); // Call the function properly
    res.status(200).json(tableInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  }
});



async function generateResponse(prompt) {
  try {
    const response = await model.invoke(prompt)
    console.log(response.content)
    return response.content
  } catch (error) {
    console.error(error);
    return error.message
  }
}


app.listen(4000, () => {
  console.log('SERVER RUNNING ON PORT:4000')
})