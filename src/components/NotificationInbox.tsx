import Link from "next/link";
import { VscInbox } from "react-icons/vsc";
import { useNotificationUpdates } from "~/hooks/useNotificationUpdates";
import { api } from "~/utils/api";

export function NotificationInbox() {
  const { data: notifications } = api.notification.getNotifications.useQuery();
  useNotificationUpdates();

  return (
    <Link href={"/notifications"}>
      <div className="indicator">
        {notifications && notifications.length > 0 && (
          <span className="badge-primary badge indicator-item">
            {notifications.length}
          </span>
        )}
        <VscInbox className="h-6 w-6" />
      </div>
    </Link>
  );
}
