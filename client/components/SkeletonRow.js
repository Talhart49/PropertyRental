export default function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 pr-4"><div className="h-4 w-32 bg-surface-200 rounded" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-48 bg-surface-200 rounded" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-16 bg-surface-200 rounded-full" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-28 bg-surface-200 rounded ml-auto" /></td>
    </tr>
  );
}