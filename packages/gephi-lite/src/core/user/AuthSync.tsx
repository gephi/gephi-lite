import { FC, useEffect, useRef } from "react";

import { useConnectedUser } from "./index";

export const AuthSync: FC = () => {
    const [, setUser] = useConnectedUser();
    const mounted = useRef(false);

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;

        const { auth } = window.datavizSupabase || {};
        if (!auth) return;

        const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
            if (
                event === "SIGNED_IN" ||
                event === "TOKEN_REFRESHED" ||
                event === "INITIAL_SESSION"
            ) {
                if (session) {
                    setUser({
                        id: session.user.id,
                        name: session.user.email || "No Name",
                        avatar: undefined,
                        // provider is no longer used - managed by dataviz-tool-header API
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
