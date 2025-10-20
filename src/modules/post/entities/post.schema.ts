import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, mongo } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deleteAt: Date;

  @Prop({
    type: {
      name: String,
      avatar: String,
    },
  })
  author: {
    name: string;
    avatar: string;
  };

  @Prop({ type: Number, default: 0 })
  totalLike: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
