import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { LogoImage } from "@/shared/ui/logo";
import { LoginForm } from "@/features/auth/login";

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border border-border shadow-lg shadow-black/40 ring-1 ring-white/5">
        <CardHeader className="text-center">
          <LogoImage className="mx-auto mb-2" />
          <CardTitle className="text-2xl">Вход</CardTitle>
          <CardDescription>Введите email и пароль для входа</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
