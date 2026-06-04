export default function FirebaseSetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stadium px-4 text-slate-100">
      <div className="glass max-w-2xl rounded-[2rem] p-8 shadow-glow">
        <p className="font-display text-3xl font-extrabold">Firebase chưa được cấu hình</p>
        <p className="mt-4 text-slate-300">
          App hiện chưa có biến môi trường Firebase nên không thể hiển thị dữ liệu. Hãy tạo file
          <span className="mx-1 rounded bg-white/10 px-2 py-1 font-mono text-sm">.env</span>
          theo mẫu
          <span className="mx-1 rounded bg-white/10 px-2 py-1 font-mono text-sm">.env.example</span>
          và điền đầy đủ các khóa Firebase.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="mb-2 text-sm uppercase tracking-[0.25em] text-violet-300">Cần các biến</p>
          <code className="block whitespace-pre-wrap text-sm leading-6 text-slate-200">
            VITE_FIREBASE_API_KEY{'\n'}
            VITE_FIREBASE_AUTH_DOMAIN{'\n'}
            VITE_FIREBASE_PROJECT_ID{'\n'}
            VITE_FIREBASE_STORAGE_BUCKET{'\n'}
            VITE_FIREBASE_MESSAGING_SENDER_ID{'\n'}
            VITE_FIREBASE_APP_ID
          </code>
        </div>
      </div>
    </div>
  );
}
