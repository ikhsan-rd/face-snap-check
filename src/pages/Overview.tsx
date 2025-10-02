import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Clock, ClipboardCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchDashboard, getCurrentUser } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { DashboardData } from "@/services/api";

const Overview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const itemsPerPage = 10;

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    const bulanFilter = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    
    const response = await fetchDashboard(currentUser.id, bulanFilter);
    
    if (response.success && response.data) {
      setDashboardData(response.data);
    } else {
      toast({
        title: "Error",
        description: response.message || "Gagal mengambil data dashboard",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const records = dashboardData?.records || [];
  const totalPages = Math.ceil(records.length / itemsPerPage);
  const paginatedData = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (presensi: string) => {
    const status = presensi.toLowerCase();
    switch (status) {
      case "hadir":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hadir</Badge>;
      case "pulang":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pulang</Badge>;
      case "izin":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Izin</Badge>;
      case "sakit":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Sakit</Badge>;
      default:
        return <Badge variant="secondary">{presensi}</Badge>;
    }
  };

  const stats = {
    totalHadir: dashboardData?.statistik.hadir || 0,
    totalTerlambat: dashboardData?.statistik.terlambat || 0,
    totalIzin: dashboardData?.statistik.izin || 0,
    totalSakit: dashboardData?.statistik.sakit || 0,
    totalPulang: dashboardData?.statistik.pulang || 0,
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
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
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[150px] text-center">
              {new Date(selectedYear, selectedMonth).toLocaleDateString("id-ID", { 
                month: "long",
                year: "numeric"
              })}
            </div>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
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
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Izin</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalIzin}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sakit</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSakit}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pulang</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPulang}</p>
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
              {paginatedData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data presensi untuk bulan ini
                </div>
              ) : (
                paginatedData.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="font-medium">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", { 
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </div>
                    <div>{getStatusBadge(item.presensi)}</div>
                    <div className="text-sm text-muted-foreground">{item.jam}</div>
                    <div className="text-sm text-muted-foreground truncate">{item.lokasi}</div>
                    <div className="text-sm">
                      {item.maps && (
                        <a href={item.maps} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Maps
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {paginatedData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data presensi untuk bulan ini
              </div>
            ) : (
              paginatedData.map((item, idx) => (
                <div key={idx} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", { 
                        day: "2-digit",
                        month: "short"
                      })}
                    </div>
                    {getStatusBadge(item.presensi)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.jam}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{item.lokasi}</span>
                    </div>
                  </div>
                  {item.maps && (
                    <a href={item.maps} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Lihat di Maps →
                    </a>
                  )}
                </div>
              ))
            )}
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