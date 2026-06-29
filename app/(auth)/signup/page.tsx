"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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

export default function SignupPage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setSent(true);
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceName, ownerName, email, otp, password }),
      });
      const data = await res.json();
      if (data.success) {
        await signIn("password", {
          email,
          password,
          redirect: false,
        });
        window.location.href = data.redirectTo ?? "/onboarding";
      } else {
        setError(data.message || "Verification failed.");
      }
    } catch {
      setError("Verification failed.");
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
          <CardTitle>Create Workspace</CardTitle>
          <CardDescription>
            Register your company and owner account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Workspace name</Label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Acme Studio"
            />
          </div>

          <div className="space-y-2">
            <Label>Your name</Label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Jane Smith"
            />
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

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">
              Used to log in after signup. You can also use OTP anytime.
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {!sent ? (
            <Button className="w-full" onClick={sendOTP} disabled={loading}>
              {loading ? "Sending..." : "Send verification code"}
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Verification code</Label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
                <p className="text-xs text-muted-foreground">
                  Check your email for the 6-digit code.
                </p>
              </div>
              <Button className="w-full" onClick={verifyOTP} disabled={loading}>
                {loading ? "Creating workspace..." : "Verify & create workspace"}
              </Button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="underline hover:text-foreground">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
