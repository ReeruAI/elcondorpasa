export type NewUserType = {
  username: string;
  name: string;
  email: string;
  password: string;
  googleId?: string;
  profilePicture?: string;
  isGoogleUser?: boolean;
};

export type User = {
  emailUsername: string;
  password: string;
};
