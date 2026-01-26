import express from 'express';


const app = express();
const port = 8000;
const router = express.Router();


app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello welcome')

});


app.use('/api/v1', router)
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));