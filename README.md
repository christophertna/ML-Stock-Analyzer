# Stock Analyzer

ML-powered stock price analysis with an n8n-hosted Groq AI agent.
Built with Python (scikit-learn), Node.js (Express), and a vanilla JS frontend.
The agentic workflow — Groq LLM reasoning, news fetching, prompt logic — lives
entirely inside n8n. Express just sends data to it and waits for the summary.

---

## How It All Fits Together

```
Browser
  │
  │  POST /api/analyze  { ticker: "AAPL" }
  ▼
Express (server.js)
  │
  │  spawns child process
  ▼
Python predict.py  →  returns ML result JSON
  │
  │  POST to n8n webhook URL
  ▼
n8n Workflow
  ├── AI Agent node (Groq via n8n credentials)
  │     └── Tool: HTTP Request → NewsAPI headlines
  │
  └── Respond to Webhook  →  { "summary": "..." }
  │
  │  summary string returned to Express
  ▼
Express sends  { ml: {...}, summary: "..." }  to browser
  │
  ▼
Browser renders chart + metrics + AI summary
```

---

## Project Structure

```
stock-analyzer/
├── server.js               ← Express app entry point
├── package.json            ← Node.js dependencies
├── .env.example            ← Copy to .env and fill in values
│
├── routes/
│   └── analyze.js          ← POST /api/analyze — coordinates ML + n8n
│
├── agent/
│   └── n8nClient.js        ← Sends ML results to n8n, returns summary
│
├── ml/
│   ├── predict.py          ← Python linear regression model
│   ├── runner.js           ← Node.js spawns predict.py as child process
│   └── requirements.txt    ← Python dependencies
│
└── public/
    └── index.html          ← Frontend UI (HTML + CSS + JS)
```

---

## Setup Instructions

### 1. Install Node.js dependencies
```bash
npm install
```

### 2. Install Python dependencies
```bash
pip install -r ml/requirements.txt
```

### 3. Set up your environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in your `N8N_WEBHOOK_URL` (see n8n setup below).

### 4. Set up your n8n workflow (see section below)

### 5. Run the app
```bash
npm start
```
For auto-restart during development:
```bash
npm run dev
```

Then visit: **http://localhost:3000**

---

## n8n Workflow Setup

This is where your Groq agent lives. Build it visually in n8n:

### Step 1 — Create a new workflow in n8n

### Step 2 — Add a Webhook node
- Method: `POST`
- Path: `stock-analysis` (or any name you like)
- Response mode: `Using Respond to Webhook node` ← critical setting
- Copy the **Test URL** and paste it into your `.env` as `N8N_WEBHOOK_URL`

### Step 3 — Add an AI Agent node
- Connect it to the Webhook node
- Model: Select Groq as the provider, choose `llama-3.3-70b-versatile`
  (you'll need to add Groq credentials in n8n Settings → Credentials)
- System prompt — example to get you started:
  ```
  You are a financial analysis assistant. You receive stock prediction
  data from a linear regression ML model. Interpret the results clearly,
  explain what the confidence metrics mean, and always remind the user
  this is not financial advice.
  ```
- User prompt — reference the incoming webhook data using n8n expressions:
  ```
  Analyze this stock prediction:
  Ticker: {{ $json.ticker }}
  Current price:   ${{ $json.ml.current_price }}
  Predicted price: ${{ $json.ml.predicted_price }}
  Model MAE:       {{ $json.ml.mae }}
  Model R² score:  {{ $json.ml.r2 }}
  ```
- CONCEPT TO LEARN: {{ $json.fieldName }} is n8n's expression syntax.
  It references data from the previous node in the workflow.
  $json refers to the JSON body of the incoming data.

### Step 4 — (Optional) Add a news tool to the AI Agent
- Inside the AI Agent node, add a Tool: HTTP Request
- URL: `https://newsapi.org/v2/everything?q={{ $json.ticker }} stock&pageSize=5&apiKey=YOUR_KEY`
- The agent will automatically decide when to call this tool for context
- Store your NewsAPI key in n8n's credential store, not hardcoded in the URL

### Step 5 — Add a Respond to Webhook node
- Connect it after the AI Agent node
- Response body — return the agent's output as JSON:
  ```json
  {
    "summary": "{{ $json.output }}"
  }
  ```
- CONCEPT TO LEARN: This node is what sends the HTTP response back to
  your Express app (n8nClient.js is awaiting it). Without this node,
  your Express server will hang until the 30-second timeout fires.

### Step 6 — Test the workflow
- Click "Listen for test event" in n8n
- Run your app and analyze a ticker
- Watch the data flow through each node in real time in n8n's editor

### Step 7 — Activate for production
- Toggle the workflow to **Active** (top-right in n8n editor)
- Switch your `.env` `N8N_WEBHOOK_URL` to the Production URL
- Production URL works even when the n8n editor is closed

---

## Implementation Order (Recommended)

Work through the files in this order:

### Phase 1 — The ML Model (Pure Python)
**File: `ml/predict.py`**
- Get this working first by running it directly:
  ```bash
  python3 ml/predict.py AAPL
  ```
- It should print a JSON object to the terminal — that's your success signal
- This is the most educational part — take your time here

### Phase 2 — The Node/Python Bridge
**File: `ml/runner.js`**
- Connect Node.js to your working Python script via child_process
- Test it with a small standalone script before wiring it to Express

### Phase 3 — The Express Server
**Files: `server.js` and `routes/analyze.js`**
- Get the API endpoint running and test with curl:
  ```bash
  curl -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"ticker": "AAPL"}'
  ```
- At this point, comment out the callN8nAgent step and just return mlResult
  so you can verify the ML pipeline works end-to-end first

### Phase 4 — The n8n Workflow
- Build the workflow in n8n following the steps above
- Use n8n's built-in test panel to send a sample payload and check the output
- Once working, uncomment callN8nAgent in analyze.js and wire it up

### Phase 5 — n8nClient.js
**File: `agent/n8nClient.js`**
- Implement the axios POST to your webhook URL
- This is a short file — the complexity lives in n8n, not here

### Phase 6 — The Frontend
**File: `public/index.html`**
- Wire up the JavaScript to call your API and render the results
- The Chart.js chart is the most involved part here

---

## Key Concepts Encountered

| Concept | Where You'll Use It |
|---|---|
| Supervised learning | predict.py — training the model |
| Feature engineering | predict.py — MA, lag, volatility columns |
| Train/test split | predict.py — evaluating on unseen data |
| MAE and R² metrics | predict.py — measuring model performance |
| Child processes | runner.js — Node spawning Python |
| Async/await | routes/analyze.js, n8nClient.js |
| REST APIs + HTTP methods | routes/analyze.js |
| Webhook request/response | n8nClient.js + n8n Webhook node |
| n8n expression syntax | n8n workflow — {{ $json.field }} |
| Prompt engineering | n8n AI Agent node — writing the system/user prompt |
| DOM manipulation | public/index.html — updating the UI |
| fetch() API | public/index.html — calling your Express server |

---

