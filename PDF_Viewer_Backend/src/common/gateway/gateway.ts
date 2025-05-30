import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({
  providers: [MyGateWay],
})
export class MyGateWay {}
