import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePusher } from "~/context/PusherContext";
import { api } from "~/utils/api";
import {
  type NotificationWithRelationsSerialized,
  deserializeNotification,
} from "~/utils/helperFunctions";

export function useNotificationUpdates() {
  const session = useSession();
  const currentUserId = session.data?.user.id;
  const trpcCtx = api.useContext();
  const pusher = usePusher();
  useEffect(() => {
    const channel = pusher.subscribe("channel.notification");
    channel.bind(
      "notification.new",
      (serializedNotification: NotificationWithRelationsSerialized) => {
        const notification = deserializeNotification(serializedNotification);
        if (notification.notifyee.id === currentUserId) {
          trpcCtx.notification.getNotifications.setData(
            undefined,
            (oldData) => {
              if (oldData == null) return;
              const filteredData = oldData.filter(
                (iter) => iter.id !== notification.id
              );
              return [...filteredData, notification];
            }
          );
        }
      }
    );
    return () => {
      pusher.unsubscribe("channel.notification");
    };
  }, [trpcCtx, currentUserId, pusher]);
}
