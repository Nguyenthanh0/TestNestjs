import { Controller, Get, Query, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import type { Response } from 'express';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}
  @Get('posts')
  async exportPost(
    @Query('format') format: string,
    @Query('sort') sort: string,
    @Query('page') page: number,
    @Query('mode') mode: 'day' | 'week' | 'month',
    @Res() res: Response,
  ) {
    const formats = format.split(',').map((f) => f.trim());
    const buffer = await this.exportService.export(formats, sort, page, mode);

    const filename = formats.length > 1 ? 'posts.zip' : `posts.${formats[0]}`;
    const mimeType =
      formats.length > 1
        ? 'application/zip'
        : formats[0] === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', mimeType); //cho browser biết loại file
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`, // yêu cầu tải file thay vì hiển thị
    );
    res.setHeader('Content-Length', buffer.length); // kích thước file
    res.send(buffer);
  }
}
