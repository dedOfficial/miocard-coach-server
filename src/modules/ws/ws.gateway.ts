import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { MessageDocument } from 'modules/operator/models/message.model';
import { Server, Socket } from 'socket.io';
import { repliedMessage } from 'utils/common';

import { ChatService } from '../chat/chat.service';
import { StatsService } from '../stats/stats.service';
import { WsPayload } from './interfaces/ws-payload.interface';

const activeChats = {};

// TODO remove unused SubscribeMessages
@WebSocketGateway({
  path: '/ws',
  cors: true,
})
export class WsGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly statsService: StatsService,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message:operator')
  async operatorMessage(client: Socket, payload: WsPayload): Promise<void> {
    const [body, repliedMessageId, repliedMessageBody] = payload.message.split(
      '#',
    );

    const { _id } = await this.chatService.createMessage({
      body,
      chatId: payload.room,
      fromOperator: true,
      fromDoctor: false,
      ...repliedMessage(repliedMessageId, repliedMessageBody),
    });

    this.server
      .to(payload.room)
      .emit(
        'message:operator',
        `${body}#${_id}#${repliedMessageId}#${repliedMessageBody}`,
      );
  }

  @SubscribeMessage('message:doctor')
  async doctorMessage(client: Socket, payload: WsPayload): Promise<void> {
    const { _id } = await this.chatService.createMessage({
      body: payload.message,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: true,
    });

    this.server
      .to(payload.room)
      .emit('message:doctor', `${payload.message}#${_id}`);
  }

  @SubscribeMessage('message:user')
  async userMessage(client: Socket, payload: WsPayload): Promise<void> {
    const [body, repliedMessageId, repliedMessageBody] = payload.message.split(
      '#',
    );

    const { userError, _id } = await this.chatService.createMessage({
      body,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: false,
      ...repliedMessage(repliedMessageId, repliedMessageBody),
    });

    this.server
      .to(payload.room)
      .emit(
        'message:user',
        `${body}#${userError}#${_id}#${repliedMessageId}#${repliedMessageBody}`,
      );
  }

  @SubscribeMessage('message:user:error')
  async userMessageError(client: Socket, payload: WsPayload): Promise<void> {
    const { userError, _id } = await this.chatService.createMessage({
      body: payload.message,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: false,
      userError: true,
    });

    this.server
      .to(payload.room)
      .emit('message:user', `${payload.message}#${userError}#${_id}`);
  }

  @SubscribeMessage('widget:mood:operator')
  async moodOperator(client: Socket, payload: WsPayload): Promise<void> {
    const { _id } = await this.chatService.createMessage({
      body: 'Sent mood widget to the client.',
      chatId: payload.room,
      fromOperator: true,
      fromDoctor: false,
    });

    this.server
      .to(payload.room)
      .emit('widget:mood:operator', `${payload.message}#${_id}`);
  }

  @SubscribeMessage('widget:mood:user')
  async moodUser(client: Socket, payload: WsPayload): Promise<void> {
    const body = `Mood widget response: ${payload.message}`;

    const { _id } = await this.chatService.createMessage({
      body,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: false,
    });

    this.server.to(payload.room).emit('widget:mood:user', `${body}#${_id}`);
  }

  @SubscribeMessage('widget:walkedDistance:operator')
  async walkedDistanceOperator(
    client: Socket,
    payload: WsPayload,
  ): Promise<void> {
    const { _id } = await this.chatService.createMessage({
      body: 'Sent walkedDistance widget to the client.',
      chatId: payload.room,
      fromOperator: true,
      fromDoctor: false,
    });

    this.server
      .to(payload.room)
      .emit('widget:walkedDistance:operator', `${payload.message}#${_id}`);
  }

  @SubscribeMessage('widget:walkedDistance:user')
  async walkedDistanceUser(client: Socket, payload: WsPayload): Promise<void> {
    const body = `Walked distance widget response: ${payload.message}`;

    const { _id } = await this.chatService.createMessage({
      body,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: false,
    });

    this.server
      .to(payload.room)
      .emit('widget:walkedDistance:user', `${body}#${_id}`);
  }

  @SubscribeMessage('widget:pulse:operator')
  async pulseOperator(client: Socket, payload: WsPayload): Promise<void> {
    const { _id } = await this.chatService.createMessage({
      body: 'Sent pulse widget to the client.',
      chatId: payload.room,
      fromOperator: true,
      fromDoctor: false,
    });

    this.server
      .to(payload.room)
      .emit('widget:pulse:operator', `${payload.message}#${_id}`);
  }

  @SubscribeMessage('widget:pulse:user')
  async pulseUser(client: Socket, payload: WsPayload): Promise<void> {
    const body = `Pulse widget response: ${payload.message}`;

    const { _id } = await this.chatService.createMessage({
      body,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: false,
    });

    this.server.to(payload.room).emit('widget:pulse:user', `${body}#${_id}`);
  }

  @SubscribeMessage('widget:weight:operator')
  async weightOperator(client: Socket, payload: WsPayload): Promise<void> {
    const { _id } = await this.chatService.createMessage({
      body: 'Sent weight widget to the client.',
      chatId: payload.room,
      fromOperator: true,
      fromDoctor: false,
    });

    this.server
      .to(payload.room)
      .emit('widget:weight:operator', `${payload.message}#${_id}`);
  }

  @SubscribeMessage('widget:weight:user')
  async weightUser(client: Socket, payload: WsPayload): Promise<void> {
    const body = `Weight widget response: ${payload.message}`;

    const { _id } = await this.chatService.createMessage({
      body,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: false,
    });

    this.server.to(payload.room).emit('widget:weight:user', `${body}#${_id}`);
  }

  @SubscribeMessage('widget:pressure:operator')
  async pressureOperator(client: Socket, payload: WsPayload): Promise<void> {
    const { _id } = await this.chatService.createMessage({
      body: 'Sent pressure widget to the client.',
      chatId: payload.room,
      fromOperator: true,
      fromDoctor: false,
    });

    this.server
      .to(payload.room)
      .emit('widget:pressure:operator', `${payload.message}#${_id}`);
  }

  @SubscribeMessage('widget:pressure:user')
  async pressureUser(client: Socket, payload: WsPayload): Promise<void> {
    const body = `Pressure widget response: ${payload.message}`;

    const { _id } = await this.chatService.createMessage({
      body,
      chatId: payload.room,
      fromOperator: false,
      fromDoctor: false,
    });

    this.server.to(payload.room).emit('widget:pressure:user', `${body}#${_id}`);
  }

  @SubscribeMessage('widget:cancel')
  cancelWidget(client: Socket, payload: WsPayload) {
    this.server.to(payload.room).emit('widget:cancel', payload.message);
  }

  @SubscribeMessage('coach:typing')
  coachIsTyping(_client: Socket, payload: WsPayload) {
    this.server.to(payload.room).emit('coach:typing');
  }

  @SubscribeMessage('client:typing')
  clientIsTyping(_client: Socket, payload: WsPayload) {
    this.server.to(payload.room).emit('client:typing');
  }

  @SubscribeMessage('client:connected:operator')
  clientConnected(_client: Socket, payload: WsPayload) {
    activeChats[payload.room] = payload;
    this.server
      .to(payload.room)
      .emit('client:connected:operator', activeChats[payload.room]);
  }

  @SubscribeMessage('operator:online')
  operatorOnline(_client: Socket, payload: WsPayload) {
    activeChats[payload.room] = payload;
    this.server
      .to(payload.room)
      .emit('operator:online', activeChats[payload.room]);
  }

  @SubscribeMessage('operator:offline')
  operatorOffline(_client: Socket, payload: WsPayload) {
    delete activeChats[payload.room];
    this.server.to(payload.room).emit('operator:offline');
  }

  @SubscribeMessage('image:operator')
  async operatorImage(client: Socket, payload: WsPayload): Promise<void> {
    const { _id, createdAt } = (await this.chatService.createMessage({
      body: payload.message,
      chatId: payload.room,
      fromOperator: true,
      fromDoctor: false,
    })) as MessageDocument & { createdAt: string };

    this.server
      .to(payload.room)
      .emit('image:operator', `${payload.message}#${_id}#${createdAt}`);
  }

  handleConnection(client: Socket) {
    const room = client.handshake.query.room;
    client.join(room);
    client.to(room).emit('message:server', `Client connected to this chat.`);
  }
}
