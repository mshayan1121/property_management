"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CalendarClock, FileWarning, CreditCard, Wrench, Handshake, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { parseISO } from "date-fns";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lease_expiry: CalendarClock,
  overdue_invoice: FileWarning,
  pdc_due: CreditCard,
  maintenance: Wrench,
  deal: Handshake,
  general: Info,
};

const TYPE_COLORS: Record<string, string> = {
  lease_expiry: "text-amber-600 dark:text-amber-400",
  overdue_invoice: "text-red-600 dark:text-red-400",
  pdc_due: "text-blue-600 dark:text-blue-400",
  maintenance: "text-violet-600 dark:text-violet-400",
  deal: "text-green-600 dark:text-green-400",
  general: "text-muted-foreground",
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string, link: string | null) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setOpen(false);
    if (link) {
      router.push(link);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const IconComponent = Bell;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <IconComponent className="size-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground"
              suppressHydrationWarning
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[360px] max-h-[400px] overflow-y-auto p-0"
        align="end"
        sideOffset={8}
        suppressHydrationWarning
      >
        <div className="border-b px-3 py-2 flex items-center justify-between">
          <span className="font-medium text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.preventDefault();
                markAllRead();
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] ?? Info;
              const colorClass = TYPE_COLORS[n.type] ?? TYPE_COLORS.general;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`w-full text-left px-3 py-2.5 flex gap-3 hover:bg-accent/50 border-b border-border/50 last:border-b-0 ${
                    !n.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => markAsRead(n.id, n.link)}
                >
                  <Icon className={`size-4 shrink-0 mt-0.5 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{n.title}</p>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-muted-foreground/80 text-xs mt-1">
                      {formatDistanceToNow(parseISO(n.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
