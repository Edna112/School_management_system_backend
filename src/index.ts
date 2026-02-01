import express from 'express';
import cors from 'cors';
import subjectsRouter from './routes/subjects';

const app = express();
const port = 8000;
const router = express.Router();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}))


app.use(express.json());

app.use('/api/v1/subjects', subjectsRouter);

app.get('/', (req, res) => {
    res.send('Hello welcome')

});


app.use('/api/v1', router)
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));