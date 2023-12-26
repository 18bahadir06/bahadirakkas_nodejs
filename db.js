import mongoose from "mongoose";

const conn = () => {
    mongoose.connect(process.env.DB_URI, {
        dbName: "bahadirakkasdb",
<<<<<<< HEAD
        useNewUrlParser: true,
=======
>>>>>>> e1786c52ab41c1f25187d31caee7513c53b1a779
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connect to the DB successfully");
    })
    .catch((err) => {
        console.log('DB connection error:', err);
    });
};

export default conn;
