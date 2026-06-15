import Link from 'next/link';

const portals = [
  {
    href: '/login/client',
    title: 'Client',
    desc: 'Đăng job, tìm freelancer và quản lý dự án',
    icon: '💼',
    color: 'hover:border-blue-400 hover:bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    href: '/login/freelancer',
    title: 'Freelancer',
    desc: 'Tìm việc, đấu thầu và quản lý hợp đồng',
    icon: '🚀',
    color: 'hover:border-violet-400 hover:bg-violet-50/50',
    badge: 'bg-violet-100 text-violet-700',
  },
  {
    href: '/login/admin',
    title: 'Admin',
    desc: 'Quản trị tài khoản và hệ thống',
    icon: '🛡️',
    color: 'hover:border-red-400 hover:bg-red-50/50',
    badge: 'bg-red-100 text-red-700',
  },
];

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Chọn cổng đăng nhập</h2>
        <p className="text-slate-500 text-sm">Mỗi vai trò có cổng riêng — hãy chọn đúng loại tài khoản của bạn</p>
      </div>

      <div className="space-y-3">
        {portals.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white transition-all group ${p.color}`}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              {p.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{p.title}</p>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${p.badge}`}>Portal</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
            </div>
            <span className="text-slate-300 group-hover:text-slate-500 text-lg">→</span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">
          Đăng ký Client / Freelancer
        </Link>
      </p>
    </div>
  );
}
