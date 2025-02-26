// Add this line at the very top of your file, before any imports
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { HfInference } from '@huggingface/inference';
import express from "express";
import dotenv from "dotenv";
import { getTable, listTables } from "./controller/dynamodb-controller.js";
import cors from "cors";
import axios from 'axios';

dotenv.config();

// Hugging Face Initialization with direct API call
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/gpt2";
const headers = {
  'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
  'Content-Type': 'application/json'
};

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting helper
const rateLimiter = {
  lastRequestTime: 0,
  minTimeBetweenRequests: 1000,
};

// Update the generateResponse function to use direct API call
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

    // Direct API call using axios
    const response = await axios.post(
      HUGGING_FACE_API_URL,
      {
        inputs: prompt,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          return_full_text: false
        }
      },
      { headers }
    );

    if (!response.data || response.data.length === 0) {
      throw new Error('No response generated');
    }

    return response.data[0].generated_text;
  } catch (error) {
    console.error('Generation error:', error);
    if (error.response) {
      return `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    }
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
