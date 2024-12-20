// src/chat/chat.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { RoomsService } from './rooms.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  // Keep track of which freelancers are online
  private onlineFreelancers: Set<string> = new Set();

  constructor(
    private readonly chatService: ChatService,
    private readonly roomsService: RoomsService,
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn('No token provided during connection handshake');
      client.disconnect();
      return;
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, { secret });
      client.data.userId = payload.sub;
      client.data.userRole = payload.role; // Store role in client data

      // Disconnect any existing connection for the same user
      const existingSockets = await this.server.fetchSockets();
      existingSockets.forEach((socket) => {
        if (socket.data.userId === payload.sub && socket.id !== client.id) {
          socket.disconnect();
        }
      });

      // User joins their own room
      client.join(client.data.userId);

      if (client.data.userRole === 'employer') {
        // Employers join a shared 'employers' room
        client.join('employers');
        this.logger.log(
          `Employer ${client.data.userId} joined 'employers' room.`
        );

        // Immediately send the list of currently online freelancers to this employer
        this.server.to(client.id).emit('onlineUsers', {
          userIds: Array.from(this.onlineFreelancers),
        });
      }

      if (client.data.userRole === 'freelancer') {
        // Add this freelancer to the online set
        this.onlineFreelancers.add(client.data.userId);

        // Notify all employers that this freelancer is online
        this.server.to('employers').emit('userOnline', { userId: payload.sub });
        this.logger.log(
          `Freelancer ${payload.sub} connected and is now online.`
        );
      }

      this.logger.log(
        `User ${payload.sub} connected with role ${payload.role}`
      );
    } catch (err) {
      this.logger.error('Token verification failed:', err.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const userRole = client.data.userRole;

    if (userRole === 'freelancer') {
      // Remove the freelancer from the online set
      this.onlineFreelancers.delete(userId);

      // Notify employers that this freelancer is now offline
      this.server.to('employers').emit('userOffline', { userId });
      this.logger.log(`Freelancer ${userId} disconnected and is now offline.`);
    }

    this.logger.log(`User ${userId} disconnected.`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    message: { id: string; senderId: string; receiverId: string; text: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const sender = await this.chatService.getUserById(message.senderId);
      const receiver = await this.chatService.getUserById(message.receiverId);

      if (
        (sender.role === 'freelancer' && receiver.role === 'employer') ||
        (sender.role === 'employer' && receiver.role === 'freelancer')
      ) {
        let room = await this.chatService.findRoomBetweenUsers(
          sender,
          receiver
        );

        if (!room) {
          room = await this.roomsService.createRoom(
            sender.id,
            receiver.id,
            `${sender.username}-${receiver.username}`
          );
        }

        const savedMessage = await this.chatService.sendMessageWithId(
          sender,
          receiver,
          message.text,
          message.id
        );

        this.server
          .to([message.senderId, message.receiverId])
          .emit('receiveMessage', {
            id: savedMessage.id,
            senderId: savedMessage.sender.id,
            receiverId: savedMessage.receiver.id,
            text: savedMessage.message,
            timestamp: savedMessage.createdAt,
            isRead: savedMessage.isRead,
          });

        this.server.to(message.senderId).emit('messageDelivered', {
          id: savedMessage.id,
          timestamp: savedMessage.createdAt,
        });
      }
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      // Join the client to the specified room
      client.join(data.roomId);
      this.logger.log(`User ${client.data.userId} joined room ${data.roomId}`);
    } catch (error) {
      this.logger.error('Error joining room:', error.message);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { senderId: string; receiverId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { senderId, receiverId } = data;
    this.logger.log(
      `markAsRead event received - senderId: ${senderId}, receiverId: ${receiverId}`
    );

    try {
      await this.chatService.markMessagesAsRead(senderId, receiverId);
      this.server.to(senderId).emit('messagesRead', { senderId, receiverId });
      this.logger.log(
        `Messages from ${senderId} to ${receiverId} marked as read`
      );
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
    }
  }
}
