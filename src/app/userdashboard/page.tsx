"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Correct hook for App Router
import { onAuthStateChanged } from "firebase/auth";
import UserDashboardContent from './UserDashboardContent';
import { auth, db } from '@/firebase/firebaseApp';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If the user is not logged in, redirect to home page
        router.push("/");
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  return (
    <>
      <UserDashboardContent auth={auth} db={db} />
    </>
  );
}
