import { redirect } from "react-router";
import { getGoogleAuthUrl } from "@/lib/google";

export function loader() {
  return redirect(getGoogleAuthUrl());
}
