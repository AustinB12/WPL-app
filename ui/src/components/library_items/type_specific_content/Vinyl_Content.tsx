import type { Library_Item } from '../../../types/item_types';

export function Vinyl_Content({
  library_item,
}: {
  library_item: Library_Item;
}) {
  return <div>Vinyl Content {library_item.title}</div>;
}
