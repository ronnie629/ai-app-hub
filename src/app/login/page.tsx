import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirect = params.redirect || "/dashboard";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="text-gray-500 mt-2">登录你的 AIHub 账号</p>
      </div>
      <LoginForm redirect={redirect} />
    </div>
  );
}
