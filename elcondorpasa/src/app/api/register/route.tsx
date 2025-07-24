import UserModel from "@/db/models/UserModel";
import { errorHandler } from "@/helpers/errorHandler";

export async function POST(req: Request) {
  try {
    const { name, username, email, password } = await req.json();
    const newUser = { name, username, email, password };
    await UserModel.createUser(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    return Response.json(userWithoutPassword);
  } catch (error) {
    return errorHandler(error);
  }
}
