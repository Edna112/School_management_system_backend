import express from 'express';
import cors from 'cors';
import subjectsRouter from './routes/subjects';

const app = express();
const port = 8000;
const router = express.Router();


//setting up the cors
const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
    throw new Error("FRONTEND_URL is required for CORS");
}

 app.use(cors({
   origin: frontendUrl,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     credentials: true,
 }))
 

 //setting up the express json middleware
app.use(express.json());

app.use('/api/v1/subjects', subjectsRouter);

app.get('/', (req, res) => {
    res.send('Hello welcome')

});


app.use('/api/v1', router)
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));