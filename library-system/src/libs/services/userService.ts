import { UserRepository } from "@/libs/repositories/userRepository";
import { IssueRepository } from "@/libs/repositories/issueRepository";
import { User } from "@/types";

export class UserService {

  //CRUD for users lol
  static getAllUsers(): User[] {
    return UserRepository.findAll();
  }

  static getUserById(id: string): User {
    const user = UserRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static getUserByEmail(email: string): User {
    const user = UserRepository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static createUser(name: string, email: string): User {
    const existing = UserRepository.findByEmail(email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const user: User = {
      id: `u${Date.now()}`,
      name,
      email,
      role: "USER",
      createdAt: new Date().toISOString(),
    };

    return UserRepository.create(user);
  }

  //returns only the ones that have "ISSUED" basically if book is borrowed.
  static getUserCurrentIssues(userId: string) {
    const user = this.getUserById(userId);
    return IssueRepository.findByUserId(userId).filter(issue => issue.status === "ISSUED");
  }

  //this is to fetch the history of all the borrowings of the user.
  static getUserHistory(userId: string) {
    const user = this.getUserById(userId);
    return IssueRepository.findByUserId(userId);
  }
}