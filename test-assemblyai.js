const { AssemblyAI } = require('assemblyai');
require('dotenv').config();

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

async function test() {
  try {
    const response = await client.transcripts.list();
    console.log('AssemblyAI connected:', response);
  } catch (err) {
    console.error('AssemblyAI error:', err);
  }
}

test();