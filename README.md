# 📈 Stock Analyzer

ML stock analysis pipeline combining a **linear regression price prediction model** with a **Groq LLaMA 3.3 agent**, orchestrated through n8n and served via a Node.js/Express backend.

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
    ↓  Respond to Webhook
Express  →  { ml, summary }  →  Browser
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

1. `git clone https://github.com/YOUR_USERNAME/ML-Stock-Analyzer.git` and `cd ML-Stock-Analyzer`
2. `npm install`
3. `pip install -r ml/requirements.txt`
4. Copy `.env.example` to `.env` and fill in your variables (`PORT`, `N8N_WEBHOOK_URL`)
5. Run `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n` to start n8n
6. Build your n8n workflow (Webhook → Code → AI Agent → Respond to Webhook)
7. `npm run dev`

## n8n Workflow
<img width="1085" height="446" alt="n8n workflow sc" src="https://github.com/user-attachments/assets/c1db10b6-9077-435f-9f3a-94e37ccea590" />
<br>
The secondary Code Node is not necessary, but was kept from debugging issues

## In Action
<img width="1904" height="907" alt="Stock Analyzer 1" src="https://github.com/user-attachments/assets/5979f079-f2b0-43c8-bb39-3c628ac99dad" />
<img width="1906" height="909" alt="Stock Analyzer 2" src="https://github.com/user-attachments/assets/22bc936b-c1a0-41a7-b5ba-023dbe857f39" />



