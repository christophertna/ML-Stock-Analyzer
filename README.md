# Stock Analyzer

ML stock analysis pipeline combining a **linear regression price prediction model** with a **RAG-style Groq LLaMA 3.3 agent**, orchestrated through n8n and served via a Node.js/Express backend.

---

## What It Does

Enter a stock ticker and the app:
1. Fetches 6 months of historical OHLCV data via yfinance
2. Engineers features (moving averages, lagged prices, volatility, volume) and trains a linear regression model
3. Predicts the next trading day's closing price and evaluates model confidence (R², MAE)
4. Sends the ML result to an n8n workflow where a Groq LLaMA 3.3 agent cross-references it against real-time data from 4 external sources
5. Returns a structured verdict (PLAUSIBLE / UNLIKELY / HIGH RISK) with evidence and a disclaimer

---

## Architecture
```
Browser (vanilla JS + Chart.js)
    ↓ 
POST /api/analyzeExpress (Node.js)
    ↓  child_process
Python predict.py  →  linear regression result (JSON)
    ↓  POST to webhook
n8n Workflow
├── Code node  →  fetches NewsAPI, Finnhub, Alpha Vantage, SEC-API in parallel
└── AI Agent   →  Groq LLaMA 3.3 reasons over all data
    ↓  Respond to WebhookExpress  →  { ml, summary }  →  Browser
```
## Tech Stack

| Layer | Technology |
|---|---|
| ML model | Python · scikit-learn · yfinance · pandas |
| Backend | Node.js · Express |
| Agent orchestration | n8n (self-hosted with Docker) |
| LLM | Groq · LLaMA 3.3 70B Versatile |
| Data sources | NewsAPI · Finnhub · Alpha Vantage · SEC-API |
| Frontend | Vanilla JS · Chart.js · Inter font |

---

## Project Structure
```
stock-analyzer/
├── server.js                 ← Express entry point
├── package.json
├── .env.example              ← copy to .env and fill in keys
├── routes/  
│   └── analyze.js            ← POST /api/analyze route handler
│    
├── agent/   
│   └── n8nClient.js          ← sends ML result to n8n webhook
│
├── ml/ 
│   └── predict.py            ← linear regression model
│   ├── runner.js             ← spawns predict.py as child process
│   └── requirements.txt      ← Python dependencies
│
└── public/
    └── index.html            ← frontend UI
```

## Setup

### 1. Clone the repo
```bash
git clone [https://github.com/YOUR_USERNAME/stock-analyzer.git](https://github.com/YOUR_USERNAME/stock-analyzer.git)
cd stock-analyzer
2. Install Node.js dependenciesBashnpm install
3. Install Python dependenciesBashpip install -r ml/requirements.txt
4. Configure environment variablesBashcp .env.example .env
Fill in .env:PORT=3000
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/stock-analysis
5. Set up n8n (self-hosted via Docker)Bashdocker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
Build the workflow in n8n:Webhook node → POST, path: stock-analysis, response mode: Using Respond to Webhook nodeCode node → fetches NewsAPI, Finnhub, Alpha Vantage, SEC-API in parallel and builds the agent promptAI Agent node → Groq LLaMA 3.3 70B, Conversation Agent, no toolsRespond to Webhook node → returns { "summary": "..." }6. Run the appBashnpm run dev
Visit: http://localhost:3000Running TestsJavaScript (Jest):Bashnpm test
Python (pytest):Bashpytest tests/python
All tests use mocks — no API tokens are consumed during testing.n8n Agent LogicThe agent receives pre-fetched data from 4 sources and evaluates the ML prediction sequentially:SEC-API — checks for bankruptcy or legal collapse in recent 8-K filingsAlpha Vantage — checks P/E ratio and profit margins against the growth predictionFinnhub — evaluates market sentiment and current quote dataNewsAPI — scans recent English-language headlines for adverse eventsIf any source triggers a critical signal the agent stops early and reports the risk. Otherwise it synthesizes all evidence into a final Plausibility Rating (High / Medium / Low).Key ML Concepts UsedConceptWhereSupervised learningLinear regression on closing priceFeature engineeringMA5, MA20, Lag1-3, volatility, volume MATime-series train/test splitshuffle=False to prevent data leakageMAE + R² evaluationModel confidence metrics shown in UIRAG-style LLM groundingReal-time data injected into agent promptDisclaimerThis tool is for educational purposes only. All predictions and AI-generated analysis are not financial advice. Always consult a qualified financial advisor before making investment decisions.
