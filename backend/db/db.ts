const mongoose = require("mongoose");
const mongoURI = "mongodb://localhost:27017/marksheets"; // Change to your DB URI

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

interface ConnectionError extends Error {
    message: string;
}

mongoose.connection.on("connected", (): void => {
    console.log("✅ MongoDB connected");
});

mongoose.connection.on("error", (err: ConnectionError): void => {
    console.log("❌ MongoDB connection error:", err);
});
