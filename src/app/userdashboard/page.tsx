"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import UserDashboard from "./userdashboard";
import { auth } from "@/firebase/firebaseConfig";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          // If the user is not logged in, redirect to home page
          router.push("/");
        }
      });

      return () => unsubscribe(); // Cleanup subscription on unmount
    }
  }, [router]);

  return (
    <>
      <UserDashboard />
    </>
  );
}
