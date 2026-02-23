import rawUsers from "@/data/users.json";
import { User } from "@/types";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/users.json");

//type assetion lol could also use satsifies if u want.
let users: User[] = rawUsers as User[];

export class UserRepository {

  static findAll(): User[] {
    return users;
  }

  static findById(id: string): User | undefined {
    return users.find(user => user.id === id);
  }

  static findByEmail(email: string): User | undefined {
    return users.find(user => user.email === email);
  }

  static create(user: User): User {
    users.push(user);
    this.persist();
    return user;
  }

  static update(updated: User): User {
    const index = users.findIndex(u => u.id === updated.id);
    if (index === -1) throw new Error("User not found");

    users[index] = updated;
    this.persist();
    return updated;
  }

  private static persist() {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  }
}