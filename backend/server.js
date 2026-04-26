require("dotenv").config();
const app = require("./src/app");
const PORT = process.env.PORT || 8000;

app.get('/', (req,res)=> {
    res.send(`server is running`)
});

app.listen(PORT, ()=>{
    console.log(`running on port ${PORT}`)
})

