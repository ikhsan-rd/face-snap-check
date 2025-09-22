import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Clock, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(mockPresensiData.length / itemsPerPage);
  const paginatedData = mockPresensiData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Overview Presensi</h1>
              <p className="text-muted-foreground">Riwayat presensi Anda</p>
            </div>
          </div>
          <Button onClick={() => navigate("/")} className="hidden sm:flex">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Presensi
          </Button>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Riwayat Presensi</h2>
            <Button onClick={() => navigate("/")} className="sm:hidden">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Presensi
            </Button>
          </div>
          
          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-5 gap-4 pb-2 text-sm font-medium text-muted-foreground border-b mb-4">
              <div>Tanggal</div>
              <div>Status</div>
              <div>Jam</div>
              <div>Lokasi</div>
              <div>Keterangan</div>
            </div>
            <div className="space-y-2">
              {paginatedData.map((item) => (
                <div key={item.id} className="grid grid-cols-5 gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="font-medium">
                    {new Date(item.tanggal).toLocaleDateString("id-ID", { 
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                  <div className="text-sm text-muted-foreground">{item.jam}</div>
                  <div className="text-sm text-muted-foreground truncate">{item.lokasi}</div>
                  <div className="text-sm">{item.presensi}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {paginatedData.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {new Date(item.tanggal).toLocaleDateString("id-ID", { 
                      day: "2-digit",
                      month: "short"
                    })}
                  </div>
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
                      <span className="truncate">{item.lokasi}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Overview;