import { type ReactNode, createContext, useContext, useMemo } from "react";
import Pusher from "pusher-js";
import { env } from "~/env.mjs";

const PusherContext = createContext<Pusher | null>(null);

export function PusherProvider({ children }: { children: ReactNode }) {
  const pusher = useMemo(
    () =>
      new Pusher(env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
      }),
    []
  );
  return (
    <PusherContext.Provider value={pusher}>{children}</PusherContext.Provider>
  );
}

export function usePusher() {
  const pusher = useContext(PusherContext);
  if (!pusher) {
    throw new Error("usePusher() has to be used within <PusherProvider>");
  }
  return pusher;
}
