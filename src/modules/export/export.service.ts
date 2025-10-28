import { ZipExporter } from './exporters/zip-exporter';
import { XlsxExporter } from './exporters/xlsx-exporter';
import { CsvExporter } from './exporters/csv-exporter';
import { Injectable } from '@nestjs/common';
import { PostService } from '../post/post.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly CsvExporter: CsvExporter,
    private readonly XlsxExporter: XlsxExporter,
    private readonly ZipExporter: ZipExporter,
    private readonly postService: PostService,
  ) {}
  async export(
    formats: string[],
    sort: string,
    page: number = 1,
    mode: 'day' | 'week' | 'month',
  ) {
    let result: {
      posts: any;
      message?: string;
      currentPage?: number;
      totalPage?: number;
      totalPosts?: number;
    };
    let posts = [];
    switch (sort) {
      case 'latest-posts':
        result = await this.postService.getLatest(page);
        break;
      case 'most-like':
        result = await this.postService.getMostLikedPost(page);
        break;
      case 'recent-interaction':
        result = await this.postService.getRecentInteractions(page);
        break;
      case 'most-interaction':
        result = await this.postService.getMostInteractions(page);
        break;
      case `most-interaction-by${mode}`:
        result = await this.postService.newFeed(mode, page);
        break;
      default:
        throw new Error('nosupported this sort');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    posts = result.posts || [];

    const files: { name: string; buffer: Buffer }[] = [];
    if (formats.includes('csv')) {
      const csvBuffer = await this.CsvExporter.export(posts);
      files.push({ name: 'post.csv', buffer: csvBuffer });
    }

    if (formats.includes('xlsx')) {
      const xlsxBuffer = await this.XlsxExporter.export(posts);
      files.push({ name: 'post.xlsx', buffer: xlsxBuffer });
    }

    if (files.length > 1) {
      const zipBuffer = await this.ZipExporter.export(files);
      return zipBuffer;
    }
    return files[0].buffer;
  }
}
