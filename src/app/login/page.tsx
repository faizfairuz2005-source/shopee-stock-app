"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Loader2 } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // Validate input with Zod
    const validationResult = loginSchema.safeParse({ email, password });

    if (!validationResult.success) {
      // Get the first validation error
      const firstError = validationResult.error.issues[0];
      setErrorMessage(firstError.message);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    setIsLoading(false);

    if (error) {
      // Don't expose detailed error messages for security
      setErrorMessage("Invalid email or password");
      return;
    }

    // Redirect to the intended page or dashboard
    router.push(redirectTo);
    router.refresh();
  };

   return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-border/60 shadow-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)]">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Shopee Stock Manager
            </CardTitle>
            <p className="mt-2 text-sm font-normal text-muted-foreground">
              Masuk untuk mengelola stok Anda
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit} suppressHydrationWarning>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="border-border/60 bg-background/80 transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="border-border/60 bg-background/80 transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <Button
              className="w-full shadow-lg transition-[transform,box-shadow] duration-200 ease-in-out hover:shadow-xl active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
              suppressHydrationWarning
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
