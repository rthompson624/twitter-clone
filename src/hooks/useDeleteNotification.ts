import { api } from "~/utils/api";

export function useDeleteNotification() {
  const trpcCtx = api.useContext();
  return api.notification.delete.useMutation({
    onSuccess: (_) => {
      void trpcCtx.notification.getNotifications.invalidate();
      // trpcCtx.notification.getNotifications.setData(undefined, (oldData) => {
      //   if (oldData == null) return;
      //   return oldData.filter((itr) => itr.id !== notification.id);
      // });
    },
  });
}
