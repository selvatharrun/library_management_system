import { NextResponse } from "next/server";
import { UserService } from "@/libs/services/userService";

export function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = UserService.getUserById(params.id);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 404 }
    );
  }
}