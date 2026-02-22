import alt_users from "@/data/users.json";
import { User } from "@/types";

//extra variable solves a stupid error
//TypeScript thinks your imported JSON is {}
//But you're treating it like BorrowRecord[]

//this is a form of type assertion, satisifies keyword is safer i think
const users:User[] = alt_users as User[]

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
}