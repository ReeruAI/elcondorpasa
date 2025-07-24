import bcrypt from "bcryptjs";

function hashPass(password: string) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function comparePass(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export { hashPass, comparePass };
