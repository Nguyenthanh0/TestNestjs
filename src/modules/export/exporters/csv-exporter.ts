import { Injectable } from '@nestjs/common';
import { Parser } from 'json2csv';

@Injectable()
export class CsvExporter {
  async export(posts: any[]): Promise<Buffer> {
    const parser = new Parser(); // nhận mảng object hoặc mảng đơn => xuất chuỗi csv(string)
    const csv = parser.parse(posts); // xuất thành chuỗi csv(string)
    const bom = '\uFEFF'; // ko bị lỗi chữ vn
    return Buffer.from(bom + csv, 'utf-8');
  }
}
