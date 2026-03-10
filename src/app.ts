import express from "express";
import router from "./routes/router";
import cookieParser from "cookie-parser";
import { globalError, appError } from "./utils/appError";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.set('query parser', 'extended');
app.use('/typescript', router);

//Not found error handler
app.use((req, res, next) => {
  next(new appError(`The request ${req.originalUrl} with method ${req.method} is not found on the server`, 404));
});

//GlobalError handler 
app.use(globalError);
export default app;