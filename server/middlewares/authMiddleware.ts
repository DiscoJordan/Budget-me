import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../src/types";

interface JwtPayload {
  id: string;
  username: string;
}

const verify_token = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization as string | undefined;
  if (!token) {
    res.status(401).send("Not authorized!! - No token!!");
    return;
  }
  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      res.status(403).send("Not authorized!! - Token not validated!!");
    } else {
      const user = decoded as JwtPayload;
      req._id = user.id;
      req.username = user.username;
      req.token = token;
      next();
    }
  });
};

export { verify_token };
