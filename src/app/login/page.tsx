import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirect = params.redirect || "/dashboard";

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-16">
      <div className="text-center mb-6 sm:mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xl">
          A
        </div>
        <h1 className="text-xl sm:text-2xl font-bold">欢迎回来</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">登录你的 AIHub 账号</p>
      </div>
      <LoginForm redirect={redirect} />
    </div>
  );
}
