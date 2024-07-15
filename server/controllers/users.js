const Users = require("../models/users");
const bcrypt = require("bcryptjs"); // https://github.com/dcodeIO/bcrypt.js#readme
const jwt = require("jsonwebtoken");
const validator = require("validator");
const jwt_secret = process.env.JWT_SECRET;

const registerUser = async (req, res, next) => {
  const { username, email, password, password2,currency } = req.body;
  if (!username || !email || !password || !password2) {
    return res.json({ ok: false, message: "All fields required" });
  }
  if (password !== password2) {
    return res.json({ ok: false, message: "Passwords must match" });
  }
  if (!validator.isEmail(email)) {
    return res.json({ ok: false, message: "Invalid email" });
  }
  try {
    const existingUser = await Users.findOne({ username: username });
    if (existingUser)
      return res.json({ ok: false, message: "This username already exists!" });
    const existingEmail = await Users.findOne({ email: email });
    if (existingEmail)
      return res.json({ ok: false, message: "This email already exists" });

    // Generate a salt
    const salt = bcrypt.genSaltSync(10);
    // Hash the password with the salt
    const hash = bcrypt.hashSync(password, salt);

    const newUser = {
      username: username,
      email: email,
      password: hash,
      currency: currency
    };
    await Users.create(newUser);
    // res.json({ ok: true, message: "Successfully registered" });
    next();
  } catch (error) {
    console.log(error);
    res.json({ ok: false, error: error });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ ok: false, message: "All fields are required" });
  } else {
    try {
      const user = await Users.findOne({ username: username });
      if (!user)
        return res.json({ ok: false, message: "Invalid user provided" });

      const match = bcrypt.compareSync(password, user.password);
      if (match) {
        const token = jwt.sign(
          {
            username: user.username,
            id: user._id,
            email: user.email,
            currency: user.currency
          },
          jwt_secret
        );
        res.json({
          ok: true,
          message: "Succsessfull!",
          token: token,
          user: user,
        });
      } else return res.json({ ok: false, message: "Invalid data provided" });
    } catch (error) {
      res.json({ ok: false, error });
    }
  }
};

const verifyToken = (req, res) => {
  const token = req.headers.authorization;
  jwt.verify(token, jwt_secret, (err, succ) => {
    err
      ? res.json({ ok: false, message: "Token is corrupted" })
      : res.json({ ok: true, succ });
  });
};

const deleteUser = async (req, res) => {
  try {
    const { user } = req.body;
    const uniqeUser = await Users.findone({ _id: user.id });

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
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

// const ObjectId = require("mongoose").Types.ObjectId;

const updateUser = async (req, res) => {
  try {
    const { username, email, password, password2, oldpassword,currency } = req.body;;
    const uniqeUser = await Users.findById({ _id: req._id });

    if (!username || !email) {
      return res.json({ ok: false, message: "Not all required fields filled" });
    }
    if (password !== password2) {
      return res.json({ ok: false, message: "Passwords must match" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ ok: false, message: "Invalid email" });
    }
    // Generate a salt
    const salt = bcrypt.genSaltSync(10);
    // Hash the password with the salt
    const hash = bcrypt.hashSync(password, salt);
    const updateUser = {
      username: username,
      email: email,
      password: password ? hash : oldpassword,
      currency: currency,
    };

    if (uniqeUser ) {
      const user = await Users.findOneAndUpdate(
        { _id: req._id },
        { $set: updateUser },
        { new: true, runValidators: true }
      );

      res.status(200).send({
        ok: true,
        message: `User '${username}' was updated`,
        user: user,
      });
    } else if (!isUserExist) {
      res.status(200).send({
        ok: true,
        message: `Username '${username}' is already taken `,
      });
    }
  } catch (error) {
    res.status(400).send({ ok: false, message: error.message });
    console.log(error.message);
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const uniqeUser = await Users.findById({ id });

    if (uniqeUser) {
      res.status(200).send({ ok: true, user: uniqeUser });
    } else {
      res.status(200).send({
        ok: true,
        data: `Username '${uniqeUser.username}' was not found `,
      });
    }
  } catch (error) {
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

module.exports = {
  registerUser,
  updateUser,
  getUser,
  deleteUser,
  loginUser,
  verifyToken,
};
