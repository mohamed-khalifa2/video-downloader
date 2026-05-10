import dotenv from "dotenv";
dotenv.config() // before anything
import app from "./src/app.js";

const PORT = process.env.PORT || 8000;

app.listen(PORT, ()=>{
    console.log(`running on port ${PORT}`)
})

