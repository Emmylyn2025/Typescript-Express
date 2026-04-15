import express, { Application } from "express";
import router from "./routes/router";
import cookieParser from "cookie-parser";
import { globalError, appError } from "./utils/appError";
import cors from "cors";

const app: Application = express();
app.use(express.json());
app.use(cookieParser());
app.set('query parser', 'extended');
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use('/typescript', router);

//Not found error handler
app.use((req, res, next) => {
  next(new appError(`The request ${req.originalUrl} with method ${req.method} is not found on the server`, 404));
});

//GlobalError handler 
app.use(globalError);
export default app;