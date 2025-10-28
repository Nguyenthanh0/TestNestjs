import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostService } from '../post/post.service';
import dayjs from 'dayjs';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../post/entities/post.schema';
import { Model } from 'mongoose';

@Injectable()
export class PostCleanupService {
  private readonly logger = new Logger(PostCleanupService.name);
  constructor(
    private readonly postService: PostService,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {}
  // @Cron('* * * * *')  : ('giây phút giờ ngày tháng thứtrongtuần')

  // // hiển thị log mỗi phút
  // @Cron(CronExpression.EVERY_MINUTE)
  // everyMinute() {
  //   this.logger.debug('thực hiện cron mỗi phút');
  // }

  // //hiểnt thị log mỗi 5 giây
  // @Cron('*/5 * * * * *')
  // every5second() {
  //   this.logger.debug('cron chạy mỗi 5 giây');
  // }

  @Cron('0 30 11 * * *')
  itsBreaktime() {
    this.logger.debug('Its time to have lunch !  ^.^');
  }

  // mỗi 15 phút : xoá softDeletedPost >= 10 ngày
  @Cron('0 */15 * * * *')
  async delSoftDeletedPost() {
    const TEN_DAYS_AGO = dayjs().subtract(10, 'day').toDate();
    const result = await this.postModel.deleteMany({
      isDeleted: true,
      deleteAt: { $lte: TEN_DAYS_AGO },
    });
    this.logger.debug(
      `đã xoá vĩnh viễn ${result.deletedCount} bài viết sau hơn 10 ngày bị softDeleted`,
    );
  }

  // thực hiện tác vụ vào đầu mỗi 1 ngày
  @Cron('0 0 0 * * *')
  async deleteUninteractedPosts() {
    const One_Day_Ago = dayjs().subtract(1, 'day').toDate();
    const result = await this.postModel.deleteMany({
      isDeleted: false,
      createdAt: { $lte: One_Day_Ago },
      totalComment: 0,
      totalLike: 0,
    });
    this.logger.debug(
      `đã xoá ${result.deletedCount} bài post không có tương tác sau hơn 1 ngày tạo`,
    );
  }
}
