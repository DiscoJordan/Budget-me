import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import usersRouter from "./routes/users";
import accountsRouter from "./routes/accounts";
import transactionsRouter from "./routes/transactions";
import currenciesRouter from "./routes/currencies";

dotenv.config();

const app = express();
app.use(cors());
const port = process.env.PORT || 5050;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.set("debug", true);

async function connecting(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to the BudgetMe DB");
  } catch (error) {
    console.log(error);
  }
}

connecting();

app.use("/users", usersRouter);
app.use("/accounts", accountsRouter);
app.use("/transactions", transactionsRouter);
app.use("/currencies", currenciesRouter);

app.listen(port, () => console.log(`server listening on port ${port}`));
