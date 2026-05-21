"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Radar, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { C } from "@/lib/colors";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/mapa", label: "Mapa" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 h-16 backdrop-blur"
      style={{ borderBottom: `1px solid ${C.border}`, background: `${C.bg}e6` }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Radar
            className="h-5 w-5 radar-spin"
            style={{ color: C.neonGreen }}
          />
          <span
            className="text-lg font-bold"
            style={{
              background: C.gradientPrimary,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Local Radar
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px]",
                  "after:rounded-full after:transition-all after:duration-200",
                  active
                    ? "after:opacity-100"
                    : "text-muted-foreground hover:text-foreground after:opacity-0 hover:after:opacity-60"
                )}
                style={
                  active
                    ? {
                        color: C.neonGreen,
                        textShadow: `0 0 8px ${C.neonGreen}66`,
                      }
                    : {}
                }
              >
                <span
                  className="after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px]"
                  style={
                    active
                      ? {
                          background: C.gradientPrimary,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }
                      : {}
                  }
                >
                  {link.label}
                </span>
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ background: C.gradientPrimary }}
                  />
                )}
              </Link>
            );
          })}

          <Button
            variant="ghost"
            size="icon"
            className="ml-2 relative"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
