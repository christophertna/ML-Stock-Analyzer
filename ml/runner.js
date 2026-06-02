// ml/runner.js — Python Script Executor

// Node.js can't run Python directly, but it can spawn a Python process as a "child process"
// a separate program running alongside Node

// Import the 'child_process' built-in Node.js module
const { spawn } = require('child_process')
// 'child_process' is built into Node (no npm install needed)
// spawn() launches a new process (python process in this case)

// Import the 'path' built-in module
const path = require('path')


async function runPythonModel(ticker) {

    return new Promise((resolve, reject) => {  

        // Build the path to your Python script
        const scriptPath = path.join(__dirname, 'predict.py')


        // Spawn a Python process
        const process = spawn('python', [scriptPath, ticker])
        // The second argument is an array of command-line args passed to Python

        // In predict.py, sys.argv[1] --> ticker
        // spawn() is non-blocking — Node doesn't freeze while Python runs
        // Instead, it emits events when data arrives


        // Collect stdout data (Python's printed output)
        let output = ''
        process.stdout.on('data', (chunk) => { output += chunk })
        // stdout arrives in chunks (a "stream"), e.g. not all at once
        // Concatenate chunks into one string, then parse at the end

        // Collect stderr data (Python error messages)
        let errorOutput = ''
        process.stderr.on('data', (chunk) => { errorOutput += chunk })
        // Always capture stderr: tells you what went wrong if Python crashes              


        // Handle process completion
        process.on('close', (code) => {

            // Exit code 0 = success. Anything else = error.
            if (code !== 0) {
                reject(new Error(errorOutput))  // Fixed: removed space after reject
            } else {
                try {
                    resolve(JSON.parse(output)) // JSON.parse() converts a JSON string into a JavaScript object
                } catch (e) {
                    reject(new Error('Failed to parse Python output'))  // Fixed: changed errorMonitor to Error
                }
            }
        })


    })
}

module.exports = { runPythonModel }