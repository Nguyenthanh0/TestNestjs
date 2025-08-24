import { Controller, Get } from '@nestjs/common';
import { CalService } from './calc.service';

@Controller()
export class CalcController {
  constructor(private readonly getprofile: CalService) {}
  @Get('/myinfo')
  getProfile() {
    return this.getprofile.getInfo();
  }
}
