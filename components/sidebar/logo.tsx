'use client';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">L</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          LumenDev
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Certificate Generator
        </span>
      </div>
    </div>
  );
}
