import * as TypeORM from "typeorm";
import Model from "./common";

import User from "./user";

@TypeORM.Entity()
export default class UserPrivilege extends Model {
  @TypeORM.Index()
  @TypeORM.PrimaryColumn({ type: "integer" })
  user_id: number;
  @TypeORM.ManyToOne(type => User, user => user.userPrivileges, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @TypeORM.JoinColumn({ name: 'user_id' })
  user_t: User;

  @TypeORM.Index()
  @TypeORM.PrimaryColumn({ type: "varchar", length: 80 })
  privilege: string;
}
