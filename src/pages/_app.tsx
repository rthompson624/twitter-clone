import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { SideDrawer } from "~/components/SideDrawer";
import { useRef } from "react";
import { PusherProvider } from "~/context/PusherContext";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  const closeSideDrawer = () => {
    checkboxRef.current?.click();
  };

  return (
    <SessionProvider session={session}>
      <PusherProvider>
        <Head>
          <title>Bird Is The Word</title>
          <meta name="description" content="This is a social media app" />
          <meta
            name="google-site-verification"
            content="j9EX4K5jDJS3JElBIr78Ims6q_idnfeQ5QKCUHQ-yBk"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div
          data-theme="mytheme"
          className="drawer-mobile container drawer mx-auto max-w-xl lg:max-w-3xl"
        >
          <input
            ref={checkboxRef}
            id="my-drawer-2"
            type="checkbox"
            className="drawer-toggle"
          />
          <div className="drawer-content lg:!z-20" id="infiniteScrollTarget">
            <Component {...pageProps} />
          </div>
          <div className="drawer-side">
            <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
            <SideDrawer onItemClick={closeSideDrawer} />
          </div>
        </div>
      </PusherProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
