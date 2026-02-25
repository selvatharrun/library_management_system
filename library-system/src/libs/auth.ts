import {User} from "@/types"

export 
function getStoredUser(): User| null 
{
  //SSR window checks lol
  if (typeof window === "undefined") return null;
  //check localStorage in inspect lol
  const raw = localStorage.getItem("lms_user");
  if(!raw) return null;

  try {
    //type checking is safer, its not throwing FOR NOW so i should be fine
    return JSON.parse(raw) satisfies User;
  } 
  
  catch (err) {
    return null;
  }
}