import { Module } from '@nestjs/common';
import { CalcController } from './calc.controller';
import { CalService } from './calc.service';

@Module({
  imports: [],
  exports: [CalService],
  controllers: [CalcController],
  providers: [CalService],
})
export class CalcModule {}
