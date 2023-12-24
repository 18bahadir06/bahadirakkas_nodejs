import mongoose from "mongoose";

const conn=()=>{
    mongoose.connect(process.env.DB_URI, {
        dbName: "bahadirakkasdb",
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(()=> {
        console.log("Connect to the DB succesully")
    })
    .catch((err)=>{
        console.log('DB connection err:,'+err);
    });
};

export default conn;