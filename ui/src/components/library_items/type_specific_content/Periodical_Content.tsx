import type { Library_Item } from '../../../types/item_types';

export function Periodical_Content({
  library_item,
}: {
  library_item: Library_Item;
}) {
  return <div>Periodical Content {library_item.title}</div>;
}
