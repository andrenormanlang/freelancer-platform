// atoms/chatAtoms.ts
import { atom } from 'jotai';
import { Message, User } from '../types/types';

export const messagesAtom = atom<Message[]>([]);

// For keeping track of the currently active chat partner
export const activeChatPartnerAtom = atom<User | null>(null);
