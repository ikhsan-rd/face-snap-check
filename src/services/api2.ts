// Google Apps Script API service
import { APPS_SCRIPT_URL } from "@/config/api";

export interface User {
  id: string;
  nama: string;
  departemen: string;
}

export interface PresensiRecord {
  tanggal: string;
  jam: string;
  presensi: string;
  lokasi: string;
  maps: string;
  foto: string;
}

export interface DashboardData {
  bulan: string;
  records: PresensiRecord[];
  statistik: {
    hadir: number;
    izin: number;
    sakit: number;
    pulang: number;
    terlambat: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// --- UUID Helpers ---
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceUUID(): string {
  let uuid = localStorage.getItem("device_uuid");
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem("device_uuid", uuid);
  }
  return uuid;
}

// --- GET Requests ---
export async function cekUser(
  userId: string
): Promise<ApiResponse<{ exists: boolean } & User>> {
  const url = `${APPS_SCRIPT_URL}?action=cekUser&id=${encodeURIComponent(
    userId
  )}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Gagal mengecek user: " + (error as Error).message,
    };
  }
}

export async function fetchDashboard(
  userId: string,
  bulanFilter?: string
): Promise<ApiResponse<DashboardData>> {
  const uuid = getDeviceUUID();
  const params = new URLSearchParams({
    action: "dashboard",
    id: userId,
    uuid,
  });

  if (bulanFilter) {
    params.append("bulanFilter", bulanFilter);
  }

  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Gagal mengambil data dashboard: " + (error as Error).message,
    };
  }
}

// --- POST Requests ---
export async function registerUser(
  userId: string,
  password: string
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append("action", "register");
  formData.append("id", userId);
  formData.append("password", password);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Gagal mendaftar: " + (error as Error).message,
    };
  }
}

export async function loginUser(
  userId: string,
  password: string
): Promise<ApiResponse<User>> {
  const uuid = getDeviceUUID();
  const formData = new FormData();
  formData.append("action", "login");
  formData.append("id", userId);
  formData.append("password", password);
  formData.append("uuid", uuid);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (data.success) {
      localStorage.setItem("user_data", JSON.stringify(data.data));
      localStorage.setItem("is_logged_in", "true");
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: "Gagal login: " + (error as Error).message,
    };
  }
}

export async function logoutUser(userId: string): Promise<ApiResponse> {
  const uuid = getDeviceUUID();
  const formData = new FormData();
  formData.append("action", "logout");
  formData.append("id", userId);
  formData.append("uuid", uuid);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    // Clear session meskipun API gagal
    localStorage.removeItem("user_data");
    localStorage.removeItem("is_logged_in");

    return data;
  } catch (error) {
    localStorage.removeItem("user_data");
    localStorage.removeItem("is_logged_in");

    return {
      success: false,
      message: "Gagal logout: " + (error as Error).message,
    };
  }
}

export async function submitPresensi(presensiData: {
  id: string;
  nama: string;
  departemen: string;
  presensi: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  maps?: string;
  latitude?: number;
  longitude?: number;
  photoData: string;
  photoFileName?: string;
  fingerprint?: string;
}): Promise<ApiResponse> {
  const uuid = getDeviceUUID();
  const formData = new FormData();

  formData.append("action", "presensi");
  formData.append("id", presensiData.id);
  formData.append("nama", presensiData.nama);
  formData.append("departemen", presensiData.departemen);
  formData.append("presensi", presensiData.presensi);
  formData.append("tanggal", presensiData.tanggal);
  formData.append("jam", presensiData.jam);
  formData.append("lokasi", presensiData.lokasi);
  formData.append("uuid", uuid);
  formData.append("photoData", presensiData.photoData);

  if (presensiData.maps) formData.append("maps", presensiData.maps);
  if (presensiData.latitude !== undefined)
    formData.append("latitude", presensiData.latitude.toString());
  if (presensiData.longitude !== undefined)
    formData.append("longitude", presensiData.longitude.toString());
  if (presensiData.photoFileName)
    formData.append("photoFileName", presensiData.photoFileName);
  if (presensiData.fingerprint)
    formData.append("fingerprint", presensiData.fingerprint);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Gagal submit presensi: " + (error as Error).message,
    };
  }
}

// --- Session Helpers ---
export function isLoggedIn(): boolean {
  return localStorage.getItem("is_logged_in") === "true";
}

export function getCurrentUser(): User | null {
  const userData = localStorage.getItem("user_data");
  return userData ? JSON.parse(userData) : null;
}

export function clearUserSession(): void {
  localStorage.removeItem("user_data");
  localStorage.removeItem("is_logged_in");
}
