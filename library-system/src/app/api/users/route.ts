import { NextResponse } from "next/server";
import { UserService } from "@/libs/services/userService";

export function GET() {
  const users = UserService.getAllUsers();
  return NextResponse.json(users);
}