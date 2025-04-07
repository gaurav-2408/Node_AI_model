// Add this line at the very top of your file, before any imports
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from "express";
import dotenv from "dotenv";
import { getTable, listTables } from "./controller/dynamodb-controller.js";
import cors from "cors";
import OpenAI from 'openai';

dotenv.config();

// Remove the AWS configuration from here since it's in the controller

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Add this to your .env file
});

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting helper
const rateLimiter = {
  lastRequestTime: 0,
  minTimeBetweenRequests: 1000,
};

async function generateResponse(prompt) {
  try {
    // Apply rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - rateLimiter.lastRequestTime;
    if (timeSinceLastRequest < rateLimiter.minTimeBetweenRequests) {
      await new Promise(resolve => 
        setTimeout(resolve, rateLimiter.minTimeBetweenRequests - timeSinceLastRequest)
      );
    }
    
    rateLimiter.lastRequestTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes data and answers questions about it."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Generation error:', error);
    return `Error: ${error.message}. Please try again.`;
  }
}

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

// Start the server
app.listen(4000, () => {
  console.log("SERVER RUNNING ON PORT:4000");
});
