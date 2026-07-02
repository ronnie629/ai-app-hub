export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm">
              A
            </div>
            <span className="font-bold gradient-text">AIHub</span>
            <span className="text-sm text-gray-400">AI应用聚合平台</span>
          </div>
          <p className="text-sm text-gray-400">
            连接AI开发者与用户 &middot; 让AI应用触手可及
          </p>
        </div>
      </div>
    </footer>
  );
}
