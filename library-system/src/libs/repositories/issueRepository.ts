import rawIssues from "@/data/issues.json";
import { Issue } from "@/types";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/issues.json");

let issues: Issue[] = rawIssues as Issue[];

export class IssueRepository {

  static findAll(): Issue[] {
    return issues;
  }

  static findById(id: string): Issue | undefined {
    return issues.find(issue => issue.id === id);
  }

  static findByBookId(bookId: string): Issue[] {
    return issues.filter(issue => issue.bookId === bookId);
  }

  static findByUserId(userId: string): Issue[] {
    return issues.filter(issue => issue.userId === userId);
  }

  static findActiveByBook(bookId: string): Issue[] {
    return issues.filter(
      issue => issue.bookId === bookId && issue.status === "ISSUED"
    );
  }

  static findActiveByUserAndBook(userId: string, bookId: string): Issue | undefined {
    return issues.find(
      issue =>
        issue.userId === userId &&
        issue.bookId === bookId &&
        issue.status === "ISSUED"
    );
  }

  static create(issue: Issue): Issue {
    issues.push(issue);
    this.persist();
    return issue;
  }

  static update(updated: Issue): Issue {
    const index = issues.findIndex(i => i.id === updated.id);
    if (index === -1) throw new Error("Issue not found");

    issues[index] = updated;
    this.persist();
    return updated;
  }

  private static persist() {
    fs.writeFileSync(filePath, JSON.stringify(issues, null, 2));
  }
}