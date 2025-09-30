import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './entities/post.schema';

@Injectable()
export class PostService {
  constructor(
    private readonly userService: UsersService,
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
    });

    return { message: 'create Post successfully', post: createPost };
  }

  // get posts
  async meFindAll(_id: string) {
    const user = await this.userService.findOne(_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const posts = await this.postModel
      .find({ userId: user._id, isDeleted: false })
      .sort({ createdAt: -1 });

    return { message: `all posts of ${user.name} `, posts };
  }

  // get posts is softDelete
  async getSoftDelete(_id: string) {
    const user = await this.userService.findOne(_id);
    if (!user) throw new NotFoundException('User not found');
    const posts = await this.postModel.find({
      userId: user._id,
      isDeleted: true,
    });
    return { message: 'get softDelete posts successfully ', posts };
  }

  async findAll() {
    const posts = this.postModel.find();
    return posts;
  }

  async update(_id: string, id: string, updatePostDto: UpdatePostDto) {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId.toString() !== _id) {
      throw new ForbiddenException('You can not edit this post');
    }
    Object.assign(post, updatePostDto);
    await post.save();
    return { message: 'update successfully', post };
  }

  async softDelete(_id: string, id: string) {
    const user = await this.userService.findOne(_id);
    if (!user) throw new NotFoundException('User not found');
    await this.postModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deleteAt: new Date(),
    });

    return `soft delete post successfully`;
  }

  async delete(postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    await this.postModel.deleteOne({ _id: post._id });
    return {
      message: 'delete post successsully',
      post: post._id,
    };
  }
}
