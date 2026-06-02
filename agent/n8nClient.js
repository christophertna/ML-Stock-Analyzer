// agent/n8nClient.js (n8n Webhook Caller)

// Instead of calling Groq directly from code,
// we delegate ALL agent logic to n8n. This file's only job is to:
//   1. Send the ML results to your n8n webhook URL
//   2. Wait for n8n to finish its agentic workflow
//   3. Return the AI summary back to the route handler

const axios = require('axios')
// axios: HTTP client for Node.js

// callN8nAgent(ticker, mlResult)
// Sends a POST request to your n8n webhook with the ticker
// and ML model results. Waits for n8n to respond with the
// Groq agent summary, then returns it as a string.

module.exports = { callN8nAgent }

async function callN8nAgent(ticker, mlResult) {

      try {

            // grab n8n webhook from .env
            const webhookUrl = process.env.N8N_WEBHOOK_URL

            // validate
            if (!webhookUrl) throw new Error('N8N_WEBHOOK_URL not in .env')

            // send POST req to the n8n webhook
            const response = await axios.post(webhookUrl, {
                  ticker: ticker,
                  ml_output: mlResult // in n8n, the object POSTed becomes req.body in the Webhook and
                                      // is accessible with this syntax: {{ $json.ticker }} & {{ $json.ml }}
            }, { 
                  timeout: 30000 // 30s pause in case server hangs/n8n stalls
            })

            // debugging line to print n8n agent response
            // console.log('status:', response.status)
            // console.log('headers:', JSON.stringify(response.headers))
            // console.log('data:', JSON.stringify(response.data))

            // Strip the outer wrapper and extract just the summary value safely
            const raw = response.data
            if (typeof raw === 'object' && raw.summary) return raw.summary

            // If it came back as a string, extract summary without JSON.parse
            const match = raw.match(/"summary"\s*:\s*"([\s\S]*?)"\s*\}/)
            if (match) return match[1].replace(/\\n/g, '\n')

            return 'No summary returned from agent.'

      } catch (err) {

            // err.code shows machine-readable error type
            if (err.code === 'ECONNREFUSED') { // ECONNREFUSED --> nothing is listening at that URL (n8n isn't running)
                  throw new Error('Couldnt reach n8n. Check if the n8n workflow is running.')
            }

            if (err.code === 'ECONNABORTED') { // ECONNABORTED --> request took too long and was cancelled instead
                  throw new Error('n8n Agent timed out after 30s.')
            }

            // any other error type
            throw new Error('n8n agent error: ' + err.message)

      }
}

