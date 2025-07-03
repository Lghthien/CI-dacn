import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { ToursModule } from './modules/tours/tours.module';
import { BookingModule } from './modules/booking/booking.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BlogPostModule } from './modules/blog-post/blog-post.module';
import { BlogCommentModule } from './modules/blog-comment/blog-comment.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017/travelweb',
    ),
    UsersModule,
    ToursModule,
    BookingModule,
    ReviewsModule,
    BlogPostModule,
    BlogCommentModule,
    AuthModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
