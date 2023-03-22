// Set server
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000
const line = require('./line')

// Router for receive and reply message 
app.post('/webhook', line.middleware, async (req, res) => {
  try {
    // Handles each incoming event and waits for all events to be processed
    const result = await Promise.all(req.body.events.map(line.handleEvent))
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500)
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});