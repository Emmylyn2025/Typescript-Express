import dotenv from "dotenv";
dotenv.config();
import app from "./app";

const PORT = Number(process.env.PORT) || 3000;

console.log(process.env.PORT);

app.listen(PORT ,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});