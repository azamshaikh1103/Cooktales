import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import { ContactService } from './contact.service';
import { SendContactMessageDto } from './dto/contact.dto';

@Controller({ path: 'contact', version: '1' })
@UseGuards(CsrfOriginGuard)
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  send(@Body() dto: SendContactMessageDto) {
    return this.contact.send(dto);
  }
}
