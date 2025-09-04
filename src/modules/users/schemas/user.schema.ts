import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  image: string;

  @Prop({ default: 'USER' })
  role: string;

  @Prop({ default: 'LOCAL' })
  accountType: string;

  @Prop({ default: false })
  isActive: string;

  @Prop()
  codeId: string;

  @Prop()
  codeExpired: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
