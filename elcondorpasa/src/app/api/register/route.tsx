import UserModel from "@/db/models/UserModel";
import { errorHandler } from "@/helpers/errorHandler";
import { NewUserType } from "@/types";

export async function POST(req: Request) {
  try {
    const {
      name,
      username,
      email,
      password: userPassword,
    }: NewUserType = await req.json();
    const newUser: NewUserType = {
      name,
      username,
      email,
      password: userPassword,
      phone: "",
      telegram: false,
      reeruToken: 2,
    };
    await UserModel.createUser(newUser);

    // Exclude sensitive fields from the response
    const {
      password: _password,
      phone: _phone,
      telegram: _telegram,
      reeruToken: _reeruToken,
      _id: _id,
      ...userWithoutSensitiveData
    } = newUser;

    return Response.json(userWithoutSensitiveData);
  } catch (error) {
    return errorHandler(error);
  }
}
