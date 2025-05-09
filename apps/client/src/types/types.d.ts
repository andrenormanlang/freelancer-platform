export type User = {
  id: string;
  username: string;
  password: string;
  email: string;
  role: string;
  profile: UserProfile;
  skills: Skill[];
  avatarUrl?: string;
  skillImageUrls?: string[];
  isOnline?: boolean;
};

export type UserAuth = {
  emai: string;
  sub: string;
  iat: number;
  exp: number;
  sub: string;
};

export type Skill = {
  id?: string;
  title: string;
  description: string;
  price: number;
  isAvailable: boolean;
  // category: string;
};

export type RegisterFormData = {
  username: string;
  email: string;
  password: string;
  avatarFile?: FileList;
};

export type SkillData = {
  id?: string;
  title: string;
  description: string;
  price: number;
  isAvailable: boolean;
};
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status?: "sending" | "sent" | "read" | "error";
  isRead?: boolean;
  readAt?: Date;
}


export type Room = {
  id: string;
  roomName: string;
  employer: User;
  employerName?: string;
  employerAvatarUrl?: string | null;
  unreadCount: number;
};

// export type Message = {
//   senderId: string;
//   receiverId: string;
//   text: string;
// };
