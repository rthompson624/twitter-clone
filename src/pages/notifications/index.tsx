import { type NextPage } from "next";
import ErrorPage from "next/error";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { MdMenu } from "react-icons/md";
import { NotificationInbox } from "~/components/NotificationInbox";
import { api } from "~/utils/api";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { NotificationCard } from "~/components/NotificationCard";

const NotificationsPage: NextPage = () => {
  const session = useSession();
  const {
    data: notifications,
    isLoading,
    isError,
  } = api.notification.getNotifications.useQuery();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>Bird Is The Word - Notifications</title>
      </Head>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <div className="ml-4 hidden pb-2 lg:block">
          <div className="flex gap-4">
            <div className="text-lg font-bold">Notifications</div>
            {session.status === "authenticated" ? (
              <div className="flex flex-grow flex-row-reverse pr-6 pt-2">
                <NotificationInbox />
              </div>
            ) : (
              <div className="mb-5">(sign in to post & comment)</div>
            )}
          </div>
        </div>
        <div className="flex gap-4 pb-2 pl-4 pt-2 lg:hidden">
          <label htmlFor="my-drawer-2" className="hover:cursor-pointer">
            <MdMenu className="h-6 w-6" />
          </label>
          <div className="text-lg font-bold">Notifications</div>
          {session.status === "authenticated" ? (
            <div className="flex flex-grow flex-row-reverse pr-6">
              <NotificationInbox />
            </div>
          ) : (
            <div className="mb-5">(sign in to post & comment)</div>
          )}
        </div>
      </header>
      <main>
        <div className="flex flex-col">
          {notifications.map((notification) => (
            <NotificationCard
              notification={notification}
              key={notification.id}
            />
          ))}
        </div>
      </main>
    </>
  );
};

export default NotificationsPage;
