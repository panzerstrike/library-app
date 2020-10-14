const { User } = require("../models/");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const joi = require("@hapi/joi");

const secretKey = process.env.SECRET_KEY;

exports.Register = async (req, res) => {
  try {
    const { fullName, email, password, gender, phone, address } = req.body;

    const schema = joi.object({
      fullName: joi.string().min(3).required(),
      email: joi.string().email().min(5).required(),
      password: joi.string().min(8).required(),
      gender: joi.string().min(4).required(),
      phone: joi.number().min(6).required(),
      address: joi.string().min(10).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).send({
        error: {
          message: error.details[0].message,
        },
      });
    }

    const checkEmail = await User.findOne({
      where: {
        email,
      },
    });

    if (checkEmail) {
      return res.status(400).send({
        error: {
          message: "Email already exist",
        },
      });
    }

    const salt = 10;
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      password: hashed,
      gender,
      phone,
      address,
    });

    const token = jwt.sign(
      {
        id: user.id,
      },
      secretKey
    );

    res.send({
      message: "Registration success!",
      data: {
        email: user.email,
        token,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: {
        message: "Internal Server Error",
      },
    });
  }
};

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const schema = joi.object({
      email: joi.string().email().min(5).required(),
      password: joi.string().min(8).required(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).send({
        error: {
          message: error.details[0].message,
        },
      });
    }

    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).send({
        error: {
          message: "Email or Password incorrect",
        },
      });
    }

    const validate = await bcrypt.compare(password, user.password);

    if (!validate) {
      return res.status(400).send({
        error: {
          message: "Email or Password incorrect",
        },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
      },
      secretKey
    );

    res.send({
      message: "Login success",
      data: {
        email: user.email,
        token,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: {
        message: "Internal Server Error",
      },
    });
  }
};
