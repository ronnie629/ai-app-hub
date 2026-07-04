import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">重置密码</h1>
        <p className="text-gray-500 mt-2">请设置你的新密码</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
