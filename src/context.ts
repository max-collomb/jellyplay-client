import { Auth, WindowState } from "./types";

type Context = {
  auth: Auth;
  windowState: WindowState;
  uploadUrl: string;
  mpvPath: string;
};

export const ctx: Context = {
  auth: {
    username: '',
    password: ''
  },
  windowState: {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
  },
  uploadUrl: '',
  mpvPath: '',
};