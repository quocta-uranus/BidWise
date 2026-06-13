export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[46%] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-black text-base">B</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">BidWise</span>
          </div>

          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Tìm kiếm freelancer<br />
            <span className="text-blue-200">thông minh hơn.</span>
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-xs">
            Nền tảng đấu thầu freelance với thuật toán AHP-TOPSIS — xếp hạng bid đa tiêu chí, minh bạch và công bằng.
          </p>
        </div>

        <div className="relative space-y-3">
          {[
            { icon: "⚡", text: "Xếp hạng bid tự động theo AHP-TOPSIS" },
            { icon: "🔒", text: "Sealed-bid auction — giá không bị lộ" },
            { icon: "📊", text: "Explainable AI — biết rõ lý do chọn bid" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                {item.icon}
              </div>
              <span className="text-blue-100 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">B</span>
            </div>
            <span className="text-slate-900 font-bold text-lg">BidWise</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}