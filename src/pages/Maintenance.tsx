import { useEffect } from "react";

const Maintenance = () => {
  useEffect(() => {
    console.warn("Maintenance Mode: Website sedang dalam perbaikan.");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 text-gray-800">
      <div className="text-center p-6">
        <h1 className="mb-4 text-5xl font-bold text-blue-600">
          🚧 Sedang Diperbaiki
        </h1>
        <p className="mb-4 text-lg text-gray-600 max-w-md mx-auto">
          Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan
          kami. Mohon maaf atas ketidaknyamanan ini.
        </p>
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-opacity-70"></div>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Silakan kembali lagi nanti 🙏
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
