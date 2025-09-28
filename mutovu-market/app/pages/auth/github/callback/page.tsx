"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authUtils } from "../../../../lib/auth";

// Renamed the component internally for clarity, but the file path is what matters
const GithubCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const authError = searchParams.get("error"); // GitHub uses 'error' for failure

        if (authError) {
          throw new Error("GitHub authentication was cancelled or failed");
        }

        if (!code) {
          throw new Error("No authorization code received from GitHub");
        }

        // 🔑 CRITICAL FIX: Use the correct GitHub handler
        // This function calls the /user/api/auth/github/callback/ backend endpoint
        await authUtils.handleGithubCallback(code);

        router.push("../../../");
      } catch (err: any) {
        // Log the full error to the console for debugging
        console.error("GitHub Auth Error:", err);
        setError(err.message || "GitHub Authentication failed");

        setTimeout(() => {
          router.push("/pages/login");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Processing Github authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p>Redirecting to login page...</p>
        </div>
      </div>
    );
  }
  return null;
};

export default GithubCallback;
