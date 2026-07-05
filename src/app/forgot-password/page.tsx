import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-16">
      <div className="text-center mb-6 sm:mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xl">
          A
        </div>
        <h1 className="text-xl sm:text-2xl font-bold">忘记密码</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">输入注册邮箱，我们将发送重置链接</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
