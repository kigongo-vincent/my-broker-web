import { Get, Post } from "../../api";
import { PostI } from "../components/pages/tabs/Post";
import { UserI, useUserStore } from "../store/auth";

export interface ChatRoomI {
  ID?: number;
  UserID?: number;
  RecipientID?: number;
  users?: UserI[];
  User?: UserI;
  Recipient?: UserI;
  lastMessage?: ChatMessageI;
  Messages?: Partial<ChatMessageI>[];
  LastMessageAt?: string;
}

export interface ChatMessageI {
  ID?: number;
  RoomID?: number;
  SenderID?: number;
  senderId?: number;
  Text?: string;
  text?: string;
  Attachment?: string;
  post?: PostI;
  postId?: number;
  Sender?: UserI;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface ChatRoomMessagesResponse {
  room: ChatRoomI;
  messages: ChatMessageI[];
}

export const getChatRooms = async () => {
  return Get<ChatRoomI[]>("chats/rooms");
};

export const createChatRoom = async (recipientId: number) => {
  return Post<{ recipientId: number }, ChatRoomI>("chats/rooms", {
    recipientId,
  });
};

export const getChatRoomMessages = async (ParticipantID: number) => {
  const { user } = useUserStore();
  const UserID = (user as UserI)?.ID;
  return Post<{ users: number[] }, ChatRoomI>(`chats/room`, {
    users: [UserID || 0, ParticipantID],
  });
};

export const sendChatMessage = async (payload: {
  roomId?: number;
  recipientId?: number;
  text: string;
  attachment?: string;
}) => {
  return Post<typeof payload, ChatMessageI>("chats/messages", payload);
};

export const Participants = (UserID: number, users: UserI[]) => {
  return users?.filter((u) => u?.ID != UserID);
};
