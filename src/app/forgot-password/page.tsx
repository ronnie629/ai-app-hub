import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">忘记密码</h1>
        <p className="text-gray-500 mt-2">输入注册邮箱，我们将发送重置链接</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
