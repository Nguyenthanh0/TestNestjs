import { PostGateway } from './../WebSocket/post.gateway';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../post/entities/post.schema';
import { Model } from 'mongoose';
import { Comment } from './entities/comment.schema';
import { CommentRepository } from './comments.repository';
import type { Cache } from 'cache-manager';
import { User } from '../users/entities/user.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    private readonly commentRepo: CommentRepository,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    private readonly postGateway: PostGateway,
  ) {}

  //del cache
  private async clearCommentedPostsCache(userId: string) {
    const pattern = `mecommentedposts_${userId}_page_*`;
    await this.cacheManager.del(pattern);
  }

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
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { totalComment: 1 },
    });
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('user not found');
    await this.postGateway.notifyWhenUserComment(post.userId.toString(), {
      content: createCommentDto.content,
      username: user?.name,
      userId,
      title: post.title,
      postId,
    });
    await this.clearCommentedPostsCache(userId);
    return { message: 'comment successfully', comment };
  }

  async findByPost(id: string, page: number = 1, limit: number = 10) {
    const post = await this.postModel.findOne({ _id: id, isDeleted: false });
    if (!post) throw new NotFoundException('Post not found');
    const skip = (page - 1) * limit;
    const comments = await this.commentModel
      .find({ postId: post._id })
      .populate('userId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalComments = await this.commentModel.countDocuments({
      postId: post._id,
    });
    const totalPages = Math.ceil(totalComments / limit);
    return {
      message: `get comments of post ${id} `,
      currentPage: page,
      totalPages,
      totalComments,
      comments,
    };
  }

  async remove(userId: string, id: string) {
    const comment = await this.commentModel.findOne({
      _id: id,
      userId: userId,
      isDeleted: false,
    });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.commentModel.findByIdAndUpdate(comment._id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    await this.postModel.findByIdAndUpdate(comment.postId, {
      $inc: { totalComment: -1 },
    });
    await this.clearCommentedPostsCache(userId);
    return {
      message: ' soft delete comment successsfully',
      comment: comment.content,
    };
  }

  async delete(id: string) {
    const removeCmt = await this.commentModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!removeCmt) {
      throw new NotFoundException('Commnet not found');
    }
    await this.commentModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    await this.postModel.findByIdAndUpdate(removeCmt.postId, {
      $inc: { totalComment: -1 },
    });
    return {
      message: 'Soft delete cmt successfully',
      comment: removeCmt.content,
    };
  }

  // restore cmt
  async restore(id: string) {
    const restoreCmt = await this.commentModel.findOne({
      _id: id,
      isDeleted: true,
    });
    if (!restoreCmt) throw new NotFoundException('Comment not found');
    await this.commentModel.findByIdAndUpdate(id, {
      isDeleted: false,
      deletedAt: null,
    });
    await this.postModel.findByIdAndUpdate(restoreCmt.postId, {
      $inc: { totalComment: 1 },
    });
    return restoreCmt.content;
  }

  // get post that user commented
  async getCommentedPosts(userId: string, page: number) {
    const limit = 10;
    const totalPosts = await this.commentModel.countDocuments({
      userId: userId,
    });
    const totalPages = Math.ceil(totalPosts / limit);
    const posts = await this.commentRepo.getCommentedPosts(userId, page);
    return {
      message: 'get posts commented by me successfully',
      currentPage: page,
      totalPages,
      totalPosts,
      posts,
    };
  }
}
