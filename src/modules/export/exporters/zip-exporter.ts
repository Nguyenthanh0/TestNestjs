import { Injectable } from '@nestjs/common';
import JSZip from 'jszip';

@Injectable()
export class ZipExporter {
  async export(files: { name: string; buffer: Buffer }[]): Promise<Buffer> {
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.name, file.buffer);
    }
    return await zip.generateAsync({ type: 'nodebuffer' }); // tạo file zip hoàn chỉnh có định dang nodejs buffer
  }
}
