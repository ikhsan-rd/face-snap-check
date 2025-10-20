import { useEffect } from "react";

const Maintenance = () => {
  useEffect(() => {
    console.warn("Maintenance Mode: Website sedang dalam perbaikan.");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 text-gray-800">
      <div className="text-center p-6">
        <h1 className="mb-4 text-5xl font-bold text-blue-600">
          🚧 Sedang Diperbaiki
        </h1>
        <p className="mb-6 text-lg text-gray-600 max-w-md mx-auto">
          Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan.
          Mohon maaf atas ketidaknyamanan ini 🙏
        </p>

        {/* Animasi motor */}
        <div className="relative w-full max-w-md h-24 overflow-hidden mt-0">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-400/40"></div>

          {/* Motor bergerak */}
          <div className="absolute bottom-3 left-0 animate-drive">
            <div className="text-6xl">🏍️💨</div>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Silakan kembali lagi nanti 🚀
        </p>
      </div>

      <style>{`
        @keyframes drive {
          0% {
            transform: translateX(250%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-drive {
          animation: drive 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Maintenance;
