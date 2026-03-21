import Users from "../models/users";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../src/types";

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
    await Users.create(newUser);
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

export {
  registerUser,
  updateUser,
  getUser,
  deleteUser,
  loginUser,
  verifyToken,
};
