import { Injectable } from '@nestjs/common';

@Injectable()
export class CalService {
  private cccd: string = '23847835793';
  public name: string = 'Thanh';
  public classname: string = 'PM27.30';
  id = 12345;

  getInfo() {
    return `My name is ${this.name}. im from ${this.classname}, my id is ${this.id}`;
  }
}
