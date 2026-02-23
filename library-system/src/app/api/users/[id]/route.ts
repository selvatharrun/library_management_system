import { NextResponse } from "next/server";
import { UserService } from "@/libs/services/userService";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = UserService.getUserById(id);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 404 }
    );
  }
}