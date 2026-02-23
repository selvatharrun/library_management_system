import { NextResponse } from "next/server";
import { IssueService } from "@/libs/services/issueService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (userId) {
    const issues = IssueService.getUserIssues(userId);
    return NextResponse.json(issues);
  }

  const all = IssueService.getAllIssues();
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const issue = IssueService.issueBook(
      body.userId,
      body.bookId,
      body.location
    );

    return NextResponse.json(issue, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}