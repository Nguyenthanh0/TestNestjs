import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, mongo } from 'mongoose';

export type CommenttDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop()
  content: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true })
  postId: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
