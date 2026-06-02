// routes/analyze.js — API Route Handlers

// Route handler: function that runs when a specific HTTP method + URL combination is matched

// The two most common HTTP methods are:
// GET: retrieve data (NO BODY)
// POST: send data to the server (has A BODY)


// Express and Router instance
const express = require('express')
const router = express.Router()
// express.Router() creates a "mini app" that handles a subset of routes (for modularity)

// Import helper modules
const { runPythonModel } = require('../ml/runner')
const { callN8nAgent } = require('../agent/N8nClient')

// Note: we now import callN8nAgent instead of getGroqSummary.
// The route handler below doesn't need to change much — we just
// swap one function call for another. This is the benefit of
// keeping each file focused on one job ("separation of concerns").

// -----------------------------------------------
// POST /api/analyze
// -----------------------------------------------
// This is the main endpoint. The frontend POSTs a ticker symbol,
// and this handler coordinates the two async steps:
//   1. Run the Python ML model
//   2. Send results to n8n, get the Groq agent summary back

// Define the POST /analyze route
router.post('/analyze', async (req,res) => { // Without 'async', nested callbacks needed

    // First, extract ticker symbol from the request body
    const { ticker } = req.body // frontend will send something like: { "ticker": "AAPL" }

    // initial validation if a ticker is actually present in the body
    if(!ticker) return res.status(400).json({ error: 'No ticker symbol in body'}) // 200 = OK, 400 = Bad Request and 500 = Internal Server Error


    // main try-catch block for the analysis
    try {

        // 1. run the python model
        const mlResult = await runPythonModel(ticker.toUpperCase())
        // 'await' forces to system/execution to wait until the call is finished before moving onto the next line (but server is not blocked though)
        // so other requests can still be handled while this is waiting to finish

        // toUppercase() just in case to avoid spelling error/crashes

        // check if Python script returned an error
        if (mlResult.error) return res.status(400).json({ error: mlResult.error})
        // predict.py prints { "error": "..." } for bad/invalid tickers, so catch that before passing garbage data to n8n (potential API/tokens waste)


        // 2. call n8n agent workflow and pass ticker and mlResult as parameters
        const summary = await callN8nAgent(ticker.toUpperCase(), mlResult)
        // pass the full mlResult (the entire JSON string) so the agent has all the data from the ML process

        // n8n's AI Agent node will receive this as {{ $json.ml }} and can
        // reference any field inside it for the prompt

        // 3. send AI agent's response back to frontend as JSON
        res.json({ ml: mlResult, summary: summary })
        // res.json() serializes a JS object to JSON and sends it with Content-Type: application/json automatically
        // frontend destructures this as: const { ml, summary } = data

    } catch (err) { res.status(500).json({ error: err.message }) }

})

// Export the router so server.js can use it
module.exports = router