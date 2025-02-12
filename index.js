import  { ChatGoogleGenerativeAI }  from "@langchain/google-genai";
import express from "express";
import dotenv from 'dotenv';
import { getData } from "./controller/dynamodb-controller.js";

dotenv.config();
console.log("API key val: ", process.env.GOOGLE_API_KEY)
const model = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    maxOutputTokens: 2048,
    apiKey: process.env.GOOGLE_API_KEY,
  });

const app = express()
app.use(express.json())

app.post('/api/prompts', async(req, res) => {
  const { prompt } = req.body
  try {
    const response = await generateResponse(prompt)
    res.status(200).json({response: response})
  } catch (error) {
    res.status(500).json({ error: error.message})
    console.error(error)
  }
})

app.get('/api/getdata', getData)


async function generateResponse(prompt) {
  try {
    const response = await model.invoke(prompt)
    console.log(response.content)
    //return response.content
  } catch (error) {
    console.error(error);
    return error.message
  }
}


app.listen(4000, () => {
  console.log('SERVER RUNNING ON PORT:4000')
})