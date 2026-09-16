"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  console.log("🟢 LoginPage component monté");
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🔴 handleSubmit appelé - début de la fonction");
    e.preventDefault();
    console.log("🔴 preventDefault appelé");
    setIsLoading(true);
    setError("");

    try {
      console.log("🔴 Tentative de login avec:", formData.email);
      console.log("🔴 Appel de la fonction login()...");
      const result = await login(formData.email, formData.password);
      console.log("🔴 Résultat login:", result);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Force redirection to home page
      console.log("🔴 Redirection forcée vers /");
      window.location.href = "/";
      return;
    } catch (err) {
      console.error("🔴 Erreur login:", err);
      setError(t("auth.login.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <div className="fixed inset-0 bg-[url('/background-clouds.png')] bg-cover bg-center bg-no-repeat brightness-[0.7] contrast-[1.1] z-0" />

      <div className="relative z-10 flex w-full h-full items-center justify-center">
        <div className="flex flex-col items-center justify-center p-6">
          <Image
            src="/logo.png"
            alt={t("auth.logoAlt")}
            width={150}
            height={150}
            className="mb-4 md:mb-6 w-30 h-30 md:w-45 md:h-45"
          />

          <header className="mb-8 text-center">
            <h1 className="text-white text-xl font-bold">
              {t("auth.welcomeMessage")}
            </h1>
          </header>

          <section className="w-full max-w-[380px] p-6 md:p-8 md:px-10 bg-[rgba(20,20,20,0.85)] backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-[#4fdfff] animate-[fadeIn_0.5s_ease]">
            <div className="text-center mb-8">
              <h3 className="text-white font-bold tracking-widest text-lg">{t("auth.login.title")}</h3>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder={t("auth.login.emailPlaceholder")}
                required
                value={formData.email}
                onChange={(e) => {
                  console.log("🔵 Email changé:", e.target.value);
                  setFormData({ ...formData, email: e.target.value });
                }}
              />
              <Input
                type="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                required
                value={formData.password}
                onChange={(e) => {
                  console.log("🔵 Password changé:", "***");
                  setFormData({ ...formData, password: e.target.value });
                }}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
                className="mt-4"
                onClick={() => console.log("🟠 Bouton SE CONNECTER cliqué")}
              >
                {t("auth.login.submit")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link href="/register" className="text-[#4fdfff] hover:underline transition-colors">
                {t("auth.login.noAccount")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
