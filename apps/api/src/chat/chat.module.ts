import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '@/users/users.module';
import { ChatController } from './chat.controller';
import { AuthModule } from '@/auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Room } from './entities/room.entity'; 
import { ChatMessage } from './entities/chat-message.entity';
import { RoomsModule } from './rooms.module';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, Room]), // Include Room entity here
    UsersModule,
    AuthModule,
    RoomsModule,
    CloudinaryModule, // Add CloudinaryModule here
    MulterModule.register(), // Register MulterModule for file uploads
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [ChatService, ChatGateway, JwtService, ConfigService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
