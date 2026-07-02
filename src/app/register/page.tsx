import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">创建账号</h1>
        <p className="text-gray-500 mt-2">加入 AIHub，发现和发布 AI 应用</p>
      </div>
      <RegisterForm />
    </div>
  );
}
