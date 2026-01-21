import type { Library_Item } from '../../../types/item_types';

export function Cd_Content({ library_item }: { library_item: Library_Item }) {
  return <div>CD Content {library_item.title}</div>;
}
