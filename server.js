const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

let currentStep = '';

app.post('/scrape', async (req, res) => {
  const { url, email, questionCount, difficulty, questionType } = req.body;
  
  // Reset progress
  currentStep = '';

  try {
    // Simulating the scraping process with logs
    console.log('Starting scraping process');
    await simulateStep('Extracting text content from the page...');
    await simulateStep('Closing browser...');
    await simulateStep('Sending the extracted text for summarization...');
    await simulateStep('Preparing text for summarization...');
    await simulateStep('Summarizing chunk 1 of 3...');
    await simulateStep('Summarizing chunk 2 of 3...');
    await simulateStep('Summarizing chunk 3 of 3...');
    await simulateStep('Creating final summary with questions...');

    // Send the final response
    res.json({ summarizedText: 'Your summarized text here' });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: 'An error occurred during scraping' });
  }
});

app.get('/progress', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendProgress = () => {
    res.write(`data: ${JSON.stringify({ step: currentStep })}\n\n`);
  };

  const progressInterval = setInterval(sendProgress, 1000);

  req.on('close', () => {
    clearInterval(progressInterval);
  });
});

async function simulateStep(step) {
  currentStep = step;
  console.log(step);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 seconds of work
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
