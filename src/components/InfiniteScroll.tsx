import { ReactNode, useMemo, useState } from "react";
import InfiniteScrollComponent from "react-infinite-scroll-component";

import { LoaderFill } from "./Loader";

const DEFAULT_PAGE_SIZE = 50;

interface InfiniteScrollProps<T> {
  data: T[];
  renderItem: (data: T) => ReactNode;
  pageSize?: number;
  scrollableTarget?: ReactNode;
}

export function InfiniteScroll<T>({ data, renderItem, pageSize, scrollableTarget }: InfiniteScrollProps<T>) {
  const [itemNumber, setItemNumber] = useState<number>(pageSize || DEFAULT_PAGE_SIZE);

  const next = () => setItemNumber((prev) => prev + (pageSize || DEFAULT_PAGE_SIZE));

  const visibleItems = useMemo(
    () =>
      data.slice(0, itemNumber).map((d) => {
        return renderItem(d);
      }),
    [renderItem, data, itemNumber],
  );

  return (
    <InfiniteScrollComponent
      scrollableTarget={scrollableTarget}
      dataLength={itemNumber}
      hasMore={itemNumber < data.length}
      loader={<LoaderFill />}
      next={next}
    >
      {visibleItems}
    </InfiniteScrollComponent>
  );
}
