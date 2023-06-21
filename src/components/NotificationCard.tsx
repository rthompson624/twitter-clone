import Link from "next/link";
import { type NotificationWithRelations } from "~/server/api/routers/notification";
import { ProfileImage } from "./ProfileImage";
import { dateTimeFormatter, forceString } from "~/utils/helperFunctions";
import { VscClose } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { useDeleteNotification } from "~/hooks/useDeleteNotification";

export function NotificationCard({
  notification,
}: {
  notification: NotificationWithRelations;
}) {
  const deleteNotification = useDeleteNotification();

  function formatMessage() {
    let actionPhrase = "";
    switch (notification.type) {
      case "NEW_FOLLOWER":
        actionPhrase = "is now following you.";
        break;
      case "SIBLING_COMMENT":
        actionPhrase = "commented on a tweet you commented on.";
        break;
      case "TWEET_COMMENT":
        actionPhrase = "commented on a tweet of yours.";
        break;
      case "TWEET_LIKE":
        actionPhrase = "liked a tweet of yours.";
        break;
      case "TWEET_RETWEET":
        actionPhrase = "retweeted a tweet of yours.";
        break;
    }
    return `${forceString(notification.notifyer.name)} ${actionPhrase}`;
  }

  return (
    <div className="flex items-center gap-4 border-b py-4 pl-4 pr-3">
      <Link href={`/profiles/${notification.notifyer.id}`}>
        <ProfileImage src={notification.notifyer.image} />
      </Link>
      <Link
        href={`/${notification.resourcePath}/${notification.resourceId}`}
        onClick={() => deleteNotification.mutate({ id: notification.id })}
        className="flex-grow"
      >
        <div className="text-xs text-gray-500">
          {dateTimeFormatter.format(notification.createdAt)}
        </div>
        <p>{formatMessage()}</p>
      </Link>
      <IconHoverEffect color={"red"}>
        <VscClose
          className="h-7 w-7 cursor-pointer"
          onClick={() => deleteNotification.mutate({ id: notification.id })}
        />
      </IconHoverEffect>
    </div>
  );
}
