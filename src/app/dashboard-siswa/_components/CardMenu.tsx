import Link from "next/link";

interface CardMenuProps {
  title: string;
  href: string;
  color: string;
}

export default function CardMenu({ title, href, color }: CardMenuProps) {
  return (
    <Link href={href} className={`${color} text-white rounded-xl p-6 shadow-md hover:scale-[1.02] transition`}>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="opacity-80">Klik untuk membuka</p>
    </Link>
  );
}
