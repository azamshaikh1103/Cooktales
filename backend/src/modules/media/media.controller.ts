import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ConfirmMediaUploadDto, CreateSignedUploadDto, DeleteMediaAssetDto } from './dto/media.dto';
import { MediaService } from './media.service';

@Controller({
  path: 'media',
  version: '1',
})
@UseGuards(AuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign-upload')
  @HttpCode(HttpStatus.OK)
  createSignedUpload(@Body() dto: CreateSignedUploadDto, @Req() request: AuthenticatedRequest) {
    return this.mediaService.createSignedUpload({
      userId: request.user.sub,
      context: dto.context,
      entityId: dto.entityId,
      resourceType: dto.resourceType,
    });
  }

  @Post('confirm-upload')
  @HttpCode(HttpStatus.OK)
  confirmUpload(@Body() dto: ConfirmMediaUploadDto, @Req() request: AuthenticatedRequest) {
    return this.mediaService.confirmUpload(request.user.sub, dto);
  }

  @Delete('asset')
  @HttpCode(HttpStatus.OK)
  deleteOwnAsset(@Body() dto: DeleteMediaAssetDto, @Req() request: AuthenticatedRequest) {
    return this.mediaService.deleteOwnAsset(request.user.sub, {
      publicId: dto.publicId,
      resourceType: dto.resourceType,
    });
  }
}
