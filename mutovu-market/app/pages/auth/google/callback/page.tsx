"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authUtils } from "../../../../lib/auth";

const GoogleCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
          throw new Error("Google authentication was cancelled or failed");
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        await authUtils.handleGoogleCallback(code);
        router.push("/pages/dashboard?welcome=true");
      } catch (err: any) {
        setError(err.message || "Authentication failed");
        setTimeout(() => {
          router.push("/login");
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
          <p>Processing Google authentication...</p>
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

export default GoogleCallback;
