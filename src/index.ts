import AgentApi from 'apminsight';
AgentApi.config();

import express from 'express';
import cors from 'cors';
import subjectsRouter from './routes/subjects.js';
import usersRouter from './routes/users.js';
import securityMiddleware from './middleware/security.js';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';
import classesRouter from './routes/classes.js';

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
//better-auth middleware
 app.all('/api/auth/*splat', toNodeHandler(auth));//any request matching this path will be handled by the better-auth middleware(authentication)
 

 //setting up the express json middleware
app.use(express.json());

app.use(securityMiddleware);

app.use('/api/subjects', subjectsRouter);
app.use('/api/users', usersRouter);
app.use('/api/classes', classesRouter);

app.get('/', (req, res) => {
    res.send('Hello welcome')

});


app.use('/api/v1', router)
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));