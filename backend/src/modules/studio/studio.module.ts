import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StudioController } from './studio.controller';
import { StudioService } from './studio.service';
import { PayoutEncryptionService } from './payout-encryption.service';

@Module({
  imports: [AuthModule],
  controllers: [StudioController],
  providers: [StudioService, PayoutEncryptionService],
  exports: [PayoutEncryptionService],
})
export class StudioModule {}
