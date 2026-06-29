"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePasswordLogin() {
    try {
      setLoading(true);
      setError("");
      const result = await signIn("password", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function sendOTP() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPLogin() {
    try {
      setLoading(true);
      setError("");
      const result = await signIn("otp", {
        email,
        otp,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid or expired OTP.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <CardTitle>Sign in to Dossier</CardTitle>
          <CardDescription>
            Use your password or a one-time code.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tab switcher */}
          <div className="flex rounded-md border p-1 gap-1">
            <button
              type="button"
              onClick={() => { setTab("password"); setError(""); }}
              className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors ${
                tab === "password"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setTab("otp"); setError(""); }}
              className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors ${
                tab === "otp"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              One-time code
            </button>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {tab === "password" && (
            <>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <Button
                className="w-full"
                onClick={handlePasswordLogin}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </>
          )}

          {tab === "otp" && (
            <>
              {otpSent && (
                <div className="space-y-2">
                  <Label>One-time code</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                  />
                </div>
              )}
              {error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              {!otpSent ? (
                <Button
                  className="w-full"
                  onClick={sendOTP}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send one-time code"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleOTPLogin}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Sign in"}
                </Button>
              )}
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <a href="/signup" className="underline hover:text-foreground">
              Create workspace
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
