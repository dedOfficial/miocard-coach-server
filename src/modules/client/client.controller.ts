import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { ClientService } from './client.service';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @UseGuards(new JwtAuthGuard())
  @Get('chats')
  getChatsForClient(@Req() request: Request) {
    const phone = request.user.phone;
    return this.clientService.getChatsForUser(phone);
  }

  @UseGuards(new JwtAuthGuard())
  @Get('results')
  getClientResults(@Req() request: Request) {
    const phone = request.user.phone;
    return this.clientService.getClientResults(phone);
  }
}
