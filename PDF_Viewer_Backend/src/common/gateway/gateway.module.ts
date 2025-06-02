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

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class GateWayModule implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinPdfRoom')
  handleJoinRoom(@MessageBody() pdfId: string, @ConnectedSocket() client: Socket) {
    client.join(pdfId);
    console.log(`Client ${client.id} joined room: ${pdfId}`);
  }

  @SubscribeMessage('msgToServer')
  handleMessage(
    @MessageBody()
    data: {
      pdfId: string;
      message: string;
    },
    @ConnectedSocket() client: Socket,
  ): void {
    // console.log(`Message from ${client.id} to room ${data.pdfId}: ${data.message}`);
    client.to(data.pdfId).emit('msgToClient', {
      sender: client.id,
      message: data.message,
    });
  }
}
