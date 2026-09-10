import { CoinsIcon, School } from "lucide-react";
import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-4 right-4"></div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="p-2 bg-primary rounded-lg">
            <CoinsIcon className="text-white size-6" />
          </div>
          <span className="font-extrabold text-2xl text-slate-800 tracking-tight">
            Finnotes<span className="text-primary">App</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
