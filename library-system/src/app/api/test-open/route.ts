import { OpenLibraryService } from "@/services/openLibraryService";

export async function GET() {
  const results = await OpenLibraryService.searchBooks("harry potter");

  return Response.json(results);
}