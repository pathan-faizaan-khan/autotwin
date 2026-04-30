"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

declare global {
  interface Window {
    google: any;
  }
}

interface Props {
  context?: "signin" | "signup" | "use";
}

export default function GoogleOneTap({ context = "signin" }: Props) {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Already signed in — cancel any pending prompt and bail
      if (user) {
        window.google?.accounts?.id?.cancel();
        return;
      }
      if (initialized.current) return;
      initialized.current = true;

      const initOneTap = () => {
        window.google.accounts.id.initialize({
          client_id: clientId,
          context,
          use_fedcm_for_prompt: true,
          callback: async (response: { credential: string }) => {
            try {
              const firebaseCred = GoogleAuthProvider.credential(response.credential);
              const result = await signInWithCredential(auth, firebaseCred);
              // Upsert profile (non-fatal)
              fetch("/api/users/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  firebaseUid: result.user.uid,
                  displayName: result.user.displayName,
                  email: result.user.email ?? "",
                }),
              }).catch(() => {});
              router.push("/dashboard");
            } catch {
              // Silent — user can fall back to the regular sign-in button
            }
          },
        });
        window.google.accounts.id.prompt();
      };

      if (window.google?.accounts?.id) {
        initOneTap();
      } else {
        const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existing) {
          existing.addEventListener("load", initOneTap);
        } else {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = initOneTap;
          document.head.appendChild(script);
        }
      }
    });

    return () => {
      unsubscribe();
      window.google?.accounts?.id?.cancel();
    };
  }, [router, context]);

  // The One Tap UI is rendered by Google's SDK into its own floating element
  return null;
}
