import express from 'express';

const app = express();
const port = 3002;

app.get('/', (req, res) => {
  res.send('Merhaba Dünya!');
});

app.listen(port, () => {
  console.log(`Uygulama ${port} portunda çalışıyor`);
});
