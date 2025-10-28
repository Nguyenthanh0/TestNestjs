import { ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtUser } from '../authen/auth.service';
import { ConfigService } from '@nestjs/config';

interface DataValue {
  name: string;
  email: string;
  sub: string; //_id
}

interface CustomSocket extends Socket {
  data: DataValue;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PostGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PostGateway.name);
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: CustomSocket) {
    try {
      // const token = client.handshake.headers.authorization?.split(' ')[1];
      // this.logger.debug(
      //   `Header handshake: ${JSON.stringify(client.handshake.headers)}`,
      // );

      // if (!token) throw new ForbiddenException('invalid token');
      const authToken = client.handshake.auth?.token as unknown;
      if (typeof authToken !== 'string')
        throw new ForbiddenException('Missing or invalid token');
      const rawAuth = authToken; // safely typed as string
      const token = rawAuth.split(' ')[1];
      const payload: JwtUser = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });
      client.data.email = payload.email;
      client.data.sub = payload.sub;
      this.logger.debug(
        `Client connected . User : ${payload.email}, ID: ${client.data.sub}`,
      );
    } catch (error) {
      this.logger.warn('connect failed');
      console.log('xảy ra lỗi : ', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected : ${client.data} `);
  }

  // test connect tới server
  @SubscribeMessage('test message')
  handldeTestMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: CustomSocket,
  ) {
    this.logger.debug(
      `Nhận test message từ user ${client.data.email}: ${data}`,
    );
    client.emit('Server Response', {
      message: 'Server đã nhận được test message của bạn!',
    });
  }

  // thông báo khi có user comment post
  async notifyWhenUserComment(postOwnerId: string, commentData: any) {
    for (const [_, socket] of this.server.sockets.sockets) {
      const typedSocket = socket as CustomSocket;
      if (typedSocket.data.sub === postOwnerId) {
        socket.emit('newComment', {
          message: 'Bài viết của bạn có bình luận mới!',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          comment: commentData,
        });
        this.logger.debug(`Gửi thông báo newComment tới userId=${postOwnerId}`);
      }
    }
  }

  // thông báo khi có user like post
  async notifyWhenUserLikePost(postOwnerId: string, likeData: any) {
    for (const [_, socket] of this.server.sockets.sockets) {
      const s = socket as CustomSocket;
      if (s.data.sub === postOwnerId) {
        socket.emit('newLike', {
          message: 'Bài viết có thêm thêm like',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          content: likeData,
        });
        this.logger.debug(`Thông báo newLike tới postOwner: ${s.data.email}`);
      }
    }
  }
}
