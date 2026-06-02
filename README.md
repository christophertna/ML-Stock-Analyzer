Stock Analyzer
ML stock analysis pipeline combining a linear regression price prediction model with a RAG-style Groq LLaMA 3.3 agent, orchestrated through n8n and served via a Node.js/Express backend.
---
What It Does
Enter a stock ticker and the app:
Fetches 6 months of historical OHLCV data via yfinance
Engineers features (moving averages, lagged prices, volatility, volume) and trains a linear regression model
Predicts the next trading day's closing price and evaluates model confidence (R², MAE)
Sends the ML result to an n8n workflow where a Groq LLaMA 3.3 agent cross-references it against real-time data from 4 external sources
Returns a structured verdict (PLAUSIBLE / UNLIKELY / HIGH RISK) with evidence and a disclaimer
---
Architecture
```
Browser (vanilla JS + Chart.js)
        ↓  POST /api/analyze
Express (Node.js)
        ↓  child_process
Python predict.py  →  linear regression result (JSON)
        ↓  POST to webhook
n8n Workflow
  ├── Code node  →  fetches NewsAPI, Finnhub, Alpha Vantage, SEC-API in parallel
  └── AI Agent   →  Groq LLaMA 3.3 reasons over all data
        ↓  Respond to Webhook
Express  →  { ml, summary }  →  Browser
```
---
Tech Stack
Layer	Technology
ML model	Python · scikit-learn · yfinance · pandas
Backend	Node.js · Express
Agent orchestration	n8n (self-hosted)
LLM	Groq · LLaMA 3.3 70B Versatile
Data sources	NewsAPI · Finnhub · Alpha Vantage · SEC-API
Frontend	Vanilla JS · Chart.js · Inter font
---
Project Structure
```
stock-analyzer/
├── server.js                 ← Express entry point
├── package.json
├── .env.example              ← copy to .env and fill in keys
│
├── routes/
│   └── analyze.js            ← POST /api/analyze route handler
│
├── agent/
│   └── n8nClient.js          ← sends ML result to n8n webhook
│
├── ml/
│   ├── predict.py            ← linear regression model
│   ├── runner.js             ← spawns predict.py as child process
│   └── requirements.txt      ← Python dependencies
│
├── public/
│   └── index.html            ← frontend UI
│
└── tests/
    ├── js/
    │   ├── runner.test.js    ← Jest tests for Node/Python bridge
    │   └── analyze.test.js   ← Jest tests for Express route
    └── python/
        └── test_predict.py   ← pytest tests for ML pipeline
```
---
Setup
1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/stock-analyzer.git
cd stock-analyzer
```
2. Install Node.js dependencies
```bash
npm install
```
3. Install Python dependencies
```bash
pip install -r ml/requirements.txt
```
4. Configure environment variables
```bash
cp .env.example .env
```
Fill in `.env`:
```
PORT=3000
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/stock-analysis
```
5. Set up n8n (self-hosted via Docker)
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```
Build the workflow in n8n:
Webhook node → POST, path: `stock-analysis`, response mode: `Using Respond to Webhook node`
Code node → fetches NewsAPI, Finnhub, Alpha Vantage, SEC-API in parallel and builds the agent prompt
AI Agent node → Groq LLaMA 3.3 70B, Conversation Agent, no tools
Respond to Webhook node → returns `{ "summary": "..." }`
6. Run the app
```bash
npm run dev
```
Visit: http://localhost:3000
---
Running Tests
JavaScript (Jest):
```bash
npm test
```
Python (pytest):
```bash
pytest tests/python
```
All tests use mocks — no API tokens are consumed during testing.
---
n8n Agent Logic
The agent receives pre-fetched data from 4 sources and evaluates the ML prediction sequentially:
SEC-API — checks for bankruptcy or legal collapse in recent 8-K filings
Alpha Vantage — checks P/E ratio and profit margins against the growth prediction
Finnhub — evaluates market sentiment and current quote data
NewsAPI — scans recent English-language headlines for adverse events
If any source triggers a critical signal the agent stops early and reports the risk. Otherwise it synthesizes all evidence into a final Plausibility Rating (High / Medium / Low).
---
Key ML Concepts Used
Concept	Where
Supervised learning	Linear regression on closing price
Feature engineering	MA5, MA20, Lag1-3, volatility, volume MA

Time-series train/test split	`shuffle=False` to prevent data leakage
MAE + R² evaluation	Model confidence metrics shown in UI
RAG-style LLM grounding	Real-time data injected into agent prompt
---
Disclaimer
This tool is for educational purposes only. All predictions and AI-generated analysis are not financial advice. Always consult a qualified financial advisor before making investment decisions.
