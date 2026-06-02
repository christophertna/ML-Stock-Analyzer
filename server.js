// server.js 

// Express is a "web framework" for Node.js
// lets you define "routes", URLs the app responds to

// When a browser visits a URL, Express matches it to a route
// and runs the corresponding/correct function associated to that route


// Load environment variables
require('dotenv').config()

// Import packages
const express = require('express')
const cors    = require('cors')
const path    = require('path');

// Express app instance
const app = express()

// Set the port from your .env file, with a fallback
const PORT = process.env.PORT || 3000
// || 3000 --> "use .env value OR default to 3000"


// MIDDLEWARE SETUP:
// Middleware is code that runs on EVERY request before it reaches your route handlers
// (a pipline that every request passes through)

// Enable CORS middleware
app.use(cors())
// CORS (Cross-Origin Resource Sharing) allows frontend (running on one port) to talk to backend running on another port) 
// Without CORS, browsers block the request

// Enable JSON body parsing middleware
app.use(express.json())
// lets Express read JSON data sent in POST request bodie

// Serve static files (your HTML/CSS/JS frontend) from /public
app.use(express.static(path.join(__dirname, 'public')))
// "Static files" are files sent as-is to the browser without any server-side processing (HTML, CSS, images, etc)


// ROUTES:

// Routes define what happens when a specific URL is visited
// They are organized in separate files to keep server.js clean

// Mount your analyze route
const analyzeRouter = require('./routes/analyze')

// All routes defined in analyze.js will start with /api
app.use('/api', analyzeRouter) 
// So a route defined as: /analyze --> /api/analyze


// START THE SERVER:

//  Start listening on the port and log a message
app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`) })
// app.listen() starts the HTTP server

