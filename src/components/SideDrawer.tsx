import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { VscAccount, VscHome, VscSignIn, VscSignOut } from "react-icons/vsc";

type SideDrawerProps = {
  onItemClick: () => void;
};

export function SideDrawer({ onItemClick }: SideDrawerProps) {
  const session = useSession();
  const user = session.data?.user;

  function onSignIn() {
    onItemClick();
    void signIn();
  }

  function onSignOut() {
    onItemClick();
    void signOut();
  }

  return (
    <ul className="menu w-52 bg-base-100 p-4 text-base-content">
      <li>
        <Link href="/" onClick={() => onItemClick()}>
          <VscHome className="h-7 w-7" />
          <span className="text-lg font-bold">Home</span>
        </Link>
      </li>
      {user != null && (
        <li>
          <Link href={`/profiles/${user.id}`} onClick={() => onItemClick()}>
            <VscAccount className="h-7 w-7" />
            <span className="text-lg font-bold">Profile</span>
          </Link>
        </li>
      )}
      {user == null ? (
        <li>
          <button onClick={() => onSignIn()}>
            <VscSignIn className="h-7 w-7 fill-green-700" />
            <span className="text-lg font-bold text-green-700">Sign In</span>
          </button>
        </li>
      ) : (
        <li>
          <button onClick={() => void onSignOut()}>
            <VscSignOut className="h-7 w-7" />
            <span className="text-lg font-bold">Sign Out</span>
          </button>
        </li>
      )}
    </ul>
  );
}
