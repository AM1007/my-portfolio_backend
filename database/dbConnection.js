import mongoose from "mongoose";

const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "MY_PORTFOLIO_DB",
    })
    .then(() => {
      console.log("Connected to database.");
    })
    .catch((error) => {
      console.log(`Some Error occured while connecting to database: ${error}`);
    });
};

export default dbConnection;
