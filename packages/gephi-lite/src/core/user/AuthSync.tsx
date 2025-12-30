import { FC, useEffect, useRef } from "react";

import { DatavizCloudProvider } from "../cloud/dataviz/provider";
import { useConnectedUser } from "./index";

export const AuthSync: FC = () => {
    const [, setUser] = useConnectedUser();
    const mounted = useRef(false);

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;

        const { auth } = window.supabase || {};
        if (!auth) return;

        const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
            if (
                event === "SIGNED_IN" ||
                event === "TOKEN_REFRESHED" ||
                event === "INITIAL_SESSION"
            ) {
                if (session) {
                    const provider = new DatavizCloudProvider();
                    setUser({
                        id: session.user.id,
                        name: session.user.email || "No Name",
                        avatar: undefined,
                        provider,
                    });
                }
            } else if (event === "SIGNED_OUT") {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser]);

    return null;
};
