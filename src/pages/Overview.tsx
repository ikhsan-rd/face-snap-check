import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data for presensi history
const mockPresensiData = [
  {
    id: 1,
    tanggal: "2024-01-15",
    jam: "08:30:00",
    presensi: "Hadir",
    lokasi: "Jl. Sudirman No. 123, Jakarta",
    status: "on-time"
  },
  {
    id: 2,
    tanggal: "2024-01-14",
    jam: "08:45:00",
    presensi: "Hadir",
    lokasi: "Jl. Sudirman No. 123, Jakarta",
    status: "late"
  },
  {
    id: 3,
    tanggal: "2024-01-13",
    jam: "08:15:00",
    presensi: "Hadir",
    lokasi: "Jl. Sudirman No. 123, Jakarta",
    status: "on-time"
  },
  {
    id: 4,
    tanggal: "2024-01-12",
    jam: "-",
    presensi: "Tidak Hadir",
    lokasi: "-",
    status: "absent"
  },
  {
    id: 5,
    tanggal: "2024-01-11",
    jam: "08:20:00",
    presensi: "Hadir",
    lokasi: "Jl. Sudirman No. 123, Jakarta",
    status: "on-time"
  },
];

const Overview = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-time":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Tepat Waktu</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Terlambat</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Tidak Hadir</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const stats = {
    totalHadir: mockPresensiData.filter(item => item.presensi === "Hadir").length,
    totalTerlambat: mockPresensiData.filter(item => item.status === "late").length,
    totalTidakHadir: mockPresensiData.filter(item => item.status === "absent").length,
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Overview Presensi</h1>
            <p className="text-muted-foreground">Riwayat presensi Anda</p>
          </div>
        </header>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hadir</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalHadir}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terlambat</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalTerlambat}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tidak Hadir</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalTidakHadir}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Presensi History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Riwayat Presensi</h2>
          <div className="space-y-4">
            {mockPresensiData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-medium">{new Date(item.tanggal).getDate()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", { month: "short" })}
                    </p>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.presensi}</p>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.jam}</span>
                      </div>
                      {item.lokasi !== "-" && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-xs">{item.lokasi}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;