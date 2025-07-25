import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET as string;

const signToken = (obj: { id: string }) => {
  return jwt.sign(obj, JWT_SECRET);
};

const verifyToken = async <T>(token: string) => {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify<T>(token, secret);
  return payload;
};

export { signToken, verifyToken };
