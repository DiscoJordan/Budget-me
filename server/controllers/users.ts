import Users from "../models/users";
import Accounts from "../models/accounts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../src/types";

const DEFAULT_EXPENSE_ACCOUNTS = [
  { name: "Clothes",       icon: { icon_value: "hanger",              color: "#DE36B7" } },
  { name: "Food",          icon: { icon_value: "food",                color: "#FF8824" } },
  { name: "Taxes",         icon: { icon_value: "bank-outline",        color: "#00438F" } },
  { name: "Vehicle",       icon: { icon_value: "car",                 color: "#717171" } },
  { name: "Health",        icon: { icon_value: "heart",               color: "#FF7070" } },
  { name: "Groceries",     icon: { icon_value: "cart",                color: "#58D41E" } },
  { name: "Beauty",        icon: { icon_value: "flower-outline",      color: "#B46DFF" } },
  { name: "Entertainment", icon: { icon_value: "movie-open-play",     color: "#FFBD24" } },
  { name: "Travelling",    icon: { icon_value: "airplane",            color: "#0077FF" } },
  { name: "Transport",     icon: { icon_value: "bus",                 color: "#2CBDAB" } },
];

const jwt_secret = "budgetMe";

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { username, email, password, password2, currency } = req.body as {
    username: string;
    email: string;
    password: string;
    password2: string;
    currency: string;
  };
  if (!username || !email || !password || !password2) {
    res.json({ ok: false, message: "All fields required" });
    return;
  }
  if (password !== password2) {
    res.json({ ok: false, message: "Passwords must match" });
    return;
  }
  if (!validator.isEmail(email)) {
    res.json({ ok: false, message: "Invalid email" });
    return;
  }
  try {
    const existingUser = await Users.findOne({ username });
    if (existingUser) {
      res.json({ ok: false, message: "This username already exists!" });
      return;
    }
    const existingEmail = await Users.findOne({ email });
    if (existingEmail) {
      res.json({ ok: false, message: "This email already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = { username, email, password: hash, currency };
    const createdUser = await Users.create(newUser);
    await Promise.all(
      DEFAULT_EXPENSE_ACCOUNTS.map((acc) =>
        Accounts.create({
          ownerId: createdUser._id,
          type: "expense",
          name: acc.name,
          icon: acc.icon,
          subcategories: [],
          balance: 0,
          initialBalance: 0,
          currency: currency ?? "USD",
        })
      )
    );
    next();
  } catch (error) {
    console.log(error);
    res.json({ ok: false, error });
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as {
    username: string;
    password: string;
  };
  if (!username || !password) {
    res.json({ ok: false, message: "All fields are required" });
    return;
  }
  try {
    const user = await Users.findOne({ username });
    if (!user) {
      res.json({ ok: false, message: "Invalid user provided" });
      return;
    }

    const match = bcrypt.compareSync(password, user.password);
    console.log(match, "match");
    if (match) {
      console.log(match, "matchIn");
      const token = jwt.sign(
        {
          username: user.username,
          id: user._id,
          email: user.email,
          currency: user.currency,
        },
        jwt_secret
      );
      console.log(token, "token");
      res.json({ ok: true, message: "Succsessfull!", token, user });
    } else {
      res.json({ ok: false, message: "Invalid data provided" });
    }
  } catch (error) {
    res.json({ ok: false, error });
  }
};

const verifyToken = (req: Request, res: Response): void => {
  const token = req.headers.authorization as string;
  jwt.verify(token, jwt_secret, (err, succ) => {
    err
      ? res.json({ ok: false, message: "Token is corrupted" })
      : res.json({ ok: true, succ });
  });
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req.body as { user: { id: string; username: string } };
    const uniqeUser = await Users.findOne({ _id: user.id });

    if (uniqeUser) {
      await uniqeUser.deleteOne();
      res
        .status(200)
        .send({ ok: true, data: `Username '${user.username}' was deleted ` });
    } else {
      res
        .status(200)
        .send({ ok: true, data: `Username '${user.username}' was not found` });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password, password2, oldpassword, currency } =
      req.body as {
        username: string;
        email: string;
        password: string;
        password2: string;
        oldpassword: string;
        currency: string;
      };
    const uniqeUser = await Users.findById({ _id: req._id });

    if (!username || !email) {
      res.json({ ok: false, message: "Not all required fields filled" });
      return;
    }
    if (password !== password2) {
      res.json({ ok: false, message: "Passwords must match" });
      return;
    }
    if (!validator.isEmail(email)) {
      res.json({ ok: false, message: "Invalid email" });
      return;
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const updateData = {
      username,
      email,
      password: password ? hash : oldpassword,
      currency,
    };

    if (uniqeUser) {
      const user = await Users.findOneAndUpdate(
        { _id: req._id },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).send({
        ok: true,
        message: `User '${username}' was updated`,
        user,
      });
    } else {
      res.status(200).send({
        ok: true,
        message: `Username '${username}' is already taken `,
      });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, message: err.message });
    console.log(err.message);
  }
};

const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const uniqeUser = await Users.findById(id);

    if (uniqeUser) {
      res.status(200).send({ ok: true, user: uniqeUser });
    } else {
      res.status(200).send({
        ok: true,
        data: `Username was not found`,
      });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const updateCurrency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currency } = req.body as { currency: string };
    if (!currency) {
      res.json({ ok: false, message: "Currency is required" });
      return;
    }
    const user = await Users.findByIdAndUpdate(
      req._id,
      { $set: { currency } },
      { new: true }
    );
    if (!user) {
      res.json({ ok: false, message: "User not found" });
      return;
    }
    const token = jwt.sign(
      { username: user.username, id: user._id, email: user.email, currency: user.currency },
      jwt_secret
    );
    res.json({ ok: true, token, user });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export {
  registerUser,
  updateUser,
  updateCurrency,
  getUser,
  deleteUser,
  loginUser,
  verifyToken,
};
