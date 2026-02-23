import { NextResponse } from "next/server";
import { IssueService } from "@/libs/services/issueService";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updated = IssueService.returnBook(params.id);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}