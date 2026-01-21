import type { Library_Item } from '../../../types/item_types';

export function Magazine_Content({
  library_item,
}: {
  library_item: Library_Item;
}) {
  return <div>Magazine Content {library_item.title}</div>;
}
