import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import express from "express";
import dotenv from "dotenv";
import { getTable, listTables } from "./controller/dynamodb-controller.js";
import AWS from "aws-sdk";
import cors from "cors";

dotenv.config();

// AWS Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION,
});

// Google API Model Initialization
const model = new ChatGoogleGenerativeAI({
  model: "gemini-pro",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

const app = express();
app.use(express.json());
app.use(cors());

// Route to handle prompts
app.post("/api/prompts/:tableName", async (req, res) => {
  const { tableName } = req.params;
  const { prompt } = req.body;

  try {
    // Step 1: Fetch table data from DynamoDB
    const tableData = await getTable(tableName); // Assuming getTable fetches all data

    // Step 2: Create a relevant context for the model
    const tableContext = tableData.Items.map(item => JSON.stringify(item)).join("\n");

    // Step 3: Combine the table data with the user's prompt
    const fullPrompt = `${tableContext}\n\nUser's Question: ${prompt}`;

    // Step 4: Generate the response from the AI model
    const response = await generateResponse(fullPrompt);
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    const data = await listTables();
    res.json(data);
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

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

// Function to call the model
async function generateResponse(prompt) {
  try {
    const response = await model.invoke(prompt);
    console.log(response.content);
    return response.content;
  } catch (error) {
    console.error(error);
    return error.message;
  }
}

// Start the server
app.listen(4000, () => {
  console.log("SERVER RUNNING ON PORT:4000, grj chamge");
});
