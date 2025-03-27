import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Request,
  UseGuards,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '@/auth/jwt.auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post(':receiverId/send')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Request() req,
    @Param('receiverId') receiverId: string,
    @Body('text') text: string,
    @Body('messageId') messageId: string,
    @Body('fileUrl') fileUrl?: string,
    @Body('fileName') fileName?: string,
    @Body('fileType') fileType?: string
  ) {
    if (!text.trim() && !fileUrl) {
      throw new BadRequestException('Message cannot be empty and no file attached');
    }

    console.log('Request user:', req.user); // Log the user object to debug

    try {
      const sender = await this.userService.getAuthenticatedUser(req.user.id);
      const receiver = await this.userService.findById(receiverId);

      if (!sender) {
        throw new NotFoundException(`Sender with ID ${req.user.id} not found`);
      }

      if (!receiver) {
        throw new NotFoundException(`Receiver with ID ${receiverId} not found`);
      }

      console.log(
        `Sending message from ${sender.id} to ${receiver.id}: ${text}`
      );
      return await this.chatService.sendMessageWithId(
        sender,
        receiver,
        text,
        messageId,
        fileUrl,
        fileName,
        fileType
      );
    } catch (error) {
      console.error('Error sending message:', error.message);
      throw error;
    }
  }

  @Post(':receiverId/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        text: {
          type: 'string',
        },
        messageId: {
          type: 'string',
        },
      },
    },
  })
  async uploadFile(
    @Request() req,
    @Param('receiverId') receiverId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('text') text: string = '',
    @Body('messageId') messageId: string
  ) {
    try {
      // Upload file to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      console.log('File uploaded to Cloudinary:', uploadResult);

      const sender = await this.userService.getAuthenticatedUser(req.user.id);
      const receiver = await this.userService.findById(receiverId);

      if (!sender) {
        throw new NotFoundException(`Sender with ID ${req.user.id} not found`);
      }

      if (!receiver) {
        throw new NotFoundException(`Receiver with ID ${receiverId} not found`);
      }

      // Create message with file details
      return await this.chatService.sendMessageWithId(
        sender,
        receiver,
        text || `Sent a file: ${file.originalname}`, // Include full filename with extension in message
        messageId,
        uploadResult.secure_url,
        file.originalname, // Use full original filename with extension
        file.mimetype
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId1/:userId2/messages')
  async getMessages(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string
  ) {
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot retrieve messages with oneself');
    }

    try {
      // Validate that users exist
      const user1 = await this.userService.findById(userId1);
      const user2 = await this.userService.findById(userId2);

      if (!user1) {
        throw new NotFoundException(`User with ID ${userId1} not found`);
      }

      if (!user2) {
        throw new NotFoundException(`User with ID ${userId2} not found`);
      }

      // Log retrieval of messages
      console.log(
        `Retrieving messages between user ${userId1} and user ${userId2}`
      );

      return await this.chatService.getMessages(userId1, userId2);
    } catch (error) {
      console.error('Error retrieving messages:', error.message);
      throw error;
    }
  }

  // Endpoint to get unread counts
  @UseGuards(JwtAuthGuard)
  @Get('unread-counts')
  async getUnreadCounts(@Request() req) {
    const userId = req.user.sub;
    console.log(`API called by userId: ${userId}`);
    return await this.chatService.getUnreadCounts(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('active-chats')
  async getActiveChats(@Request() req) {
    const userId = req.user.sub;
    console.log(`API called by userId active chat: ${userId}`);
    return await this.chatService.getActiveChats(userId);
  }
}
