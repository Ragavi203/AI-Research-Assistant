# AI Research Assistant

Academic paper analysis and synthesis tool.

## Features

- PDF text extraction and parsing
- Automated paper analysis (methodology, findings, concepts)
- Multi-paper comparison and synthesis
- Research gap identification
- Cross-paper pattern detection
- Web interface for document management

## Tech Stack

- **Backend**: Node.js, Express
- **AI**: Claude 3.5 Sonnet API
- **PDF Processing**: pdf-parse
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: In-memory (JSON)

## Installation

```bash
git clone https://github.com/yourusername/ai-research-assistant.git
cd ai-research-assistant
npm install
```

## Configuration

Create `.env` file:
```bash
ANTHROPIC_API_KEY=your_claude_api_key
PORT=3000
```

## Usage

```bash
npm start
```

Open `http://localhost:3000`

## API Endpoints

### Upload Paper
```http
POST /upload
Content-Type: multipart/form-data

Body: paper (PDF file)
```

### Get Papers
```http
GET /papers
```

### Compare Papers
```http
POST /compare
Content-Type: application/json

{
  "paperIds": [123, 456, 789]
}
```

## File Structure

```
├── server.js              # Main server
├── public/
│   └── index.html         # Frontend interface
├── uploads/               # Temporary PDF storage
├── package.json
└── .env
```

## Dependencies

```json
{
  "express": "^4.19.2",
  "multer": "^1.4.4",
  "pdf-parse": "^1.1.1",
  "@anthropic-ai/sdk": "^0.24.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5"
}
```

## Claude Integration

Paper analysis prompt structure:
- Extract title, authors, abstract
- Identify methodology and key findings
- List concepts and research questions
- Note limitations and future work
- Return structured JSON

Multi-paper synthesis:
- Compare methodologies across papers
- Identify contradictory findings
- Detect research gaps
- Suggest synthesis opportunities

## Requirements

- Node.js 16+
- Claude API key
- PDF files (text-based, not scanned)

## Performance

- Single paper analysis: ~5-10 seconds
- Multi-paper synthesis: ~10-20 seconds
- PDF size limit: 50MB
- Concurrent uploads: Limited by API rate limits

## Error Handling

- Invalid PDF format detection
- API rate limit management
- File size validation
- Missing environment variables

## Security

- File validation before processing
- Temporary file cleanup
- API key environment protection
- CORS configuration

## Limitations

- In-memory storage (papers lost on restart)
- No user authentication
- Single session management
- Claude API rate limits apply

## Development

```bash
# Install dev dependencies
npm install --save-dev nodemon

# Run in development mode
npm run dev
```

## Production Deployment

1. Set environment variables
2. Configure reverse proxy (nginx/Apache)
3. Use process manager (PM2)
4. Set up database for persistence
5. Implement user authentication

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Submit pull request

## License

MIT
