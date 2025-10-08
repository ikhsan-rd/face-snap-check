# AppScript Update - checkSession Function

Ganti fungsi `checkSession` di Google Apps Script dengan versi yang lebih deskriptif ini:

```javascript
// VALIDASI SESSION / UUID (Updated Version)
function checkSession(id, uuid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Data");

  if (!id || !uuid) {
    return buatRespon(false, "Parameter tidak lengkap");
  }

  const idNormalized = String(id).trim().toLowerCase();
  const uuidNormalized = String(uuid).trim().toLowerCase();

  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const sheetId = String(data[i][1] || "").trim().toLowerCase();
    
    if (sheetId === idNormalized) {
      const sheetUuid = String(data[i][6] || "").trim().toLowerCase();
      
      // UUID kosong di sheet = belum login / sudah logout
      if (!sheetUuid) {
        tulisLogAktifitas("checkSession", "Validasi", id, { uuid }, "Gagal - UUID kosong di sheet");
        return buatRespon(false, "Sesi kadaluarsa, silakan login kembali");
      }
      
      // UUID cocok = sesi valid
      if (sheetUuid === uuidNormalized) {
        tulisLogAktifitas("checkSession", "Validasi", id, { uuid }, "Berhasil - Sesi valid");
        return buatRespon(true, "Sesi valid");
      }
      
      // UUID tidak cocok = login di device lain
      tulisLogAktifitas("checkSession", "Validasi", id, { uuid, sheetUuid }, "Gagal - UUID tidak cocok");
      return buatRespon(false, "Sesi kadaluarsa, akun digunakan di perangkat lain");
    }
  }

  tulisLogAktifitas("checkSession", "Validasi", id, { uuid }, "Gagal - User tidak ditemukan");
  return buatRespon(false, "User tidak ditemukan");
}
```

## Perubahan yang dilakukan:

1. **Validasi parameter** - Cek id dan uuid tidak kosong
2. **UUID kosong** - Return pesan "Sesi kadaluarsa, silakan login kembali"
3. **UUID tidak cocok** - Return pesan "Sesi kadaluarsa, akun digunakan di perangkat lain"
4. **Logging aktivitas** - Semua case dicatat di LogAktifitas
5. **Pesan error lebih deskriptif** - Memudahkan troubleshooting

## Cara Update:

1. Buka Google Apps Script
2. Cari fungsi `checkSession`
3. Replace dengan kode di atas
4. Save dan deploy ulang
