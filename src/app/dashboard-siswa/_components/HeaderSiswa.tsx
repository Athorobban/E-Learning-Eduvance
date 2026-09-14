export default function HeaderSiswa() {
  return (
    <header className="w-full bg-white shadow p-4 flex justify-between items-center">
      <h3 className="text-lg font-semibold text-blue-700">Selamat Datang 👋</h3>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-200 rounded-full" />
        <span className="font-medium">Siswa</span>
      </div>
    </header>
  );
}
