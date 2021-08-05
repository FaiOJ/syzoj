import * as TypeORM from "typeorm";
import Model from "./common";

import User from "./user";
import Problem from "./problem";
import ArticleComment from "./article-comment";

declare var syzoj: any;

@TypeORM.Entity()
export default class Article extends Model {
  static cache = false;

  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
  title: string;

  @TypeORM.Column({ nullable: true, type: "mediumtext" })
  content: string;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  user_id: number;
  @TypeORM.ManyToOne(type => User, user => user.articles, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @TypeORM.JoinColumn({ name: 'user_id' })
  user_t: User;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  problem_id: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  public_time: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  update_time: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  sort_time: number;

  @TypeORM.Column({ default: 0, type: "integer" })
  comments_num: number;

  @TypeORM.Column({ default: true, type: "boolean" })
  allow_comment: boolean;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "boolean" })
  is_notice: boolean;

  @TypeORM.Index()
  @TypeORM.Column({ default: true, type: "boolean" })
  is_public: boolean;

  // Foreign Keys
  // article-comment
  @TypeORM.OneToMany(type => ArticleComment, articleComment => articleComment.article_t)
  articleComments: ArticleComment[];

  user?: User;
  problem?: Problem;

  async loadRelationships() {
    this.user = await User.findById(this.user_id);
  }

  async isAllowedEditBy(user) {
    if (!user) return false;
    if (await user.hasPrivilege('manage_article')) return true;
    return this.user_id === user.id;
  }

  async isAllowedManageBy(user) {
    return user && await user.hasPrivilege('manage_article');
  }

  async isAllowedCommentBy(user) {
    if (!user) return false;
    if (await user.hasPrivilege('manage_article')) return true;
    return this.allow_comment || this.user_id === user.id;
  }

  async resetReplyCountAndTime() {
    await syzoj.utils.lock(['Article::resetReplyCountAndTime', this.id], async () => {
      this.comments_num = await ArticleComment.count({
        where: { article_id: this.id }
      });
      if (this.comments_num === 0) {
        this.sort_time = this.public_time;
      } else {
        this.sort_time = (await ArticleComment.findOne({
          where: { article_id: this.id },
          order: { public_time: "DESC" }
        })).public_time;
      }
      await this.save();
    });
  }
};
