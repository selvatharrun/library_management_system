import { NextResponse } from "next/server";
import { UserService } from "@/libs/services/userService";

export function GET() {
  const users = UserService.getAllUsers();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const user = UserService.createUser(name, email);
    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}