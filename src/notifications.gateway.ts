import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

export type NotificationEmitPayload = {
  type: string;
  message: string;
  entityType?: string;
  entityId?: string;
  createdAt: Date;
};

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: process.env.FRONTEND_URL ?? '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) throw new Error('No token');
      const payload = this.jwtService.verify(token);
      const userId: string = payload.sub;
      client.data.userId = userId;
      await client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.data.userId ?? 'unknown'}`,
    );
  }

  async emitToUser(userId: string, data: NotificationEmitPayload) {
    const room = `user:${userId}`;
    const sockets = await this.server.in(room).fetchSockets();
    this.logger.log(`emitToUser → room=${room}, sockets in room=${sockets.length}`);
    this.server.to(room).emit('notification', data);
  }
}
