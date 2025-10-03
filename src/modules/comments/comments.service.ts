import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../post/entities/post.schema';
import mongoose, { Model } from 'mongoose';
import { Comment } from './entities/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
  ) {}
  async create(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    const comment = new this.commentModel({
      ...createCommentDto,
      userId,
      postId,
    });
    await comment.save();

    return { message: 'comment successfully', comment };
  }

  async findByPost(id: string) {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    const comments = await this.commentModel
      .find({ postId: post._id })
      .populate('userId', 'name');
    return { message: `get comments of post ${id} `, comments };
  }

  findOne(id: number) {
    return `This action returns a #${id} comment`;
  }

  async remove(userId: string, id: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId.toString() !== userId)
      throw new ForbiddenException('You cant not delete this comment');
    const post = await this.postModel.findById(comment.postId);
    if (!post) throw new NotFoundException('Post not found');
    await this.commentModel.deleteOne(comment._id);
    return {
      message: ' remove comment successsfully',
      comment: comment.content,
    };
  }
  async delete(id: string) {
    const removeCmt = await this.commentModel
      .findById(id)
      .populate('userId', 'name');
    if (!removeCmt) throw new NotFoundException('Comment not found');
    await this.commentModel.deleteOne(removeCmt._id);
    return { message: 'Delete cmt successfully', comment: removeCmt };
  }

  // get post that user commented
  async getCommentedPosts(userId: string) {
    const posts = await this.commentModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'posts',
          pipeline: [
            { $sort: { createdAt: -1 } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            {
              $project: {
                _id: 1,
                title: 1,
                content: 1,
                auth: '$userInfo.name',
              },
            },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          createdAt: 1,
          content: 1,
          posts: '$posts',
        },
      },
    ]);
    return { message: 'get posts that user commented successfully', posts };
  }
}
