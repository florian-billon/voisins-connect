"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    apartment_number: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t("auth.register.passwordTooShort"));
      setIsLoading(false);
      return;
    }

    try {
      const result = await signup(formData.username.trim(), formData.apartment_number.trim(), formData.email, formData.password);

      if (result.error) {
        setError(result.error);
        return;
      }

      window.location.href = "/";
      return;
    } catch {
      setError(t("auth.register.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative w-full min-h-screen">
      <div className="fixed inset-0 bg-[url('/background-clouds.png')] bg-cover bg-center bg-no-repeat brightness-[0.7] contrast-[1.1] z-0" />

      <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center w-full max-w-md">
          <Image
            src="/logo.png"
            alt={t("auth.logoAlt")}
            width={150}
            height={150}
            className="mb-4 md:mb-6 w-24 h-24 md:w-36 md:h-36"
          />

          <header className="mb-8 text-center">
            <h1 className="text-white text-lg md:text-xl font-bold">
              {t("auth.welcomeMessage")}
            </h1>
          </header>

          <section className="w-full p-4 md:p-6 md:px-8 bg-[rgba(20,20,20,0.85)] backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-[#5b8cff] animate-[fadeIn_0.5s_ease]">
            <div className="text-center mb-6 md:mb-8">
              <h3 className="text-white font-bold tracking-widest text-base md:text-lg">{t("auth.register.title")}</h3>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder={t("auth.register.usernamePlaceholder")}
                required
                minLength={1}
                maxLength={32}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <Input
                type="text"
                placeholder={t("auth.register.apartmentPlaceholder")}
                value={formData.apartment_number}
                onChange={(e) => setFormData({ ...formData, apartment_number: e.target.value })}
              />
              <Input
                type="email"
                placeholder={t("auth.register.emailPlaceholder")}
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                type="password"
                placeholder={t("auth.register.passwordPlaceholder")}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText={t("auth.register.passwordHelper")}
              />
              <Input
                type="password"
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
                className="mt-4"
              >
                {t("auth.register.submit")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-[#5b8cff] hover:underline transition-colors">
                {t("auth.register.hasAccount")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
