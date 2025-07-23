import { Property } from "csstype";
import React, { HTMLAttributes, PropsWithChildren, forwardRef, useEffect, useState } from "react";

const Transition = forwardRef<
  HTMLDivElement,
  PropsWithChildren<
    {
      show: unknown;
      mountTransition?: Property.Animation;
      unmountTransition?: Property.Animation;
    } & HTMLAttributes<HTMLDivElement>
  >
>(({ children, show, mountTransition, unmountTransition, ...props }, ref) => {
  const [shouldRender, setRender] = useState(show);

  useEffect(() => {
    if (show) setRender(true);
    else if (!show && !unmountTransition) setRender(false);
  }, [show, unmountTransition]);

  return show || shouldRender ? (
    <div
      ref={ref}
      {...props}
      style={{ ...(props.style || {}), animation: show ? mountTransition : unmountTransition }}
      onAnimationEnd={() => {
        if (!show) setRender(false);
      }}
    >
      {children}
    </div>
  ) : null;
});

export default Transition;
