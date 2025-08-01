const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const port = 3000;

// Initialize Claude API
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Will read from .env file
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Store analyzed papers in memory (for demo - use database in production)
let papers = [];

// Upload and analyze paper
app.post('/upload', upload.single('paper'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file:', req.file.originalname);
    
    // Extract text from PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;

    console.log('Extracted text length:', text.length);

    // Analyze with Claude
    const analysis = await analyzePaper(text, req.file.originalname);
    
    // Store paper data
    const paper = {
      id: Date.now(),
      filename: req.file.originalname,
      text: text,
      analysis: analysis,
      uploadedAt: new Date()
    };
    
    papers.push(paper);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      paper: {
        id: paper.id,
        filename: paper.filename,
        analysis: paper.analysis
      }
    });

  } catch (error) {
    console.error('Error processing paper:', error);
    res.status(500).json({ error: 'Failed to process paper' });
  }
});

// Analyze paper with Claude
async function analyzePaper(text, filename) {
  try {
    const prompt = `Analyze this academic paper and extract key information. Return a JSON object with the following structure:

{
  "title": "paper title",
  "authors": ["author1", "author2"],
  "abstract": "brief abstract summary",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "methodology": "brief methodology description", 
  "concepts": ["concept1", "concept2", "concept3"],
  "researchQuestion": "main research question",
  "limitations": "key limitations mentioned",
  "futureWork": "suggested future research directions"
}

Paper text:
${text.substring(0, 8000)}...`; // Limit text for API

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    // Parse Claude's response as JSON
    const analysisText = message.content[0].text;
    
    // Try to extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Fallback if JSON parsing fails
      return {
        title: filename,
        summary: analysisText,
        error: "Could not parse structured response"
      };
    }

  } catch (error) {
    console.error('Claude API error:', error);
    return {
      title: filename,
      error: "Analysis failed",
      rawText: text.substring(0, 500) + "..."
    };
  }
}

// Get all papers
app.get('/papers', (req, res) => {
  const paperSummaries = papers.map(p => ({
    id: p.id,
    filename: p.filename,
    analysis: p.analysis,
    uploadedAt: p.uploadedAt
  }));
  res.json(paperSummaries);
});

// Compare papers
app.post('/compare', async (req, res) => {
  try {
    const { paperIds } = req.body;
    
    if (!paperIds || paperIds.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 papers to compare' });
    }

    const selectedPapers = papers.filter(p => paperIds.includes(p.id));
    
    if (selectedPapers.length < 2) {
      return res.status(400).json({ error: 'Could not find specified papers' });
    }

    // Create comparison prompt
    const papersData = selectedPapers.map(p => ({
      title: p.analysis.title || p.filename,
      findings: p.analysis.keyFindings || [],
      methodology: p.analysis.methodology || "Not specified",
      concepts: p.analysis.concepts || []
    }));

    const comparison = await comparePapers(papersData);
    
    res.json({
      success: true,
      comparison: comparison,
      papers: papersData
    });

  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: 'Failed to compare papers' });
  }
});

// Compare papers with Claude
async function comparePapers(papersData) {
  const prompt = `Compare these academic papers and identify:

1. Common themes and overlapping concepts
2. Contradicting findings or approaches  
3. Research gaps that could be explored
4. Methodological differences
5. Synthesis of key insights

Papers to compare:
${JSON.stringify(papersData, null, 2)}

Return a structured analysis focusing on connections and differences.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [{
        role: "user", 
        content: prompt
      }]
    });

    return message.content[0].text;

  } catch (error) {
    console.error('Comparison failed:', error);
    return "Failed to generate comparison";
  }
}

// Start server
app.listen(port, () => {
  console.log(`🚀 Research Assistant running on http://localhost:${port}`);
  console.log('📁 Upload PDFs to analyze academic papers');
  console.log('🔍 Compare multiple papers for synthesis');
});