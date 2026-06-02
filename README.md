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

## Setup Steps

1. `git clone https://github.com/YOUR_USERNAME/stock-analyzer.git` and `cd stock-analyzer`
2. `npm install`
3. `pip install -r ml/requirements.txt`
4. Copy `.env.example` to `.env` and fill in your variables (`PORT`, `N8N_WEBHOOK_URL`)
5. Run `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n` to start n8n
6. Build your n8n workflow (Webhook → Code → AI Agent → Respond to Webhook)
7. `npm run dev`
