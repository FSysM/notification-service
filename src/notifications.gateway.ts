import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwksClient } from 'jwks-rsa';

export type NotificationEmitPayload = {
  type: string;
  message: string;
  entityType?: string;
  entityId?: string;
  createdAt: Date;
};

export type DataSyncPayload = {
  queryKey: string[];
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
  private readonly jwksClient: JwksClient;

  constructor(
    private readonly jwtService: JwtService,
    config: ConfigService,
  ) {
    this.jwksClient = new JwksClient({
      jwksUri: `${config.getOrThrow('KEYCLOAK_URL')}/realms/${config.getOrThrow('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }

  private async verifyKeycloakToken(token: string): Promise<{ sub: string }> {
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString()) as { kid?: string };
    const signingKey = await this.jwksClient.getSigningKey(header.kid);
    return this.jwtService.verify(token, {
      secret: signingKey.getPublicKey(),
      algorithms: ['RS256'],
    });
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) throw new Error('No token');
      const payload = await this.verifyKeycloakToken(token);
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

  emitToAll(data: DataSyncPayload) {
    this.server.emit('data-sync', data);
  }
}
