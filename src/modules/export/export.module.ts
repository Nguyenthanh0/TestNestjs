import { forwardRef, Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { PostModule } from '../post/post.module';
import { CsvExporter } from './exporters/csv-exporter';
import { XlsxExporter } from './exporters/xlsx-exporter';
import { ZipExporter } from './exporters/zip-exporter';
import { ExportController } from './export.controller';

@Module({
  exports: [ExportService],
  imports: [PostModule],
  controllers: [ExportController],
  providers: [ExportService, CsvExporter, XlsxExporter, ZipExporter],
})
export class ExportModule {}
