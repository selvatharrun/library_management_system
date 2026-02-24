import {User} from "@/types"

export 
function getStoredUser(): User| null 
{
  //Prevents errors during server-side rendering (SSR) by checking if window exists
  if (typeof window === "undefined") return null;
  //check localStorage in inspect lol
  const raw = localStorage.getItem("lms_user");
  if(!raw) return null;

  try {
    //type checking is safer, its not throwing so i should be fine
    return JSON.parse(raw) satisfies User;
  } 
  
  catch {
    return null;
  }
}