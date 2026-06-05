"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Image,
  BarChart3,
  Activity,
  Settings,
  FolderKanban,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Blogs",
    href: "/admin/blogs",
    icon: FileText,
  },
  {
    name: "Case Studies",
    href: "/admin/case-studies",
    icon: FolderKanban,
    roles: ["admin", "editor", "writer"],
  },
  {
    name: "Careers",
    href: "/admin/careers",
    icon: Briefcase,
    roles: ["admin", "editor"],
  },
  {
    name: "Media",
    href: "/admin/media",
    icon: Image,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    name: "Activity",
    href: "/admin/activity",
    icon: Activity,
    roles: ["admin"],
  },
  {
    name: "Team",
    href: "/admin/team",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(profile?.role || "");
  });

  // Split into main nav and bottom nav (Settings always at bottom)
  const mainNav = filteredNavigation.filter((item) => item.name !== "Settings");
  const bottomNav = filteredNavigation.filter((item) => item.name === "Settings");

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy dark:bg-blue rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-navy font-clash font-bold text-lg">
                R
              </span>
            </div>
            <div>
              <h1 className="font-clash font-bold text-lg text-navy dark:text-blue">
                Refactrd
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Content CMS
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            {/* Main nav items */}
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {mainNav.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + "/");
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-gray-100 dark:bg-gray-800 text-navy dark:text-blue"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-navy dark:text-blue"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-navy dark:group-hover:text-blue",
                            "h-5 w-5 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Bottom: Settings pinned to bottom */}
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                {/* User info */}
                {profile && (
                  <li className="mb-2 px-2 py-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy dark:bg-blue flex items-center justify-center flex-shrink-0">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-white dark:text-navy font-clash font-bold text-xs">
                            {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {profile.full_name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                          {profile.role}
                        </p>
                      </div>
                    </div>
                  </li>
                )}

                {bottomNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-gray-100 dark:bg-gray-800 text-navy dark:text-blue"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-navy dark:text-blue"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-navy dark:group-hover:text-blue",
                            "h-5 w-5 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}