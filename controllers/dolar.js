const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

app.get('/getDolarKuru', async (req, res) => {
  try {
    // exchangeratesapi.io adresinden döviz kurlarını çek
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    const dolarKuru = response.data.rates.TRY;

    res.json({ dolarKuru });
  } catch (error) {
    console.error('Döviz kuru çekme hatası:', error.message);
    res.status(500).send('Döviz kuru çekme hatası');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});