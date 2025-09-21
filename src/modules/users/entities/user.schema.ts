import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  avatar: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: String, default: null })
  resetCode: string | null;

  @Prop({ type: Date, default: null })
  resetCodeExpire: Date | null;

  @Prop()
  twoFAsecret: string;

  @Prop({ type: Boolean, defaule: false })
  isTwoFAenabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
