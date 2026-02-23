import { UserRepository } from "@/libs/repositories/userRepository";
import { IssueRepository } from "@/libs/repositories/issueRepository";
import { User } from "@/types";

export class UserService {

  /* -------------------------
     BASIC USER OPERATIONS
  -------------------------- */

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
      role: "STUDENT",
      createdAt: new Date().toISOString(),
    };

    return UserRepository.create(user);
  }

  /* -------------------------
     USER ISSUE DATA
  -------------------------- */

  static getUserCurrentIssues(userId: string) {
    const user = this.getUserById(userId);

    return IssueRepository.findByUserId(userId)
      .filter(issue => issue.status === "ISSUED");
  }

  static getUserHistory(userId: string) {
    const user = this.getUserById(userId);

    return IssueRepository.findByUserId(userId);
  }
}