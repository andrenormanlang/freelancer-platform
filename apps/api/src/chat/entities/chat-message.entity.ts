// src/chat/entities/chat-message.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Room } from './room.entity';

@Entity()
export class ChatMessage {
  @ApiProperty({
    example: 'uuid-5678',
    description: 'The unique identifier for the chat message',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'The content of the chat message',
  })
  @Column({ type: 'text' })
  message!: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image.jpg',
    description: 'The URL of the attached file',
    required: false,
  })
  @Column({ nullable: true })
  fileUrl?: string;

  @ApiProperty({
    example: 'image.jpg',
    description: 'The original name of the attached file',
    required: false,
  })
  @Column({ nullable: true })
  fileName?: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'The MIME type of the attached file',
    required: false,
  })
  @Column({ nullable: true })
  fileType?: string;

  @ApiProperty({
    example: 'uuid-1234',
    description: 'The ID of the user who sent the message',
  })
  @ManyToOne(() => User, (user) => user.sentMessages, { eager: true })
  sender!: User;

  @ApiProperty({
    example: 'uuid-5678',
    description: 'The ID of the user who received the message',
  })
  @ManyToOne(() => User, (user) => user.receivedMessages, { eager: true })
  receiver!: User;

  @ManyToOne(() => Room, (room) => room.messages)
  room!: Room;

  @ApiProperty({
    example: '2024-10-28T12:34:56Z',
    description: 'The time when the message was created',
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({
    example: false,
    description: 'Indicates whether the message has been read by the receiver',
  })
  @Column({ default: false })
  isRead!: boolean;
}
