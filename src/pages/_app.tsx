import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { SideDrawer } from "~/components/SideDrawer";
import { useRef } from "react";

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
      <Head>
        <title>Bird Is The Word</title>
        <meta name="description" content="This is a social media app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        data-theme="mytheme"
        className="drawer-mobile container drawer mx-auto"
      >
        <input
          ref={checkboxRef}
          id="my-drawer-2"
          type="checkbox"
          className="drawer-toggle"
        />
        <div className="drawer-content" id="infiniteScrollTarget">
          <Component {...pageProps} />
        </div>
        <div className="drawer-side">
          <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
          <SideDrawer onItemClick={closeSideDrawer} />
        </div>
      </div>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
