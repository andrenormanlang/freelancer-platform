import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Room } from './entities/room.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepository: Repository<ChatMessage>,

    @InjectRepository(User) // Inject the User repository
    private userRepository: Repository<User>,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async sendMessage(
    sender: User,
    receiver: User,
    message: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ): Promise<ChatMessage> {
    const chatMessage = this.chatRepository.create({
      sender,
      receiver,
      message,
      fileUrl,
      fileName,
      fileType,
    });
    const savedMessage = await this.chatRepository.save(chatMessage);
    console.log('Saved message with createdAt:', savedMessage.createdAt);
    return savedMessage;
  }

  async findMessageById(id: string): Promise<ChatMessage | null> {
    const message = await this.chatRepository.findOne({ where: { id } });
    return message || null;
  }

  async sendMessageWithId(
    sender: User,
    receiver: User,
    message: string,
    id: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ): Promise<ChatMessage> {
    const chatMessage = this.chatRepository.create({
      id, // Set the unique ID for the message
      sender,
      receiver,
      message,
      fileUrl,
      fileName,
      fileType,
    });
    const savedMessage = await this.chatRepository.save(chatMessage);
    console.log('Saved message with createdAt:', savedMessage.createdAt);
    return savedMessage;
  }

  async getMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    if (userId1 === userId2) {
      throw new BadRequestException(
        'User cannot retrieve messages with themselves'
      );
    }

    return this.chatRepository.find({
      where: [
        { sender: { id: userId1 }, receiver: { id: userId2 } },
        { sender: { id: userId2 }, receiver: { id: userId1 } },
      ],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async getActiveChats(userId: string): Promise<User[]> {
    const messages = await this.chatRepository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
      relations: ['sender', 'receiver'],
    });

    const chatPartnersMap = new Map<string, User>();

    messages.forEach((message) => {
      const otherUser =
        message.sender.id === userId ? message.receiver : message.sender;
      if (otherUser.role === 'employer') {
        chatPartnersMap.set(otherUser.id, otherUser);
      }
    });

    return Array.from(chatPartnersMap.values());
  }

  async sendMessageToRoom(
    room: Room, 
    message: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ): Promise<ChatMessage> {
    const chatMessage = this.chatRepository.create({
      message,
      room,
      fileUrl,
      fileName,
      fileType,
    });
    return this.chatRepository.save(chatMessage);
  }

  async findRoomBetweenUsers(user1: User, user2: User): Promise<Room | null> {
    const room = await this.roomRepository.findOne({
      where: [
        { employer: Equal(user1.id), freelancer: Equal(user2.id) },
        { employer: Equal(user2.id), freelancer: Equal(user1.id) },
      ],
    });
    return room || null;
  }

  // Mark messages as read
  async markMessagesAsRead(
    senderId: string,
    receiverId: string
  ): Promise<void> {
    await this.chatRepository.createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where("senderId = :senderId", { senderId })
      .andWhere("receiverId = :receiverId", { receiverId })
      .andWhere("isRead = false")
      .execute();
  }
  

  // Get unread message counts per sender
  async getUnreadCounts(userId: string): Promise<{ [key: string]: number }> {
    console.log(`Fetching unread counts for userId: ${userId}`);
  
    const messages = await this.chatRepository
      .createQueryBuilder('message')
      .select('message.senderId', 'senderId')
      .addSelect('COUNT(message.id)', 'count')
      .where('message.receiverId = :userId', { userId })
      .andWhere('message.isRead = false')
      .groupBy('message.senderId')
      .getRawMany();
  
    console.log('Unread messages raw data:', messages);
  
    const counts: { [key: string]: number } = {};
    messages.forEach((m) => {
      const senderId = m.senderId || m['message_senderId'];
      const count = parseInt(m.count, 10);
  
      if (senderId) {
        counts[senderId] = count;
      }
    });
    console.log(`Unread counts for user ${userId}:`, counts);
    return counts;
  }
  
}
