import { redirect } from "next/navigation";

export async function generateStaticParams() {
  // Return empty array to skip static generation for this dynamic route
  // Invite codes are dynamic and cannot be pre-generated
  return [];
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // For static export, redirect to a dynamic handler or show error
  // Since this is a PWA, invite codes will be handled differently
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[rgba(20,20,20,0.92)] border-2 border-[#4fdfff] rounded-xl p-6 shadow-[0_0_40px_rgba(79,223,255,0.25)]">
        <h1 className="text-white font-bold text-xl mb-2">Invitation non disponible</h1>
        <p className="text-white/60 text-sm">
          Les liens d'invitation ne sont pas supportés dans cette version. Veuillez utiliser la version web.
        </p>
      </div>
    </main>
  );
}