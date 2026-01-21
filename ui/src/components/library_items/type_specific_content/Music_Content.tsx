import type { Library_Item } from '../../../types/item_types';

export function Music_Content({
  library_item,
}: {
  library_item: Library_Item;
}) {
  return <div>Music Content {library_item.title}</div>;
}
