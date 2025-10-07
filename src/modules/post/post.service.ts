import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Post } from './entities/post.schema';
import dayjs from 'dayjs';
import { LikesService } from '../likes/likes.service';
import { CommentsService } from '../comments/comments.service';
import { PostRepository } from './post.repository';

export interface postInterface {
  _id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  time_recenInteraction: Date;
}

@Injectable()
export class PostService {
  constructor(
    private readonly userService: UsersService,
    private readonly likeService: LikesService,
    private readonly commentService: CommentsService,
    private readonly postRepo: PostRepository,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {}

  // tạo post
  async create(_id: string, createPostDto: CreatePostDto) {
    const user = await this.userService.findOne(_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const createPost = await this.postModel.create({
      ...createPostDto,
      userId: _id,
      author: { name: user.name, avatar: user.avatar },
    });

    return { message: 'create Post successfully', post: createPost };
  }

  //find one
  async getPost(id: string) {
    const post = await this.postRepo.GetPost(id);
    if (!post) throw new NotFoundException('Post not found');
    return { message: 'get post successfully', post };
  }

  // get my posts
  async meFindAll(_id: string, page: number = 1) {
    const user = await this.userService.findOne(_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = 10;
    const totalPosts = await this.postModel.countDocuments({
      userId: user._id,
      isDeleted: false,
    });
    const totalPage = Math.ceil(totalPosts / limit);

    const getMyPosts = await this.postRepo.meFindAll(_id, page);

    return {
      message: `all posts of ${user.name} `,
      currentPage: page,
      totalPage,
      totalPosts,
      getMyPosts,
    };
  }

  // get posts is softDelete
  async getSoftDelete(_id: string, page: number = 1) {
    const user = await this.userService.findOne(_id);
    if (!user) throw new NotFoundException('User not found');
    const limit = 10;
    const skip = (page - 1) * limit;
    const totalPosts = await this.postModel.countDocuments({
      userId: user._id,
      isDeleted: false,
    });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.postModel
      .find({
        userId: user._id,
        isDeleted: true,
      })
      .skip(skip)
      .limit(limit);
    return {
      message: 'get softDelete posts successfully ',
      currentPage: page,
      totalPage,
      totalPosts,
      posts,
    };
  }

  async getAllSoftDelete(page: number = 1) {
    const limit = 10;
    const totalPosts = await this.postModel.countDocuments({
      isDeleted: true,
    });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.postRepo.getAllSoftDelete(page);
    return { currentPage: page, totalPage, totalPosts, posts };
  }

  // update post
  async update(_id: string, id: string, updatePostDto: UpdatePostDto) {
    const post = await this.postModel.findOne({
      _id: id,
      userId: _id,
      isDeleted: false,
    });
    if (!post) throw new NotFoundException('Post not found');

    Object.assign(post, updatePostDto);
    await post.save();
    return { message: 'update successfully', post };
  }

  // soft delete
  async softDelete(_id: string, id: string) {
    const user = await this.userService.findOne(_id);
    if (!user) throw new NotFoundException('User not found');
    await this.postModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deleteAt: new Date(),
    });

    return `soft delete post successfully`;
  }
  // restore post
  async restore(userId: string, postId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId.toString() !== userId)
      throw new ForbiddenException('You cant not restore this post');
    if (!post.isDeleted)
      throw new BadRequestException('This post is not in trash');
    await this.postModel.findByIdAndUpdate(postId, {
      isDeleted: false,
      deleteAt: null,
    });
    return { message: 'restore post successfully' };
  }

  // delete
  async delete(postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    await this.postModel.deleteOne({ _id: post._id });
    return {
      message: 'delete post successsully',
      post: post._id,
    };
  }

  // ------ sort posts ----- ///
  async newFeed(mode: 'day' | 'week' | 'month', page: number = 1) {
    const limit = 10;
    const totalPosts = await this.postModel.countDocuments({
      isDeleted: false,
    });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.postRepo.newFeed(mode, page);
    return {
      message: 'get newfeed successfully',
      currentPage: page,
      totalPage,
      totalPosts,
      posts,
    };
  }

  // post mới nhất
  async getLatest(page: number = 1) {
    const limit = 10;
    const totalPosts = await this.postModel.countDocuments({
      isDeleted: false,
    });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.postRepo.getLatest(page);
    return {
      message: 'get latest posts successfully',
      currentPage: page,
      totalPage,
      totalPosts,
      posts,
    };
  }

  // post có nhiều like nhất
  async getMostLikedPost(page: number = 1) {
    const limit = 10;
    const totalPosts = await this.postModel.countDocuments({
      isDeleted: false,
    });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.postRepo.getMostLikedPost(page);
    return {
      message: 'get most like posts successfully',
      currentPage: page,
      totalPage,
      totalPosts,
      posts,
    };
  }

  // post mới được tương tác
  async getRecentInteractions(page: number = 1) {
    const limit = 10;
    const totalPosts = await this.postModel.countDocuments({
      isDeleted: false,
    });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.postRepo.getRecentInteractions(page);
    return {
      message: 'get recent-interaction posts successfully',
      currentPage: page,
      totalPage,
      totalPosts,
      posts,
    };
  }

  async getMostInteractions(page: number = 1) {
    const limit = 10;
    const totalPosts = await this.postModel.countDocuments({
      isDeleted: false,
    });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.postRepo.getMostInteractions(page);
    return {
      message: 'get most interaction posts successfully',
      currentPage: page,
      totalPage,
      totalPosts,
      posts,
    };
  }

  // -----  user get posts that liked or commented
  async getPostLiked(userId: string, page: number = 1) {
    const post = await this.likeService.getLikedPosts(userId, page);
    return post;
  }
  async getPostCommented(userId: string, page: number = 1) {
    const posts = await this.commentService.getCommentedPosts(userId, page);
    return posts;
  }
}
