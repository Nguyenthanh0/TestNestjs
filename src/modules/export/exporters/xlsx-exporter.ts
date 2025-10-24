import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

interface Comment {
  _id?: any;
  content?: string;
  createdAt?: Date;
  auth?: string;
}

interface Author {
  _id?: any;
  name?: string;
  avatar?: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  author?: Author;
  createdAt?: string | Date;
  totalLike?: number;
  recentComment?: Comment[];
}
@Injectable()
export class XlsxExporter {
  async export(posts: Post[]): Promise<Buffer> {
    const flattenedPosts = posts.map((post) => ({
      _id: String(post._id),
      title: post.title,
      content: post.content,
      author: post.author
        ? `name: ${post.author.name ?? ''}, id: ${post.author._id ?? ''}, avatar: ${post.author.avatar ?? ''}`
        : '',
      createdAt: post.createdAt
        ? new Date(post.createdAt).toLocaleString('vi-VN')
        : '',
      totalLike: post.totalLike ?? 0,
      recentComment: Array.isArray(post.recentComment)
        ? post.recentComment
            .map(
              (c) =>
                `content: ${c.content ?? ''}, auth: ${c.auth ?? ''}, createdAt: ${
                  c.createdAt
                    ? new Date(c.createdAt).toLocaleString('en-US')
                    : ''
                }`,
            )
            .join('; ')
        : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(flattenedPosts); //chuyển mảng JSON thành một sheet
    const workbook = XLSX.utils.book_new(); // tạo workbook(excel file) trống
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Posts');
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
    return buffer;
  }
}
