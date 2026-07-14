import { useRouter } from "next/navigation";
import { AppNotification } from "@/services/notification.service";
import { MessageCircle, PhoneMissed, UserPlus, Users, UserMinus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => Promise<void>;
  onCloseDropdown: () => void;
  onAcceptContact: (notificationId: string, issuerId: string) => Promise<void>;
  isProcessing: boolean;
  isResolved: boolean;
}

function getRelativeTimeShort(dateString: string, t: any) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t("just_now");
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return date.toLocaleDateString();
}

export function NotificationItem({ notification, onMarkAsRead, onCloseDropdown, onAcceptContact, isProcessing, isResolved }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const router = useRouter();

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onCloseDropdown();

    switch (notification.type) {
      case "MESSAGE":
        if (notification.routeId) router.push(`/chats/${notification.routeId}`);
        break;
      case "GROUP_ADDED":
        if (notification.routeId) router.push(`/groups/${notification.routeId}`);
        break;
      case "CALL_MISSED":
        if (notification.issuerId) router.push(`/chats/${notification.issuerId}`);
        break;
      case "CONTACT_ADDED":
        router.push(`/contacts`);
        break;
      case "GROUP_REMOVED":
        // Do nothing (just mark as read)
        break;
      case "CHANNEL_INVITATION":
      case "CHANNEL_MESSAGE":
      case "CHANNEL_UPDATE":
        if (notification.routeId) {
          router.push(`/business/channels/${notification.routeId}`);
        } else {
          router.push(`/business/channels`);
        }
        break;
      default:
        break;
    }
  };

  const issuerName = notification.issuer?.profile?.displayName || "Someone";
  const avatarUrl = notification.issuer?.profile?.avatarUrl;

  let Icon = Info;
  let iconClass = "text-gray-500";
  let textContent = <></>;

  switch (notification.type) {
    case "MESSAGE":
      Icon = MessageCircle;
      iconClass = "text-blue-500";
      textContent = (
        <>
          <span className="font-semibold text-foreground">{issuerName}</span> {t("msg_sent")}
        </>
      );
      break;
    case "CALL_MISSED":
      Icon = PhoneMissed;
      iconClass = "text-red-500";
      textContent = (
        <>
          {t("msg_missed_call")} <span className="font-semibold text-foreground">{issuerName}</span>.
        </>
      );
      break;
    case "CONTACT_ADDED":
      Icon = UserPlus;
      iconClass = "text-blue-500";
      textContent = (
        <>
          <span className="font-semibold text-foreground">{issuerName}</span> {t("msg_contact_added")}
        </>
      );
      break;
    case "GROUP_ADDED":
      Icon = Users;
      iconClass = "text-green-500";
      textContent = (
        <>
          <span className="font-semibold text-foreground">{issuerName}</span> {t("msg_group_added")}
        </>
      );
      break;
    case "GROUP_REMOVED":
      Icon = UserMinus;
      iconClass = "text-gray-500";
      textContent = (
        <>
          <span className="font-semibold text-foreground">{issuerName}</span> {t("msg_group_removed")}
        </>
      );
      break;
    case "CHANNEL_INVITATION":
    case "CHANNEL_UPDATE":
      Icon = Users;
      iconClass = "text-indigo-600";
      textContent = (
        <>
          <span className="font-semibold text-foreground">{issuerName}</span> {notification.content || "updated channel membership"}
        </>
      );
      break;
    case "CHANNEL_MESSAGE":
      Icon = MessageCircle;
      iconClass = "text-blue-600";
      textContent = (
        <>
          <span className="font-semibold text-foreground">{issuerName}</span> {notification.content || "posted an update in a channel"}
        </>
      );
      break;
    default:
      textContent = (
        <>
          <span className="font-semibold text-foreground">{issuerName}</span> {t("msg_event")}
        </>
      );
      break;
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50",
        !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
      )}
    >
      <div className="shrink-0 relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={issuerName}
            className="h-12 w-12 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border">
            <Icon className={`h-5 w-5 ${iconClass}`} />
          </div>
        )}
        {avatarUrl && (
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/50">
            <Icon className={`h-3 w-3 ${iconClass}`} />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col pt-1">
        <p className="text-sm text-muted-foreground leading-snug">
          {textContent}
        </p>

        {notification.type === "CONTACT_ADDED" && !isResolved && (
          <div className="flex gap-2 mt-2 mb-1">
            <Button 
              variant="default" 
              size="sm" 
              className="h-7 text-xs" 
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                if (notification.issuerId) {
                  onAcceptContact(notification.id, notification.issuerId);
                }
              }}
            >
              {isProcessing ? t("adding") : t("add_back")}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              {t("dismiss")}
            </Button>
          </div>
        )}

        <span className="text-xs font-medium text-muted-foreground mt-1">
          {getRelativeTimeShort(notification.createdAt, t)}
        </span>
      </div>

      {!notification.isRead && (
        <div className="shrink-0 pt-3 pl-2 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
        </div>
      )}
    </div>
  );
}
